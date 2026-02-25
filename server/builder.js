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
      const timeout = setTimeout(() => { console.log("[AI] Aborting after 180s"); controller.abort(); }, 180000);
      
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

const CODE_GEN_SYSTEM = `You are a senior full-stack engineer. Generate working code scaffolding based on the technical blueprint.

Rules:
- Generate key files with real logic for core functionality
- Include proper imports and file structure
- Focus on the PRIMARY feature logic — skip boilerplate that frameworks auto-generate
- Keep files concise (under 100 lines each where possible)
- Include a package.json with dependencies
- Max 8 files per feature — focus on what matters

Return JSON: {
  "files": [{"path": "relative/path/to/file.ext", "content": "file content", "language": "jsx|ts|py|sql|json|etc"}],
  "summary": "What was generated and key decisions made",
  "setup_instructions": "How to run this"
}`;

// --- POST /generate-code ---
router.post("/generate-code", requireAuth, async (req, res) => {
  const { feature_id, project_id } = req.body;
  if (!feature_id || !project_id) {
    return res.status(400).json({ error: "feature_id and project_id are required" });
  }

  try {
    // Fetch feature
    const { data: feature, error: featError } = await supabase
      .from("features")
      .select("*")
      .eq("id", feature_id)
      .single();

    if (featError || !feature) {
      return res.status(404).json({ error: "Feature not found" });
    }

    // Fetch blueprint
    const { data: blueprint, error: bpError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("feature_id", feature_id)
      .single();

    if (bpError || !blueprint) {
      return res.status(404).json({ error: "Blueprint not found. Generate a blueprint in Foundry first." });
    }

    // Fetch project + PRD for context
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    const { data: prd } = await supabase
      .from("prds")
      .select("content")
      .eq("project_id", project_id)
      .single();

    // Upsert build record as 'generating'
    const { data: existingBuild } = await supabase
      .from("builds")
      .select("id")
      .eq("feature_id", feature_id)
      .eq("project_id", project_id)
      .single();

    let buildId;
    if (existingBuild) {
      buildId = existingBuild.id;
      await supabase
        .from("builds")
        .update({ status: "generating", files: [], logs: [], updated_at: new Date().toISOString() })
        .eq("id", buildId);
    } else {
      const { data: newBuild } = await supabase
        .from("builds")
        .insert({ project_id, feature_id, status: "generating", files: [], logs: [] })
        .select()
        .single();
      buildId = newBuild.id;
    }

    // Build user prompt
    const techStack = prd?.content?.tech_stack || project?.tech_stack || "React + Node.js";
    const userPrompt = `Feature: ${feature.name}
Description: ${feature.description || ""}
Priority: ${feature.priority || "medium"}
Acceptance Criteria: ${JSON.stringify(feature.acceptance_criteria || [])}

Technical Blueprint:
${JSON.stringify(blueprint.content, null, 2)}

Tech Stack Context: ${typeof techStack === 'string' ? techStack : JSON.stringify(techStack)}
Project: ${project?.company_name || project?.full_name || "Unknown"}

Generate concise, working code for this feature. Focus on core logic, keep files short.`;

    const result = await callAI(CODE_GEN_SYSTEM, userPrompt);

    const files = result.files || [];
    const logs = [
      { ts: new Date().toISOString(), msg: `Generated ${files.length} files` },
      { ts: new Date().toISOString(), msg: `Summary: ${result.summary || ""}` }
    ];

    // Update build
    const { data: build } = await supabase
      .from("builds")
      .update({
        status: "review",
        files,
        logs,
        updated_at: new Date().toISOString()
      })
      .eq("id", buildId)
      .select()
      .single();

    return res.json({ build: { ...build, summary: result.summary, setup_instructions: result.setup_instructions } });
  } catch (err) {
    console.error("Generate code error:", err.message);
    // Try to mark build as failed
    if (req.body.feature_id) {
      await supabase
        .from("builds")
        .update({ status: "failed", logs: [{ ts: new Date().toISOString(), msg: err.message }], updated_at: new Date().toISOString() })
        .eq("feature_id", req.body.feature_id)
        .eq("project_id", req.body.project_id);
    }
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/builds ---
router.get("/:project_id/builds", requireAuth, async (req, res) => {
  try {
    const { data: builds } = await supabase
      .from("builds")
      .select("id, feature_id, status, files, created_at, features(name)")
      .eq("project_id", req.params.project_id)
      .order("created_at");

    const result = (builds || []).map(b => ({
      build_id: b.id,
      feature_id: b.feature_id,
      feature_name: b.features?.name || "Unknown",
      status: b.status,
      file_count: Array.isArray(b.files) ? b.files.length : 0,
      created_at: b.created_at
    }));

    return res.json({ builds: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/builds/:feature_id ---
router.get("/:project_id/builds/:feature_id", requireAuth, async (req, res) => {
  try {
    const { data: build } = await supabase
      .from("builds")
      .select("*")
      .eq("project_id", req.params.project_id)
      .eq("feature_id", req.params.feature_id)
      .single();

    return res.json({ build: build || null });
  } catch (err) {
    return res.json({ build: null });
  }
});

// --- POST /create-repo ---
router.post("/create-repo", requireAuth, async (req, res) => {
  const { project_id, repo_name, description } = req.body;
  if (!project_id || !repo_name) {
    return res.status(400).json({ error: "project_id and repo_name are required" });
  }

  const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(500).json({ error: "GitHub token not configured" });
  }

  try {
    // Fetch all builds for project
    const { data: builds } = await supabase
      .from("builds")
      .select("*")
      .eq("project_id", project_id)
      .in("status", ["review", "done"]);

    if (!builds || builds.length === 0) {
      return res.status(400).json({ error: "No builds ready for deployment" });
    }

    // Assemble file tree (later files overwrite earlier ones at same path)
    const fileTree = {};
    for (const build of builds) {
      for (const file of (build.files || [])) {
        fileTree[file.path] = file.content;
      }
    }

    const org = "dante-alpha-assistant";

    // 1. Create repo (user account, not org)
    const createRes = await fetch(`https://api.github.com/user/repos`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        name: repo_name,
        description: description || "",
        private: false,
        auto_init: false
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      // If already exists, continue
      if (err.errors?.[0]?.message !== "name already exists on this account") {
        return res.status(500).json({ error: `GitHub repo creation failed: ${err.message || JSON.stringify(err)}` });
      }
    }

    // 2. Create blobs, tree, and commit via GitHub API
    const filePaths = Object.keys(fileTree);

    // Create blobs for each file
    const treeItems = [];
    for (const filePath of filePaths) {
      const blobRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/blobs`, {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          content: fileTree[filePath],
          encoding: "utf-8"
        })
      });
      const blob = await blobRes.json();
      treeItems.push({
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blob.sha
      });
    }

    // Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ tree: treeItems })
    });
    const tree = await treeRes.json();

    // Create commit
    const commitRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `Initial commit: ${filePaths.length} files from dante.id Builder`,
        tree: tree.sha
      })
    });
    const commit = await commitRes.json();

    // Create/update main branch ref
    const refRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        ref: "refs/heads/main",
        sha: commit.sha
      })
    });

    if (!refRes.ok) {
      // Branch might exist, try update
      await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/refs/heads/main`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({ sha: commit.sha, force: true })
      });
    }

    const repoUrl = `https://github.com/${org}/${repo_name}`;

    // Update all builds with github_url
    for (const build of builds) {
      await supabase
        .from("builds")
        .update({ github_url: repoUrl, status: "done", updated_at: new Date().toISOString() })
        .eq("id", build.id);
    }

    return res.json({ repo_url: repoUrl, files_committed: filePaths.length });
  } catch (err) {
    console.error("Create repo error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
