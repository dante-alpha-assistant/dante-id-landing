const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware (same pattern as refinery.js) ---
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

const BLUEPRINT_SCHEMA = `{
  "api": {
    "endpoints": [
      { "method": "GET|POST|PUT|DELETE", "path": "/api/...", "description": "string", "request_body": "object or null", "response": "object", "auth_required": true }
    ],
    "integrations": ["string"]
  },
  "ui": {
    "components": [
      { "name": "ComponentName", "type": "page|component|modal|form", "description": "string", "props": ["string"], "children": ["string"] }
    ],
    "routes": [{"path": "/...", "component": "string"}],
    "user_flow": ["Step 1: ...", "Step 2: ..."]
  },
  "data_model": {
    "tables": [
      { "name": "table_name", "columns": [{"name": "string", "type": "string", "constraints": "string"}], "relationships": ["string"] }
    ],
    "indexes": ["string"]
  },
  "tests": {
    "unit": [{"name": "string", "description": "string", "expected": "string"}],
    "integration": [{"name": "string", "description": "string", "expected": "string"}],
    "e2e": [{"name": "string", "description": "string", "expected": "string"}]
  }
}`;

// --- POST /generate-blueprint ---
router.post("/generate-blueprint", requireAuth, async (req, res) => {
  const { feature_id, project_id } = req.body;
  if (!feature_id || !project_id) {
    return res.status(400).json({ error: "feature_id and project_id are required" });
  }

  try {
    // Fetch feature
    const { data: feature, error: featError } = await supabase
      .from("features")
      .select("*, prds(content)")
      .eq("id", feature_id)
      .single();

    if (featError || !feature) {
      return res.status(404).json({ error: "Feature not found" });
    }

    const prdContent = feature.prds?.content || {};

    const systemPrompt = `You are a senior software architect. Generate a comprehensive technical blueprint for implementing a feature.
The JSON must follow this exact schema:
${BLUEPRINT_SCHEMA}
Be thorough, specific, and actionable. Include realistic endpoints, components, data models, and test cases.`;

    const userPrompt = `Feature: ${feature.name}
Description: ${feature.description || ""}
Priority: ${feature.priority || "medium"}
Acceptance Criteria: ${JSON.stringify(feature.acceptance_criteria || [])}

PRD Context:
${JSON.stringify(prdContent, null, 2)}

Generate a complete technical blueprint for implementing this feature.`;

    const content = await callAI(systemPrompt, userPrompt);

    // Check if blueprint already exists
    const { data: existing } = await supabase
      .from("blueprints")
      .select("id, version")
      .eq("feature_id", feature_id)
      .single();

    let blueprint;
    if (existing) {
      const { data: updated, error } = await supabase
        .from("blueprints")
        .update({ content, version: (existing.version || 1) + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        console.error("Blueprint update error:", error);
        return res.status(500).json({ error: "Failed to update blueprint" });
      }
      blueprint = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("blueprints")
        .insert({ project_id, feature_id, content, version: 1 })
        .select()
        .single();
      if (error) {
        console.error("Blueprint insert error:", error);
        return res.status(500).json({ error: "Failed to save blueprint" });
      }
      blueprint = inserted;
    }

    return res.json({ blueprint });
  } catch (err) {
    console.error("Generate blueprint error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/blueprints ---
router.get("/:project_id/blueprints", requireAuth, async (req, res) => {
  try {
    const { data: blueprints } = await supabase
      .from("blueprints")
      .select("id, feature_id, version, created_at, updated_at, content, features(name, priority)")
      .eq("project_id", req.params.project_id)
      .order("created_at");

    const result = (blueprints || []).map(b => ({
      id: b.id,
      feature_id: b.feature_id,
      feature_name: b.features?.name || "Unknown",
      feature_priority: b.features?.priority || "medium",
      version: b.version,
      created_at: b.created_at,
      updated_at: b.updated_at,
      summary: {
        endpoints: b.content?.api?.endpoints?.length || 0,
        components: b.content?.ui?.components?.length || 0,
        tables: b.content?.data_model?.tables?.length || 0,
        tests: (b.content?.tests?.unit?.length || 0) + (b.content?.tests?.integration?.length || 0) + (b.content?.tests?.e2e?.length || 0)
      }
    }));

    return res.json({ blueprints: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/blueprints/:feature_id ---
router.get("/:project_id/blueprints/:feature_id", requireAuth, async (req, res) => {
  try {
    const { data: blueprint } = await supabase
      .from("blueprints")
      .select("*")
      .eq("project_id", req.params.project_id)
      .eq("feature_id", req.params.feature_id)
      .single();

    return res.json({ blueprint: blueprint || null });
  } catch (err) {
    return res.json({ blueprint: null });
  }
});

// --- PUT /:project_id/blueprints/:feature_id ---
router.put("/:project_id/blueprints/:feature_id", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    const { data: blueprint } = await supabase
      .from("blueprints")
      .select("*")
      .eq("project_id", req.params.project_id)
      .eq("feature_id", req.params.feature_id)
      .single();

    if (!blueprint) {
      return res.status(404).json({ error: "Blueprint not found" });
    }

    const { data: updated, error } = await supabase
      .from("blueprints")
      .update({ content, version: (blueprint.version || 1) + 1, updated_at: new Date().toISOString() })
      .eq("id", blueprint.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to update blueprint" });
    }

    return res.json({ blueprint: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /refine-blueprint ---
router.post("/refine-blueprint", requireAuth, async (req, res) => {
  const { feature_id, instruction } = req.body;
  if (!feature_id || !instruction) {
    return res.status(400).json({ error: "feature_id and instruction are required" });
  }

  try {
    const { data: blueprint, error: bpError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("feature_id", feature_id)
      .single();

    if (bpError || !blueprint) {
      return res.status(404).json({ error: "Blueprint not found" });
    }

    const systemPrompt = `You are a senior software architect refining a technical blueprint. Apply the user's instruction to improve the blueprint.
Return the COMPLETE updated blueprint as JSON with the same schema. Keep all existing content unless the instruction specifically asks to change it.
Schema: ${BLUEPRINT_SCHEMA}`;

    const userPrompt = `Current blueprint:\n${JSON.stringify(blueprint.content, null, 2)}\n\nInstruction: ${instruction}\n\nReturn the complete updated blueprint JSON.`;

    const content = await callAI(systemPrompt, userPrompt);
    const newVersion = (blueprint.version || 1) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("blueprints")
      .update({ content, version: newVersion, updated_at: new Date().toISOString() })
      .eq("id", blueprint.id)
      .select()
      .single();

    if (updateError) {
      console.error("Blueprint update error:", updateError);
      return res.status(500).json({ error: "Failed to update blueprint" });
    }

    return res.json({ blueprint: updated });
  } catch (err) {
    console.error("Refine blueprint error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
