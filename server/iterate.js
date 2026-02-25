const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware ---
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Missing authorization token" });
  const token = authHeader.replace("Bearer ", "");
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  } catch (err) { return res.status(401).json({ error: "Auth verification failed" }); }
}

// --- AI helper (same pattern as other modules) ---
async function callAI(systemPrompt, userPrompt) {
  const maxRetries = 1;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          stream: false,
        }),
      });
      const bodyPromise = res.text();
      const bodyTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Body timeout")), 300000));
      const bodyText = await Promise.race([bodyPromise, bodyTimeout]);
      clearTimeout(timeout);
      const data = JSON.parse(bodyText);
      if (!data.choices?.[0]) throw new Error("No AI response");
      const raw = data.choices[0].message.content;
      const { repairJson } = require("./generate");
      return repairJson(raw);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
    }
  }
}

const ITERATE_SYSTEM = `You are an expert software architect. Given a live deployed codebase and a user's change request, generate a set of targeted work orders to implement the changes.

Each work order should:
- Have a clear title and description
- Specify which existing files need to be modified (with the specific changes)
- Specify any new files to create
- Be as minimal as possible — only change what's needed

Return JSON: {
  "work_orders": [
    {
      "title": "Short title",
      "description": "What to change and why",
      "files_to_modify": [{"path": "src/...", "changes": "Description of changes"}],
      "files_to_create": [{"path": "src/...", "description": "What this file does"}],
      "priority": "high|medium|low"
    }
  ],
  "summary": "Overall summary of changes"
}`;

// --- POST /start --- Start an iteration
router.post("/start", aiLimiter, requireAuth, async (req, res) => {
  const { project_id, description } = req.body;
  if (!project_id || !description) return res.status(400).json({ error: "project_id and description required" });

  try {
    // Verify ownership
    const { data: project } = await supabase.from("projects").select("*").eq("id", project_id).eq("user_id", req.user.id).single();
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Get existing build files for context
    const { data: builds } = await supabase.from("builds").select("files, features(name)").eq("project_id", project_id).eq("status", "review");
    const existingFiles = [];
    (builds || []).forEach(b => {
      const featureName = b.features?.name || "Unknown";
      (b.files || []).forEach(f => {
        existingFiles.push({ path: f.path, feature: featureName, content: f.content?.slice(0, 500) + (f.content?.length > 500 ? "..." : "") });
      });
    });

    // Create iteration record
    const { data: iteration, error: insertErr } = await supabase.from("iterations").insert({
      project_id,
      description,
      status: "planning",
    }).select().single();

    if (insertErr) return res.status(500).json({ error: insertErr.message });

    // Update project status
    await supabase.from("projects").update({ status: "building", stage: "building" }).eq("id", project_id);

    // Generate work orders async
    const iterationId = iteration.id;
    const token = req.headers.authorization;

    // Fire and forget — AI generation happens in background
    (async () => {
      try {
        const userPrompt = `## Change Request
${description}

## Current Codebase (${existingFiles.length} files)
${existingFiles.map(f => `- ${f.path} (${f.feature}): ${f.content?.slice(0, 200)}`).join("\n")}

Generate minimal, targeted work orders to implement the requested changes.`;

        const result = await callAI(ITERATE_SYSTEM, userPrompt);
        const workOrders = result.work_orders || [];

        await supabase.from("iterations").update({
          status: "building",
          work_orders: workOrders,
          updated_at: new Date().toISOString(),
        }).eq("id", iterationId);

        // Now build the changes — call build-all
        const buildRes = await fetch("http://localhost:3001/api/builder/build-all", {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ project_id }),
        });

        if (buildRes.ok) {
          // Deploy
          await fetch("http://localhost:3001/api/deployer/deploy", {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({ project_id }),
          });

          await supabase.from("iterations").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", iterationId);
          await supabase.from("projects").update({ status: "live", stage: "launched" }).eq("id", project_id);
        } else {
          await supabase.from("iterations").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", iterationId);
        }
      } catch (err) {
        console.error("[Iterate] Error:", err.message);
        await supabase.from("iterations").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", iterationId);
      }
    })();

    return res.json({
      iteration_id: iterationId,
      status: "planning",
      message: "Iteration started. AI is generating work orders, then will build and deploy. Poll GET /api/iterate/:project_id to check progress.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id --- List iterations
router.get("/:project_id", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase.from("iterations")
      .select("*")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false });
    return res.json({ iterations: data || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// --- GET /:project_id/:iteration_id --- Get single iteration
router.get("/:project_id/:iteration_id", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase.from("iterations")
      .select("*")
      .eq("id", req.params.iteration_id)
      .single();
    return res.json({ iteration: data || null });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
