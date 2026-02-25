const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    const projectId = req.body?.project_id || req.params?.project_id;
    if (projectId) {
      const { data: project } = await supabase.from("projects").select("id, user_id").eq("id", projectId).single();
      if (!project || project.user_id !== user.id) return res.status(403).json({ error: "Not your project" });
    }
    next();
  } catch (err) { return res.status(401).json({ error: "Auth failed" }); }
}

async function callAI(systemPrompt, userPrompt, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "anthropic/claude-sonnet-4", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], stream: false })
      });
      const bodyText = await res.text();
      clearTimeout(timeout);
      const data = JSON.parse(bodyText);
      if (!data.choices?.[0]) { if (attempt < maxRetries) continue; throw new Error("No choices"); }
      return repairJson(data.choices[0].message.content);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
    }
  }
}

// --- POST /submit-feedback ---
router.post("/submit-feedback", requireAuth, async (req, res) => {
  const { project_id, feature_id, type, title, description } = req.body;
  if (!project_id || !type || !title) return res.status(400).json({ error: "project_id, type, and title are required" });

  try {
    const { data: feedback, error } = await supabase.from("feedback").insert({
      project_id, feature_id: feature_id || null, user_id: req.user.id,
      type, title, description: description || null
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ feedback });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GET /:project_id/feedback ---
router.get("/:project_id/feedback", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase.from("feedback")
      .select("*, features(name)")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false });
    res.json({ feedback: data || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PATCH /feedback/:id/status ---
router.patch("/feedback/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status required" });
  try {
    const { data, error } = await supabase.from("feedback")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ feedback: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- POST /analyze-feedback --- AI analyzes feedback and generates improvement tickets
router.post("/analyze-feedback", aiLimiter, requireAuth, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id required" });

  try {
    const { data: feedback } = await supabase.from("feedback").select("*, features(name)")
      .eq("project_id", project_id).eq("status", "open");

    if (!feedback || feedback.length === 0) return res.json({ tickets: [], message: "No open feedback to analyze" });

    const { data: features } = await supabase.from("features").select("id, name, description").eq("project_id", project_id);
    const { data: existingWOs } = await supabase.from("work_orders").select("title, feature_id").eq("project_id", project_id);

    const systemPrompt = `You are a product manager analyzing user feedback. Generate improvement tickets (work orders) from feedback items.

Return JSON:
{
  "tickets": [
    {
      "title": "Short action-oriented title",
      "description": "What needs to change and why",
      "type": "bug_fix|improvement|new_feature",
      "priority": "critical|high|medium|low",
      "feature_id": "UUID of related feature or null",
      "acceptance_criteria": ["criterion 1", "criterion 2"],
      "feedback_ids": ["UUID of feedback items this addresses"]
    }
  ],
  "summary": "Brief analysis of the feedback patterns"
}

Group related feedback into single tickets. Don't duplicate existing work orders.`;

    const userPrompt = `Open feedback (${feedback.length} items):
${feedback.map(f => `- [${f.type}] "${f.title}": ${f.description || 'N/A'} (feature: ${f.features?.name || 'general'}, id: ${f.id})`).join("\n")}

Features: ${(features || []).map(f => `${f.name} (${f.id})`).join(", ")}

Existing work orders: ${(existingWOs || []).map(w => w.title).join(", ") || "none"}

Analyze and generate improvement tickets.`;

    const result = await callAI(systemPrompt, userPrompt);

    // Create work orders from tickets
    const created = [];
    for (const ticket of (result.tickets || [])) {
      const { data: wo } = await supabase.from("work_orders").insert({
        project_id,
        feature_id: ticket.feature_id || null,
        title: ticket.title,
        description: ticket.description,
        phase: 1,
        priority: ticket.priority || "medium",
        status: "pending",
        acceptance_criteria: ticket.acceptance_criteria || [],
        estimated_complexity: ticket.type === "bug_fix" ? "small" : "medium"
      }).select().single();
      if (wo) created.push(wo);

      // Mark feedback as in_progress
      for (const fid of (ticket.feedback_ids || [])) {
        await supabase.from("feedback").update({ status: "in_progress", ai_analysis: { ticket_id: wo?.id, ticket_title: ticket.title }, updated_at: new Date().toISOString() }).eq("id", fid);
      }
    }

    res.json({ tickets: created, summary: result.summary, feedback_processed: feedback.length });
  } catch (err) {
    console.error("Analyze feedback error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
