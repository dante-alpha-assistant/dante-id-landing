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
      const timeout = setTimeout(() => { console.log("[AI] Aborting after 180s"); controller.abort(); }, 180000);

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

const PLANNER_SYSTEM = `You are a senior software architect and project planner. Given a feature blueprint, generate detailed Work Orders — implementation plans that tell a developer exactly what to build.

For each work order, specify:
- Which files to create (with path, purpose, and key contents)
- Which existing files to modify (with path and what to change)
- Dependencies between work orders (what must be built first)
- Acceptance criteria (how to verify it's done)
- Estimated complexity (low/medium/high)

Group work orders into phases:
- Phase 1: Foundation (DB schema, models, types)
- Phase 2: Core Logic (API routes, business logic)
- Phase 3: UI (components, pages, styling)
- Phase 4: Integration (connecting pieces, testing)

Return JSON:
{
  "work_orders": [
    {
      "title": "string — clear action-oriented title",
      "description": "string — what this work order accomplishes",
      "phase": 1-4,
      "priority": "critical|high|medium|low",
      "estimated_complexity": "low|medium|high",
      "files_to_create": [{"path": "src/models/User.ts", "purpose": "User data model", "key_contents": "interface User { id, name, email }"}],
      "files_to_modify": [{"path": "src/app.ts", "change": "Add user routes import and mount at /api/users"}],
      "dependencies": ["Work order title that must complete first"],
      "acceptance_criteria": ["User model validates email format", "API returns 201 on creation"]
    }
  ],
  "summary": "Overview of the implementation plan",
  "total_phases": 4,
  "critical_path": ["Work order titles in dependency order"]
}

Be specific about file paths and contents. A developer should be able to implement each work order without guessing.`;

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

    // Only generate for features that have blueprints but no work orders yet
    const { data: existingWOs } = await supabase.from("work_orders").select("feature_id").eq("project_id", project_id);
    const woSet = new Set((existingWOs || []).map(w => w.feature_id));

    const eligible = (features || []).filter(f => bpSet.has(f.id) && !woSet.has(f.id));
    if (eligible.length === 0) return res.json({ message: "All features already have work orders", count: 0 });

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
