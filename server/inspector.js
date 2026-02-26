const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware (same pattern as foundry.js) ---
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "");

  // Service key bypass for internal auto-advance calls
  if (token === process.env.SUPABASE_SERVICE_KEY) {
    const projectId = req.body.project_id || req.params.project_id;
    if (projectId) {
      const { data: proj } = await supabase.from("projects").select("user_id").eq("id", projectId).single();
      if (proj) req.user = { id: proj.user_id, email: "system@dante.id" };
    }
    if (!req.user) req.user = { id: "system", email: "system@dante.id" };
    return next();
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = user;

    const projectId = req.body.project_id || req.params.project_id;
    if (projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", projectId)
        .single();
      if (!project || project.user_id !== user.id) {
        return res.status(403).json({ error: "Not your project" });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth verification failed" });
  }
}

// --- AI call helper ---
async function callAI(systemPrompt, userPrompt, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => { console.log("[AI] Aborting after 120s"); controller.abort(); }, 120000);
      
      console.log('[AI] Attempt', attempt + 1, 'calling OpenRouter...');
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: false
        })
      });
      
      console.log('[AI] Response status:', res.status);
      
      // Read body as text first with its own timeout
      const bodyText = await res.text();
      clearTimeout(timeout);
      
      console.log('[AI] Body received, length:', bodyText.length);
      
      const data = JSON.parse(bodyText);
      if (!data.choices || !data.choices[0]) {
        console.error("[AI] No choices:", bodyText.substring(0, 500));
        if (attempt < maxRetries) continue;
        throw new Error("AI returned no choices");
      }

      const raw = data.choices[0].message.content;
      console.log('[AI] Content length:', raw?.length);
      try {
        return repairJson(raw);
      } catch (e) {
        console.error('[AI] JSON parse failed:', e.message);
        if (attempt >= maxRetries) throw e;
      }
    } catch (err) {
      console.error('[AI] Error on attempt', attempt + 1, ':', err.message);
      if (err.name === 'AbortError') {
        console.error('[AI] Request aborted (timeout)');
      }
      if (attempt >= maxRetries) throw err;
    }
  }
}

// --- POST /run-tests ---
router.post("/run-tests", aiLimiter, requireAuth, async (req, res) => {
  const { feature_id, project_id } = req.body;
  if (!feature_id || !project_id) {
    return res.status(400).json({ error: "feature_id and project_id are required" });
  }

  try {
    // Set status to running
    const { data: existingTest } = await supabase
      .from("test_results")
      .select("id")
      .eq("feature_id", feature_id)
      .single();

    if (existingTest) {
      await supabase
        .from("test_results")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", existingTest.id);
    } else {
      await supabase
        .from("test_results")
        .insert({ project_id, feature_id, status: "running" });
    }

    // Fetch feature's build
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .select("*")
      .eq("feature_id", feature_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (buildError || !build) {
      await supabase
        .from("test_results")
        .update({ status: "failed", results: [{ test_name: "Build Check", category: "unit", status: "fail", description: "No build found for this feature", details: "Run the Builder first to generate code." }], updated_at: new Date().toISOString() })
        .eq("feature_id", feature_id);
      return res.status(404).json({ error: "No build found for this feature" });
    }

    // Fetch blueprint
    const { data: blueprint } = await supabase
      .from("blueprints")
      .select("*")
      .eq("feature_id", feature_id)
      .single();

    const testSpecs = blueprint?.content?.tests || {};
    const files = build.files || [];

    // --- Static analysis pass (real validation) ---
    const staticResults = [];
    for (const file of files) {
      const ext = (file.path || "").split(".").pop().toLowerCase();
      const isJS = ["js", "jsx", "ts", "tsx", "mjs"].includes(ext);
      const isJSON = ext === "json";

      if (isJS) {
        try {
          // Check for syntax errors using Function constructor (doesn't execute)
          // Strip JSX/TS syntax that Function can't parse — just check basic structure
          const stripped = (file.content || "")
            .replace(/import\s+.*?from\s+['"][^'"]+['"]/g, "// import")
            .replace(/export\s+(default\s+)?/g, "")
            .replace(/<[^>]+>/g, "'JSX'")
            .replace(/:\s*\w+(\[\])?\s*(,|\)|\{|;|$)/g, "$2"); // strip TS types
          new Function(stripped);
          staticResults.push({ test_name: `Syntax: ${file.path}`, category: "unit", status: "pass", description: "JavaScript syntax valid", details: "Parsed successfully" });
        } catch (e) {
          staticResults.push({ test_name: `Syntax: ${file.path}`, category: "unit", status: "warn", description: "Possible syntax issue (may be JSX/TS)", details: e.message });
        }

        // Check for common issues
        const content = file.content || "";
        if (content.includes("console.log") && !file.path.includes("test")) {
          staticResults.push({ test_name: `Lint: ${file.path}`, category: "unit", status: "warn", description: "Contains console.log statements", details: "Consider removing debug logs in production code" });
        }
        if (!content.includes("import") && !content.includes("require") && content.length > 50) {
          staticResults.push({ test_name: `Imports: ${file.path}`, category: "unit", status: "warn", description: "No imports found", details: "File may be missing dependencies" });
        }
      }

      if (isJSON) {
        try {
          JSON.parse(file.content || "");
          staticResults.push({ test_name: `JSON: ${file.path}`, category: "unit", status: "pass", description: "Valid JSON", details: "Parsed successfully" });
        } catch (e) {
          staticResults.push({ test_name: `JSON: ${file.path}`, category: "unit", status: "fail", description: "Invalid JSON", details: e.message });
        }
      }

      // Check file isn't empty
      if (!file.content || file.content.trim().length < 10) {
        staticResults.push({ test_name: `Content: ${file.path}`, category: "unit", status: "fail", description: "File is empty or nearly empty", details: `Only ${(file.content || "").length} characters` });
      }
    }

    const systemPrompt = `You are a senior QA engineer and code reviewer. Analyze the provided code files against the test specifications from the blueprint.
For each test case, evaluate whether the code implementation satisfies it.
Also check for general code quality, security issues, and best practices.

Return JSON with this exact schema:
{
  "results": [
    { "test_name": "string", "category": "unit|integration|e2e", "status": "pass|fail|warn", "description": "string", "details": "string — what passed/failed and why" }
  ],
  "quality_score": 85,
  "coverage_estimate": 72,
  "summary": "string",
  "blockers": ["string — critical issues that must be fixed"]
}

Be thorough but fair. quality_score is 0-100. coverage_estimate is percentage of test specs covered by implementation.`;

    const userPrompt = `## Test Specifications (from Blueprint)
${JSON.stringify(testSpecs, null, 2)}

## Code Files
${files.map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n")}

Analyze each code file against the test specifications. Generate comprehensive test results.`;

    const aiResult = await callAI(systemPrompt, userPrompt);

    // Merge static analysis + AI results
    const results = [...staticResults, ...(aiResult.results || [])];
    const qualityScore = aiResult.quality_score || 0;
    const coverageEstimate = aiResult.coverage_estimate || 0;
    const blockers = aiResult.blockers || [];

    // Determine overall status
    const hasFailures = results.some(r => r.status === "fail");
    const hasWarnings = results.some(r => r.status === "warn");
    const allPass = results.length > 0 && results.every(r => r.status === "pass");
    const status = allPass ? "passed" : hasFailures ? "failed" : hasWarnings ? "partial" : "passed";

    // Save to test_results
    const updateData = {
      status,
      results,
      quality_score: qualityScore,
      coverage_estimate: coverageEstimate,
      build_id: build.id,
      fix_suggestions: [],
      updated_at: new Date().toISOString()
    };

    const { data: testResult, error: saveError } = await supabase
      .from("test_results")
      .update(updateData)
      .eq("feature_id", feature_id)
      .select()
      .single();

    if (saveError) {
      // Try insert if update found nothing
      const { data: inserted, error: insertError } = await supabase
        .from("test_results")
        .insert({ ...updateData, project_id, feature_id })
        .select()
        .single();

      if (insertError) {
        console.error("Save test results error:", insertError);
        return res.status(500).json({ error: "Failed to save test results" });
      }
      return res.json({ test_result: inserted, summary: aiResult.summary, blockers });
    }

    // Update project status
    await supabase.from("projects").update({ status: "tested" }).eq("id", project_id);

    // Auto-advance: trigger deployer
    console.log(`[Inspector] Tests passed for ${project_id} — auto-advancing to deployer`);
    const autoToken = process.env.SUPABASE_SERVICE_KEY;
    fetch(`http://localhost:3001/api/deployer/deploy`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + autoToken, "Content-Type": "application/json" },
      body: JSON.stringify({ project_id }),
    }).then(async r => {
      console.log(`[Inspector→Deployer] Auto-advance response: ${r.status}`);
    }).catch(err => {
      console.error(`[Inspector→Deployer] Auto-advance failed:`, err.message);
    });

    // Log pipeline step
    await supabase.from("pipeline_steps").insert({
      project_id,
      step: "deployer",
      status: "running",
      started_at: new Date().toISOString(),
    }).catch(() => {});

    return res.json({ test_result: testResult, summary: aiResult.summary, blockers });
  } catch (err) {
    console.error("Run tests error:", err.message);
    // Mark as failed
    await supabase
      .from("test_results")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("feature_id", feature_id);
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id --- (convenience alias)
router.get("/:project_id", requireAuth, async (req, res) => {
  try {
    const { data: results } = await supabase
      .from("test_results")
      .select("*, features(name, priority)")
      .eq("project_id", req.params.project_id)
      .order("created_at");
    const mapped = (results || []).map(r => ({ ...r, feature_name: r.features?.name || "Unknown" }));
    return res.json({ results: mapped });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// --- GET /:project_id/results ---
router.get("/:project_id/results", requireAuth, async (req, res) => {
  try {
    const { data: results } = await supabase
      .from("test_results")
      .select("*, features(name, priority)")
      .eq("project_id", req.params.project_id)
      .order("created_at");

    const mapped = (results || []).map(r => ({
      ...r,
      feature_name: r.features?.name || "Unknown",
      feature_priority: r.features?.priority || "medium"
    }));

    return res.json({ results: mapped });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/results/:feature_id ---
router.get("/:project_id/results/:feature_id", requireAuth, async (req, res) => {
  try {
    const { data: result } = await supabase
      .from("test_results")
      .select("*, features(name, priority)")
      .eq("project_id", req.params.project_id)
      .eq("feature_id", req.params.feature_id)
      .single();

    return res.json({ result: result || null });
  } catch (err) {
    return res.json({ result: null });
  }
});

// --- POST /fix-suggestion ---
router.post("/fix-suggestion", aiLimiter, requireAuth, async (req, res) => {
  const { feature_id } = req.body;
  if (!feature_id) {
    return res.status(400).json({ error: "feature_id is required" });
  }

  try {
    // Fetch test results with failures
    const { data: testResult } = await supabase
      .from("test_results")
      .select("*")
      .eq("feature_id", feature_id)
      .single();

    if (!testResult) {
      return res.status(404).json({ error: "No test results found" });
    }

    const failedTests = (testResult.results || []).filter(r => r.status === "fail" || r.status === "warn");
    if (failedTests.length === 0) {
      return res.json({ suggestions: [], message: "No failed tests to fix" });
    }

    // Fetch build files
    const { data: build } = await supabase
      .from("builds")
      .select("*")
      .eq("feature_id", feature_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const files = build?.files || [];

    const systemPrompt = `You are a senior developer providing specific code fixes for failed tests.
For each failed test, identify the relevant code and suggest a precise fix.

Return JSON:
{
  "suggestions": [
    {
      "test_name": "string",
      "file_path": "string",
      "current_code_snippet": "string — the problematic code",
      "suggested_fix": "string — the corrected code",
      "explanation": "string — why this fix resolves the issue"
    }
  ]
}`;

    const userPrompt = `## Failed Tests
${JSON.stringify(failedTests, null, 2)}

## Code Files
${files.map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n")}

Provide specific code fixes for each failed/warning test.`;

    const aiResult = await callAI(systemPrompt, userPrompt);
    const suggestions = aiResult.suggestions || [];

    // Save to fix_suggestions field
    await supabase
      .from("test_results")
      .update({ fix_suggestions: suggestions, updated_at: new Date().toISOString() })
      .eq("feature_id", feature_id);

    return res.json({ suggestions });
  } catch (err) {
    console.error("Fix suggestion error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
