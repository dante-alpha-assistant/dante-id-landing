const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware (same pattern as index.js) ---
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

// --- POST /generate-prd ---
router.post("/generate-prd", requireAuth, async (req, res) => {
  const { project_id, idea_description, context } = req.body;
  if (!project_id || !idea_description) {
    return res.status(400).json({ error: "project_id and idea_description are required" });
  }

  try {
    const systemPrompt = `You are a senior product manager. Generate a comprehensive Product Requirements Document (PRD) as JSON.
The JSON must follow this exact schema:
{
  "title": "string",
  "overview": "string (2-3 paragraphs)",
  "problem": "string (detailed problem statement)",
  "solution": "string (detailed solution description)",
  "target_users": [{"persona": "string", "needs": ["string"]}],
  "features": [{"name": "string", "description": "string", "priority": "critical|high|medium|low", "acceptance_criteria": ["string"]}],
  "tech_stack": {"frontend": "string", "backend": "string", "database": "string", "deployment": "string"},
  "success_metrics": [{"metric": "string", "target": "string"}],
  "risks": [{"risk": "string", "mitigation": "string"}],
  "timeline": "string"
}
Generate a concise but complete PRD. Include 4-6 features with acceptance criteria. Be specific but brief.`;

    const userPrompt = `Product idea: ${idea_description}${context ? `\n\nAdditional context: ${context}` : ""}

Generate a complete PRD for this product.`;

    console.log('[REFINERY] Calling AI for PRD generation...');
    const content = await callAI(systemPrompt, userPrompt);
    console.log('[REFINERY] AI returned, inserting into DB...');

    const { data: prd, error } = await supabase
      .from("prds")
      .insert({
        project_id,
        user_id: req.user.id,
        content,
        version: 1
      })
      .select()
      .single();

    if (error) {
      console.error("PRD insert error:", error);
      return res.status(500).json({ error: "Failed to save PRD" });
    }

    // Auto-set project name from PRD title if not already set
    if (content?.title) {
      const { data: proj } = await supabase.from("projects").select("name").eq("id", project_id).single();
      if (!proj?.name) {
        await supabase.from("projects").update({ name: content.title }).eq("id", project_id);
      }
    }

    return res.json({ prd });
  } catch (err) {
    console.error("Generate PRD error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /extract-features ---
router.post("/extract-features", requireAuth, async (req, res) => {
  const { project_id, prd_id } = req.body;
  if (!project_id || !prd_id) {
    return res.status(400).json({ error: "project_id and prd_id are required" });
  }

  try {
    const { data: prd, error: prdError } = await supabase
      .from("prds")
      .select("*")
      .eq("id", prd_id)
      .single();

    if (prdError || !prd) {
      return res.status(404).json({ error: "PRD not found" });
    }

    const systemPrompt = `You are a product manager. Extract a clean list of features from the PRD.
Return JSON: { "features": [{"name": "string", "description": "string", "priority": "critical|high|medium|low|nice-to-have", "acceptance_criteria": ["string"]}] }
Order by priority (critical first). Be specific and actionable.`;

    const userPrompt = `PRD content:\n${JSON.stringify(prd.content, null, 2)}\n\nExtract all features as a structured array.`;

    const result = await callAI(systemPrompt, userPrompt);
    const features = result.features || [];

    // Delete existing features for this PRD then insert new ones
    await supabase.from("features").delete().eq("prd_id", prd_id);

    const rows = features.map((f, i) => ({
      project_id,
      prd_id,
      name: f.name,
      description: f.description || "",
      priority: f.priority || "medium",
      status: "draft",
      acceptance_criteria: f.acceptance_criteria || [],
      sort_order: i
    }));

    if (rows.length > 0) {
      // Dedup guard: skip features that already exist for this project
      const { data: existing } = await supabase.from("features").select("name").eq("project_id", project_id);
      const existingNames = new Set((existing || []).map(f => f.name.toLowerCase()));
      const newRows = rows.filter(r => !existingNames.has(r.name.toLowerCase()));
      if (newRows.length < rows.length) {
        console.log(`[Refinery] Dedup: ${rows.length - newRows.length} duplicate features skipped for ${project_id}`);
      }
      if (newRows.length > 0) {
        const { error: insertError } = await supabase.from("features").insert(newRows);
        if (insertError) {
          console.error("Features insert error:", insertError);
          return res.status(500).json({ error: "Failed to save features" });
        }
      }
    }

    const { data: saved } = await supabase
      .from("features")
      .select("*")
      .eq("prd_id", prd_id)
      .order("sort_order");

    // Update project status
    await supabase.from("projects").update({ status: "refining", stage: "building" }).eq("id", project_id);

    return res.json({ features: saved || [] });
  } catch (err) {
    console.error("Extract features error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /refine ---
router.post("/refine", aiLimiter, requireAuth, async (req, res) => {
  const { project_id, prd_id, instruction } = req.body;
  if (!project_id || !prd_id || !instruction) {
    return res.status(400).json({ error: "project_id, prd_id, and instruction are required" });
  }

  try {
    const { data: prd, error: prdError } = await supabase
      .from("prds")
      .select("*")
      .eq("id", prd_id)
      .single();

    if (prdError || !prd) {
      return res.status(404).json({ error: "PRD not found" });
    }

    const systemPrompt = `You are a senior product manager refining a PRD. Apply the user's instruction to improve the PRD.
Return the COMPLETE updated PRD as JSON with the same schema. Keep all existing content unless the instruction specifically asks to change it.
Schema: { "title", "overview", "problem", "solution", "target_users", "features", "tech_stack", "success_metrics", "risks", "timeline" }`;

    const userPrompt = `Current PRD:\n${JSON.stringify(prd.content, null, 2)}\n\nInstruction: ${instruction}\n\nReturn the complete updated PRD JSON.`;

    const content = await callAI(systemPrompt, userPrompt);

    const newVersion = (prd.version || 1) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("prds")
      .update({
        content,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq("id", prd_id)
      .select()
      .single();

    if (updateError) {
      console.error("PRD update error:", updateError);
      return res.status(500).json({ error: "Failed to update PRD" });
    }

    return res.json({ prd: updated });
  } catch (err) {
    console.error("Refine PRD error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/prd ---
router.get("/:project_id/prd", requireAuth, async (req, res) => {
  try {
    const { data: prd } = await supabase
      .from("prds")
      .select("*")
      .eq("project_id", req.params.project_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    return res.json({ prd: prd || null });
  } catch (err) {
    return res.json({ prd: null });
  }
});

// --- PUT /:project_id/prd ---
router.put("/:project_id/prd", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    const { data: prd } = await supabase
      .from("prds")
      .select("*")
      .eq("project_id", req.params.project_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (!prd) {
      return res.status(404).json({ error: "PRD not found" });
    }

    const { data: updated, error } = await supabase
      .from("prds")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", prd.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to update PRD" });
    }

    return res.json({ prd: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/features ---
router.get("/:project_id/features", requireAuth, async (req, res) => {
  try {
    const { data: prd } = await supabase
      .from("prds")
      .select("id")
      .eq("project_id", req.params.project_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (!prd) {
      return res.json({ features: [] });
    }

    const { data: features } = await supabase
      .from("features")
      .select("*")
      .eq("prd_id", prd.id)
      .order("sort_order");

    return res.json({ features: features || [] });
  } catch (err) {
    return res.json({ features: [] });
  }
});

// --- PUT /:project_id/features ---
router.put("/:project_id/features", requireAuth, async (req, res) => {
  const { features } = req.body;
  if (!Array.isArray(features)) {
    return res.status(400).json({ error: "features array is required" });
  }

  try {
    for (const f of features) {
      if (!f.id) continue;
      await supabase
        .from("features")
        .update({
          priority: f.priority,
          status: f.status,
          sort_order: f.sort_order,
          name: f.name,
          description: f.description,
          acceptance_criteria: f.acceptance_criteria
        })
        .eq("id", f.id);
    }

    const { data: updated } = await supabase
      .from("features")
      .select("*")
      .eq("project_id", req.params.project_id)
      .order("sort_order");

    return res.json({ features: updated || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /generate-all --- One-shot: PRD + extract features + update status
router.post("/generate-all", aiLimiter, requireAuth, async (req, res) => {
  const { project_id, idea } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id required" });
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const base = "http://localhost:3001/api/refinery";
  const headers = { Authorization: "Bearer " + serviceKey, "Content-Type": "application/json" };

  try {
    // 1. Get project idea
    const { data: project } = await supabase.from("projects").select("idea, description").eq("id", project_id).single();
    const ideaText = idea || project?.idea || project?.description || "Build a software application";

    // 2. Generate PRD
    console.log(`[Refinery All] Generating PRD for ${project_id}`);
    const prdRes = await fetch(`${base}/generate-prd`, { method: "POST", headers, body: JSON.stringify({ project_id, idea_description: ideaText }) });
    const prdData = await prdRes.json().catch(() => ({}));
    const prdId = prdData?.prd?.id;

    if (!prdId) {
      console.error("[Refinery All] PRD generation failed:", JSON.stringify(prdData).slice(0, 200));
      return res.status(500).json({ error: "PRD generation failed" });
    }

    // 2. Extract features
    console.log(`[Refinery All] Extracting features for ${project_id}, prd ${prdId}`);
    const featRes = await fetch(`${base}/extract-features`, { method: "POST", headers, body: JSON.stringify({ project_id, prd_id: prdId }) });
    const featText = await featRes.text().catch(() => "");
    console.log(`[Refinery All] Features response: ${featRes.status} ${featText.slice(0, 200)}`);

    // 3. Update status
    await supabase.from("projects").update({ status: "refining", stage: "building" }).eq("id", project_id);
    console.log(`[Refinery All] Complete for ${project_id} — auto-advancing to foundry`);

    // Auto-advance to foundry
    const autoToken = serviceKey;
    fetch(`http://localhost:3001/api/foundry/generate-all-architecture`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + autoToken, "Content-Type": "application/json" },
      body: JSON.stringify({ project_id }),
    }).then(r => console.log(`[Refinery→Foundry] Auto-advance: ${r.status}`))
      .catch(err => console.error(`[Refinery→Foundry] Auto-advance failed:`, err.message));

    res.json({ success: true, prd_id: prdId });
  } catch (err) {
    console.error("[Refinery All] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
