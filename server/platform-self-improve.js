const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token === process.env.SUPABASE_SERVICE_KEY) return next();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Unauthorized" });
  req.user = user;
  next();
}

async function callAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.content);
}

// POST /api/platform/self-improve — AI analyzes platform and creates improvement projects
router.post("/", requireAuth, async (req, res) => {
  try {
    console.log("[Self-Improve] Starting analysis...");

    // Gather platform context
    const [analyticsRes, healthRes, contextRes] = await Promise.all([
      fetch(`http://localhost:3001/api/platform/analytics`, { headers: { Authorization: req.headers.authorization } }).then(r => r.json()).catch(() => ({})),
      fetch(`http://localhost:3001/api/platform/health`, { headers: { Authorization: req.headers.authorization } }).then(r => r.json()).catch(() => ({})),
      fetch(`http://localhost:3001/api/platform/context`).then(r => r.json()).catch(() => ({}))
    ]);

    // Get recent closed PRs to avoid repeating ideas
    const { data: recentProjects } = await supabase
      .from("projects")
      .select("name, stage, type")
      .eq("type", "internal")
      .order("created_at", { ascending: false })
      .limit(20);

    const existingNames = (recentProjects || []).map(p => p.name);

    const systemPrompt = `You are a platform improvement analyst. Analyze this web platform and suggest 1-2 small, high-impact improvements.

RULES:
- Only suggest UI components or small backend features (NOT infrastructure, NOT refactors)
- Each suggestion must be implementable as 1-3 files max
- Suggest things that directly improve user experience
- Do NOT suggest anything already in the existing projects list
- Be specific: "Add loading skeleton to Dashboard" not "Improve UX"

Return JSON: { "improvements": [{ "name": "string (short, descriptive)", "description": "string (1-2 sentences, specific)", "priority": "high|medium" }] }`;

    const userPrompt = `Platform context:
- Frontend routes: ${JSON.stringify(contextRes.frontend_routes || [])}
- API routes: ${Object.keys(contextRes.api_routes || {}).length} groups
- Database tables: ${(contextRes.database_schema || []).length} tables
- Health score: ${healthRes.health_score || 'unknown'}
- Pipeline stats: ${JSON.stringify(analyticsRes.summary || {})}
- Recent internal projects (DO NOT repeat these): ${existingNames.join(", ")}

Suggest 1-2 improvements.`;

    const result = await callAI(systemPrompt, userPrompt);
    const improvements = (result.improvements || []).slice(0, 2);

    if (improvements.length === 0) {
      return res.json({ success: true, message: "No improvements suggested", projects_created: 0 });
    }

    // Get a user_id for project creation
    const { data: anyProject } = await supabase.from("projects").select("user_id").limit(1).single();
    const userId = anyProject?.user_id || "system";

    const created = [];
    for (const imp of improvements) {
      // Skip if name too similar to existing
      const isDupe = existingNames.some(n => n.toLowerCase().includes(imp.name.toLowerCase().slice(0, 15)));
      if (isDupe) {
        console.log(`[Self-Improve] Skipping duplicate: ${imp.name}`);
        continue;
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: imp.name,
          idea: imp.description,
          type: "internal",
          status: "pending",
          stage: "idea",
          user_id: userId,
          full_name: "Self-Improve Bot",
          company_name: "dante.id",
          needs: "{self-improve}"
        })
        .select()
        .single();

      if (error) {
        console.error(`[Self-Improve] Failed to create project: ${error.message}`);
        continue;
      }

      console.log(`[Self-Improve] Created project: ${project.id} — ${imp.name}`);

      // Trigger pipeline (fire and forget)
      fetch(`http://localhost:3001/api/refinery/generate-prd`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: req.headers.authorization },
        body: JSON.stringify({ project_id: project.id, idea_description: imp.description })
      }).catch(e => console.error(`[Self-Improve] Pipeline trigger failed: ${e.message}`));

      created.push({ id: project.id, name: imp.name, description: imp.description });
    }

    console.log(`[Self-Improve] Complete: ${created.length} projects created`);
    res.json({ success: true, projects_created: created.length, projects: created });

  } catch (err) {
    console.error("[Self-Improve] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/platform/self-improve — list recent self-improvement runs
router.get("/", requireAuth, async (req, res) => {
  const { data } = await supabase
    .from("projects")
    .select("id, name, idea, stage, status, created_at")
    .eq("type", "internal")
    .like("needs", "%self-improve%")
    .order("created_at", { ascending: false })
    .limit(20);

  res.json({ projects: data || [] });
});

module.exports = router;
