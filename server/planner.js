const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware ---
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  try {
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
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;

    const projectId = req.body?.project_id || req.params?.project_id;
    if (projectId) {
      const { data: project } = await supabase.from("projects").select("id, user_id").eq("id", projectId).single();
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
      const timeout = setTimeout(() => { console.log("[AI] Aborting after 240s"); controller.abort(); }, 240000);

      console.log('[AI] Attempt', attempt + 1, 'calling OpenRouter (Planner)...');
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
      const bodyText = await res.text();
      clearTimeout(timeout);
      console.log('[AI] Body received, length:', bodyText.length);

      const data = JSON.parse(bodyText);
      if (!data.choices || !data.choices[0]) {
        if (attempt < maxRetries) continue;
        throw new Error("AI returned no choices");
      }

      const raw = data.choices[0].message.content;
      console.log('[AI] Content length:', raw?.length);
      try {
        return repairJson(raw);
      } catch (e) {
        if (attempt >= maxRetries) throw e;
      }
    } catch (err) {
      console.error('[AI] Error on attempt', attempt + 1, ':', err.message);
      if (attempt >= maxRetries) throw err;
    }
  }
}

const PLANNER_SYSTEM = `You are a software architect. Generate 3-6 concise Work Orders from a feature blueprint.

Each work order = one task a developer can complete independently.

Phases: 1=Foundation, 2=Core Logic, 3=UI, 4=Integration

Return JSON:
{
  "work_orders": [
    {
      "title": "short action title",
      "description": "one sentence",
      "phase": 1,
      "priority": "high",
      "estimated_complexity": "medium",
      "files_to_create": [{"path": "src/models/User.ts", "purpose": "User model"}],
      "files_to_modify": [{"path": "src/app.ts", "change": "Mount user routes"}],
      "dependencies": [],
      "acceptance_criteria": ["API returns 201"]
    }
  ],
  "summary": "one sentence overview"
}

Keep it concise. Max 6 work orders. Short descriptions.`;

// --- POST /generate-work-orders ---
router.post("/generate-work-orders", aiLimiter, requireAuth, async (req, res) => {
  const { feature_id, project_id } = req.body;
  if (!feature_id || !project_id) {
    return res.status(400).json({ error: "feature_id and project_id are required" });
  }

  try {
    // Fetch feature
    const { data: feature } = await supabase.from("features").select("*").eq("id", feature_id).single();
    if (!feature) return res.status(404).json({ error: "Feature not found" });

    // Fetch blueprint
    const { data: blueprint } = await supabase.from("blueprints").select("*").eq("feature_id", feature_id).single();
    if (!blueprint) return res.status(404).json({ error: "Blueprint not found. Generate a blueprint in Foundry first." });

    // Fetch project + PRD for context
    const { data: project } = await supabase.from("projects").select("*").eq("id", project_id).single();
    const { data: prd } = await supabase.from("prds").select("content").eq("project_id", project_id).single();

    // Fetch existing work orders for other features (so we know what's already planned)
    const { data: existingWOs } = await supabase.from("work_orders").select("title, phase, status").eq("project_id", project_id).neq("feature_id", feature_id);

    const techStack = prd?.content?.tech_stack || project?.tech_stack || "React + Node.js";

    const userPrompt = `## Feature: ${feature.name}
Description: ${feature.description || ""}
Priority: ${feature.priority || "medium"}
Acceptance Criteria: ${JSON.stringify(feature.acceptance_criteria || [])}

## Technical Blueprint
${JSON.stringify(blueprint.content, null, 2)}

## Project Context
Project: ${project?.company_name || project?.full_name || "Unknown"}
Tech Stack: ${typeof techStack === 'string' ? techStack : JSON.stringify(techStack)}

## Already Planned (other features)
${(existingWOs || []).map(w => `- [Phase ${w.phase}] ${w.title} (${w.status})`).join("\n") || "None yet"}

Generate detailed work orders for implementing this feature. Be specific about file paths, data structures, and integration points.`;

    const result = await callAI(PLANNER_SYSTEM, userPrompt);
    const workOrders = result.work_orders || [];

    // Clear existing work orders for this feature before inserting
    await supabase.from("work_orders").delete().eq("feature_id", feature_id).eq("project_id", project_id);

    // Save work orders to DB
    const saved = [];
    for (const wo of workOrders) {
      const { data: inserted, error } = await supabase.from("work_orders").insert({
        project_id,
        feature_id,
        blueprint_id: blueprint.id,
        title: wo.title,
        description: wo.description,
        phase: wo.phase || 1,
        priority: wo.priority || "medium",
        status: "pending",
        implementation_plan: wo,
        files_to_create: wo.files_to_create || [],
        files_to_modify: wo.files_to_modify || [],
        dependencies: wo.dependencies || [],
        acceptance_criteria: wo.acceptance_criteria || [],
        estimated_complexity: wo.estimated_complexity || "medium",
      }).select().single();

      if (!error && inserted) saved.push(inserted);
    }

    // Update project status
    await supabase.from("projects").update({ status: "planning" }).eq("id", project_id);

    return res.json({
      work_orders: saved,
      summary: result.summary,
      critical_path: result.critical_path || [],
      total_phases: result.total_phases || 4,
    });
  } catch (err) {
    console.error("Generate work orders error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /generate-all-work-orders ---
router.post("/generate-all-work-orders", aiLimiter, requireAuth, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id is required" });

  try {
    const { data: features } = await supabase.from("features").select("id, name").eq("project_id", project_id).order("sort_order");
    const { data: blueprints } = await supabase.from("blueprints").select("feature_id").eq("project_id", project_id);
    const bpSet = new Set((blueprints || []).map(b => b.feature_id));

    // Clear existing work orders and regenerate all
    await supabase.from("work_orders").delete().eq("project_id", project_id);

    const eligible = (features || []).filter(f => bpSet.has(f.id));
    if (eligible.length === 0) return res.json({ message: "No features with blueprints found", count: 0 });

    // Generate sequentially (each needs context of previous)
    let totalGenerated = 0;
    for (const feature of eligible) {
      try {
        // Call our own endpoint logic internally
        const fakeReq = { body: { feature_id: feature.id, project_id }, user: req.user, headers: req.headers };
        // Just call the AI directly
        const { data: feat } = await supabase.from("features").select("*").eq("id", feature.id).single();
        const { data: bp } = await supabase.from("blueprints").select("*").eq("feature_id", feature.id).single();
        const { data: project } = await supabase.from("projects").select("*").eq("id", project_id).single();
        const { data: prd } = await supabase.from("prds").select("content").eq("project_id", project_id).single();
        const { data: existingAll } = await supabase.from("work_orders").select("title, phase, status").eq("project_id", project_id);

        const techStack = prd?.content?.tech_stack || "React + Node.js";
        const userPrompt = `## Feature: ${feat.name}
Description: ${feat.description || ""}
Priority: ${feat.priority || "medium"}

## Technical Blueprint
${JSON.stringify(bp.content, null, 2)}

## Project: ${project?.company_name || "Unknown"}
Tech Stack: ${typeof techStack === 'string' ? techStack : JSON.stringify(techStack)}

## Already Planned
${(existingAll || []).map(w => `- [Phase ${w.phase}] ${w.title} (${w.status})`).join("\n") || "None"}

Generate work orders for this feature.`;

        const result = await callAI(PLANNER_SYSTEM, userPrompt);
        for (const wo of (result.work_orders || [])) {
          await supabase.from("work_orders").insert({
            project_id, feature_id: feature.id, blueprint_id: bp.id,
            title: wo.title, description: wo.description, phase: wo.phase || 1,
            priority: wo.priority || "medium", status: "pending",
            implementation_plan: wo,
            files_to_create: wo.files_to_create || [],
            files_to_modify: wo.files_to_modify || [],
            dependencies: wo.dependencies || [],
            acceptance_criteria: wo.acceptance_criteria || [],
            estimated_complexity: wo.estimated_complexity || "medium",
          });
          totalGenerated++;
        }
      } catch (err) {
        console.error(`Work orders for ${feature.name} failed:`, err.message);
      }
    }

    await supabase.from("projects").update({ status: "planning" }).eq("id", project_id);
    console.log(`[Planner] Complete for ${project_id} — auto-advancing to builder`);

    // Auto-advance to builder
    const autoToken = process.env.SUPABASE_SERVICE_KEY;
    fetch(`http://localhost:3001/api/builder/build-all`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + autoToken, "Content-Type": "application/json" },
      body: JSON.stringify({ project_id }),
    }).then(r => console.log(`[Planner→Builder] Auto-advance: ${r.status}`))
      .catch(err => console.error(`[Planner→Builder] Auto-advance failed:`, err.message));

    return res.json({ count: totalGenerated, features_processed: eligible.length });
  } catch (err) {
    console.error("Generate all work orders error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/work-orders ---
router.get("/:project_id/work-orders", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from("work_orders")
      .select("*, features(name, priority)")
      .eq("project_id", req.params.project_id)
      .order("phase")
      .order("priority");

    const mapped = (data || []).map(wo => ({
      ...wo,
      feature_name: wo.features?.name || "Unknown",
      feature_priority: wo.features?.priority || "medium",
    }));

    return res.json({ work_orders: mapped });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- PATCH /work-orders/:id/status ---
router.patch("/work-orders/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!["pending", "in_progress", "done", "blocked"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const { data, error } = await supabase
      .from("work_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ work_order: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
