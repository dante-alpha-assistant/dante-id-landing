require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");
const { generateDeliverables, retrySingleDeliverable, repairJson } = require("./generate");
const { generateLandingProject, renderLandingHTML } = require("./generate-landing");
const { deployLandingPage } = require("./deploy");
const { DomainManager } = require("./domains");
const { stripe, PLANS, createCheckoutSession, createPortalSession, handleWebhookEvent } = require("./stripe");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const app = express();

// --- CORS: only allow dante.id ---
app.use(cors({
  origin: ["https://dante.id", "http://localhost:5173"],
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  credentials: true
}));

// Stripe webhook needs raw body — must be before express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    await handleWebhookEvent(supabase, event);
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json({ limit: "100kb" }));

// --- Shared Supabase client ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Input validation helper ---
function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

const dataDir = path.join(__dirname, "data");
const agentsFile = path.join(dataDir, "agents.json");
const tasksFile = path.join(dataDir, "fleet-tasks.json");
const metricsFile = path.join(dataDir, "metrics.json");

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw || "null") ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureMetricsShape(metrics, agents = []) {
  const shaped = { ...(metrics || {}) };
  agents.forEach((agent) => {
    if (!shaped[agent.id]) {
      shaped[agent.id] = { tasksCompleted: 0, messagesSent: 0, lastSeen: null, uptimeChecks: [] };
    }
    if (!Array.isArray(shaped[agent.id].uptimeChecks)) {
      shaped[agent.id].uptimeChecks = [];
    }
  });
  return shaped;
}

function getSectionsModified(before = {}, after = {}) {
  const ignored = new Set(["deploy_url", "github_url", "edits", "versions", "last_published_content", "last_published_at", "last_published_url"]);
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changed = [];
  for (const key of keys) {
    if (ignored.has(key)) continue;
    const beforeVal = before ? before[key] : undefined;
    const afterVal = after ? after[key] : undefined;
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changed.push(key);
    }
  }
  return changed;
}

function stripContentForSnapshot(content = {}) {
  const snapshot = JSON.parse(JSON.stringify(content || {}));
  delete snapshot.edits;
  delete snapshot.versions;
  delete snapshot.deploy_url;
  delete snapshot.github_url;
  delete snapshot.last_published_content;
  delete snapshot.last_published_at;
  delete snapshot.last_published_url;
  return snapshot;
}

// --- Refinery module ---
app.use("/api/refinery", require("./refinery"));

// --- Foundry module ---
app.use("/api/foundry", require("./foundry"));

// --- Planner module ---
app.use("/api/planner", require("./planner"));

// --- Builder module ---
app.use("/api/builder", require("./builder"));

// --- Inspector module ---
app.use("/api/inspector", require("./inspector"));

// --- Deployer module ---
app.use("/api/deployer", require("./deployer"));
app.use("/api/auth/github", require("./github-auth"));
app.use("/api/admin", require("./admin"));
app.use("/api/validator", require("./validator"));

// --- Projects API ---
app.get("/api/projects", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ projects: data || [] });
});

app.post("/api/projects", requireAuth, async (req, res) => {
  const { company_name, idea, stage, needs } = req.body;
  if (!idea) return res.status(400).json({ error: "idea is required" });
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: req.user.id,
      full_name: req.body.full_name || "User",
      company_name: company_name || null,
      idea: idea.trim().slice(0, 2000),
      stage: stage || "idea",
      needs: needs || [],
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ project: data });
});

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// --- Docs (public, no auth) ---
app.get("/api/docs", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const docsPath = path.join(__dirname, "..", "public", "docs.md");
  try {
    const content = fs.readFileSync(docsPath, "utf8");
    res.type("text/markdown").send(content);
  } catch (err) {
    res.status(500).json({ error: "Docs not found" });
  }
});

// --- Stale generation recovery on startup ---
(async () => {
  try {
    const { data } = await supabase
      .from("deliverables")
      .update({ status: "failed" })
      .in("status", ["generating", "pending"])
      .select("id");
    if (data?.length) {
      console.log(`Recovered ${data.length} stale deliverables → failed`);
    }
  } catch (e) {
    console.error("Stale recovery error:", e.message);
  }
})();

// --- Rate limiter for generation endpoints ---
const genLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again in a minute." }
});

const editLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many edit requests. Try again in a minute." }
});

// --- Auth middleware: verify Supabase JWT + project ownership ---
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

    // If request has project_id, verify ownership
    const projectId = req.body.project_id || req.query.project_id || req.params.project_id;
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

// --- Protected generation endpoints ---

app.post("/api/generate", requireAuth, genLimiter, (req, res) => {
  const { project_id } = req.body;
  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  generateDeliverables(project_id).catch((err) => {
    console.error("Generation error:", err);
  });

  res.status(202).json({ message: "Generation started", project_id });
});

app.post("/api/regenerate", requireAuth, genLimiter, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  try {
    const { error } = await supabase
      .from("deliverables")
      .delete()
      .eq("project_id", project_id);

    if (error) {
      return res.status(500).json({ error: "Failed to clear deliverables" });
    }

    generateDeliverables(project_id).catch((err) => {
      console.error("Regeneration error:", err);
    });

    res.status(202).json({ message: "Regeneration started", project_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/retry-deliverable", requireAuth, genLimiter, async (req, res) => {
  const { deliverable_id, project_id } = req.body;
  if (!deliverable_id || !project_id) {
    return res.status(400).json({ error: "deliverable_id and project_id required" });
  }

  try {
    await supabase
      .from("deliverables")
      .update({ status: "pending", content: null })
      .eq("id", deliverable_id);

    retrySingleDeliverable(project_id, deliverable_id).catch(err => {
      console.error("Retry error:", err);
    });

    res.status(202).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/edit-landing", requireAuth, editLimiter, async (req, res) => {
  const project_id = req.body.project_id;
  const instruction = sanitize(req.body.instruction, 2000);
  const section_target = sanitize(req.body.section_target || "", 100);

  if (!project_id || !instruction) {
    return res.status(400).json({ error: "project_id and instruction are required" });
  }

  try {
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    if (deliverableError || !deliverable) {
      return res.status(404).json({ error: "Landing page deliverable not found" });
    }

    const currentContent = deliverable.content || {};
    const currentVersions = Array.isArray(currentContent.versions) ? currentContent.versions : [];
    const snapshot = stripContentForSnapshot(currentContent);
    const nextVersions = [...currentVersions, { content: snapshot, timestamp: new Date().toISOString(), instruction }].slice(-10);

    const system = `You are a precision landing page editor. Rules:
1. Apply ONLY the requested changes — preserve everything else exactly
2. Return the FULL updated content JSON (same schema, all sections)
3. Never invent content the user didn't ask for
4. Never remove sections unless explicitly asked
5. Keep all field names identical to the input schema
6. Return ONLY valid JSON — no markdown, no explanation, no code fences
7. If the instruction is ambiguous, make the minimal reasonable change`;
    const sectionHint = section_target ? `\n\nThe user is specifically editing the ${section_target} section. Focus changes there.` : '';
    const user = `Current content:\n${JSON.stringify(currentContent)}\n\nEdit instruction: ${instruction}${sectionHint}\n\nReturn the complete updated JSON with the edits applied.`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        response_format: { type: "json_object" }
      })
    });

    const aiData = await aiRes.json();
    if (!aiData.choices || !aiData.choices[0]) {
      console.error("AI returned no choices:", JSON.stringify(aiData).substring(0, 500));
      return res.status(500).json({ error: "AI returned no output" });
    }

    const raw = aiData.choices[0].message.content;
    let updatedContent;
    try {
      updatedContent = repairJson(raw);
    } catch (e) {
      console.error("AI JSON parse failed:", e.message);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const sections_modified = getSectionsModified(currentContent, updatedContent);
    updatedContent.edits = [
      ...(Array.isArray(currentContent.edits) ? currentContent.edits : []),
      {
        instruction,
        timestamp: new Date().toISOString(),
        sections_modified,
        section_target: section_target || null
      }
    ];
    updatedContent.versions = nextVersions;
    updatedContent.template = updatedContent.template || currentContent.template || "saas";
    updatedContent.deploy_url = currentContent.deploy_url || null;
    updatedContent.github_url = currentContent.github_url || null;
    updatedContent.last_published_content = currentContent.last_published_content || null;
    updatedContent.last_published_at = currentContent.last_published_at || null;
    updatedContent.last_published_url = currentContent.last_published_url || currentContent.deploy_url || null;

    await supabase
      .from("deliverables")
      .update({ content: updatedContent })
      .eq("id", deliverable.id);

    return res.json({
      preview_url: `/api/preview/${project_id}`,
      content: updatedContent,
      sections_modified
    });
  } catch (err) {
    console.error("Edit landing error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/edit-landing/versions", requireAuth, async (req, res) => {
  const project_id = sanitize(req.query.project_id, 200);
  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  try {
    const { data: deliverable, error } = await supabase
      .from("deliverables")
      .select("content")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    if (error || !deliverable) {
      return res.status(404).json({ error: "Landing page deliverable not found" });
    }

    return res.json({ versions: Array.isArray(deliverable.content?.versions) ? deliverable.content.versions : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/edit-landing/rollback", requireAuth, async (req, res) => {
  const project_id = req.body.project_id;
  const version_index = Number(req.body.version_index);

  if (!project_id || Number.isNaN(version_index)) {
    return res.status(400).json({ error: "project_id and version_index are required" });
  }

  try {
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    if (deliverableError || !deliverable) {
      return res.status(404).json({ error: "Landing page deliverable not found" });
    }

    const currentContent = deliverable.content || {};
    const versions = Array.isArray(currentContent.versions) ? currentContent.versions : [];
    const target = versions[version_index];
    if (!target?.content) {
      return res.status(400).json({ error: "Invalid version index" });
    }

    const restored = { ...target.content };
    restored.versions = versions;
    restored.edits = [
      ...(Array.isArray(currentContent.edits) ? currentContent.edits : []),
      {
        instruction: `Rollback to version #${version_index + 1}`,
        timestamp: new Date().toISOString(),
        sections_modified: getSectionsModified(currentContent, restored),
        section_target: null
      }
    ];
    restored.template = restored.template || currentContent.template || "saas";

    const { data: project } = await supabase
      .from("projects")
      .select("company_name, full_name")
      .eq("id", project_id)
      .single();

    const projectDir = path.join("/tmp/landing-projects", project_id);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true });
    }

    const meta = { company_name: project?.company_name || "", full_name: project?.full_name || "" };
    await generateLandingProject(restored, projectDir, meta, restored.template, project_id);
    const urls = await deployLandingPage(projectDir, project?.company_name || project?.full_name || "project", deliverable.id);

    restored.deploy_url = urls.deploy_url;
    restored.github_url = urls.github_url;
    restored.last_published_content = stripContentForSnapshot(restored);
    restored.last_published_at = new Date().toISOString();
    restored.last_published_url = urls.deploy_url;

    try { fs.rmSync(projectDir, { recursive: true }); } catch (e) {}

    await supabase
      .from("deliverables")
      .update({ content: restored })
      .eq("id", deliverable.id);

    return res.json({ ok: true, deploy_url: urls.deploy_url, content: restored });
  } catch (err) {
    console.error("Rollback error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/edit-landing/switch-template", requireAuth, async (req, res) => {
  const project_id = req.body.project_id;
  const template = sanitize(req.body.template, 20) || "saas";

  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  if (!['saas', 'marketplace', 'mobile'].includes(template)) {
    return res.status(400).json({ error: "Invalid template" });
  }

  try {
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    if (deliverableError || !deliverable) {
      return res.status(404).json({ error: "Landing page deliverable not found" });
    }

    const currentContent = deliverable.content || {};
    const updated = { ...currentContent, template };

    const { data: project } = await supabase
      .from("projects")
      .select("company_name, full_name")
      .eq("id", project_id)
      .single();

    const projectDir = path.join("/tmp/landing-projects", project_id);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true });
    }

    const meta = { company_name: project?.company_name || "", full_name: project?.full_name || "" };
    await generateLandingProject(updated, projectDir, meta, template);
    const urls = await deployLandingPage(projectDir, project?.company_name || project?.full_name || "project", deliverable.id);

    updated.deploy_url = urls.deploy_url;
    updated.github_url = urls.github_url;
    updated.last_published_content = stripContentForSnapshot(updated);
    updated.last_published_at = new Date().toISOString();
    updated.last_published_url = urls.deploy_url;

    try { fs.rmSync(projectDir, { recursive: true }); } catch (e) {}

    await supabase
      .from("deliverables")
      .update({ content: updated })
      .eq("id", deliverable.id);

    return res.json({ ok: true, deploy_url: urls.deploy_url, content: updated });
  } catch (err) {
    console.error("Template switch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/edit-landing/publish", requireAuth, async (req, res) => {
  const project_id = req.body.project_id;
  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  try {
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    if (deliverableError || !deliverable) {
      return res.status(404).json({ error: "Landing page deliverable not found" });
    }

    const currentContent = deliverable.content || {};
    const { data: project } = await supabase
      .from("projects")
      .select("company_name, full_name")
      .eq("id", project_id)
      .single();

    const projectDir = path.join("/tmp/landing-projects", project_id);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true });
    }

    const meta = { company_name: project?.company_name || "", full_name: project?.full_name || "" };
    await generateLandingProject(currentContent, projectDir, meta, currentContent.template || "saas");
    const urls = await deployLandingPage(projectDir, project?.company_name || project?.full_name || "project", deliverable.id);

    currentContent.deploy_url = urls.deploy_url;
    currentContent.github_url = urls.github_url;
    currentContent.last_published_content = stripContentForSnapshot(currentContent);
    currentContent.last_published_at = new Date().toISOString();
    currentContent.last_published_url = urls.deploy_url;

    try { fs.rmSync(projectDir, { recursive: true }); } catch (e) {}

    await supabase
      .from("deliverables")
      .update({ content: currentContent })
      .eq("id", deliverable.id);

    return res.json({ ok: true, deploy_url: urls.deploy_url, content: currentContent });
  } catch (err) {
    console.error("Publish error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/preview/:project_id", async (req, res) => {
  const project_id = sanitize(req.params.project_id, 200);
  if (!project_id) {
    return res.status(400).send("Missing project id");
  }

  try {
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    if (deliverableError || !deliverable) {
      return res.status(404).send("Landing page deliverable not found");
    }

    const { data: project } = await supabase
      .from("projects")
      .select("company_name, full_name")
      .eq("id", project_id)
      .single();

    const content = deliverable.content || {};
    const meta = { company_name: project?.company_name || "", full_name: project?.full_name || "" };
    const html = renderLandingHTML(content, content.template || "saas", meta);

    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (err) {
    return res.status(500).send("Failed to render preview");
  }
});

// --- Fleet endpoints (internal, no auth) ---

function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function loadAgents() {
  return readJson(agentsFile, []);
}

function stripSecrets(agent) {
  const { gatewayToken, ...safe } = agent;
  return safe;
}

async function notifyAgentTask(agent, task) {
  if (!agent || !agent.gateway || !agent.gatewayToken) return;
  try {
    await fetch(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${agent.gatewayToken}`
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: {
          action: "wake",
          text: `New task assigned: [${task.priority}] ${task.title}\n\n${task.description}`,
          mode: "now"
        }
      })
    });
  } catch (err) {
    console.error("Failed to notify agent:", err);
  }
}

app.get("/api/fleet/agents", (req, res) => {
  return res.json(loadAgents().map(stripSecrets));
});

app.get("/api/fleet/agents/:id", (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  return res.json(stripSecrets(agent));
});

app.get("/api/fleet/agents/:id/status", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.json({ online: false });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({ tool: "session_status", parameters: {} })
    }, 5000);
    if (!resp.ok) throw new Error("gateway_unreachable");
    const data = await resp.json();
    return res.json({ online: true, statusText: data?.result?.details?.statusText || "Online" });
  } catch (err) {
    return res.json({ online: false });
  }
});

app.get("/api/fleet/agents/:id/memory", (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.workspace) return res.json({ available: false });

  try {
    const memoryPath = path.join(agent.workspace, "MEMORY.md");
    const soulPath = path.join(agent.workspace, "SOUL.md");
    const memory = fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, "utf8") : "";
    const soul = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, "utf8") : "";
    return res.json({ available: true, memory, soul });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read memory" });
  }
});

app.put("/api/fleet/agents/:id/memory", (req, res) => {
  const { file, content } = req.body || {};
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.workspace) return res.status(400).json({ error: "Remote editing not supported yet" });

  if (!file || !["MEMORY.md", "SOUL.md"].includes(file)) {
    return res.status(400).json({ error: "file must be MEMORY.md or SOUL.md" });
  }

  try {
    const target = path.join(agent.workspace, file);
    fs.writeFileSync(target, typeof content === "string" ? content : "");
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to write memory" });
  }
});

app.get("/api/fleet/agents/:id/memory/daily", (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.workspace) return res.status(400).json({ error: "Remote editing not supported yet" });

  try {
    const memoryDir = path.join(agent.workspace, "memory");
    if (!fs.existsSync(memoryDir)) return res.json({ files: [] });
    const entries = fs.readdirSync(memoryDir).filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name));
    const files = entries
      .sort((a, b) => b.localeCompare(a))
      .map((name) => {
        const filePath = path.join(memoryDir, name);
        const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
        return { file: `memory/${name}`, content };
      });
    return res.json({ files });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read daily notes" });
  }
});

app.get("/api/fleet/agents/:id/memory/:file(*)", (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.workspace) return res.status(400).json({ error: "Remote editing not supported yet" });

  const file = req.params.file;
  const allowedRoot = ["MEMORY.md", "SOUL.md"].includes(file);
  const allowedDaily = file.startsWith("memory/") && file.endsWith(".md") && !file.includes("..") && !file.includes("\\");
  if (!allowedRoot && !allowedDaily) {
    return res.status(400).json({ error: "Invalid file" });
  }

  try {
    const target = path.join(agent.workspace, file);
    if (!fs.existsSync(target)) return res.status(404).json({ error: "File not found" });
    const content = fs.readFileSync(target, "utf8");
    return res.json({ file, content });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read file" });
  }
});

app.get("/api/fleet/agents/:id/cron", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({ tool: "cron", parameters: { action: "list" } })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron list failed" });
    return res.json({ jobs: data?.jobs || data });
  } catch (err) {
    return res.status(500).json({ error: "cron list failed" });
  }
});

app.post("/api/fleet/agents/:id/cron", async (req, res) => {
  const job = req.body || {};
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: { action: "add", job }
      })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron add failed" });
    return res.json({ ok: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: "cron add failed" });
  }
});

app.put("/api/fleet/agents/:id/cron/:jobId", async (req, res) => {
  const patch = req.body || {};
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: { action: "update", jobId: req.params.jobId, patch }
      })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron update failed" });
    return res.json({ ok: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: "cron update failed" });
  }
});

app.delete("/api/fleet/agents/:id/cron/:jobId", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: { action: "remove", jobId: req.params.jobId }
      })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron remove failed" });
    return res.json({ ok: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: "cron remove failed" });
  }
});

app.get("/api/fleet/agents/:id/cron/:jobId/history", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: { action: "runs", jobId: req.params.jobId }
      })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron history failed" });
    return res.json({ ok: true, runs: data?.runs || data });
  } catch (err) {
    return res.status(500).json({ error: "cron history failed" });
  }
});

app.post("/api/fleet/agents/:id/cron/:jobId/toggle", async (req, res) => {
  const { enabled } = req.body;
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: {
          action: "update",
          jobId: req.params.jobId,
          patch: { enabled: !!enabled }
        }
      })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron update failed" });
    return res.json({ ok: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: "cron update failed" });
  }
});

app.post("/api/fleet/agents/:id/cron/:jobId/run", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.gateway) return res.status(400).json({ error: "Agent has no gateway" });

  try {
    const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
      },
      body: JSON.stringify({
        tool: "cron",
        parameters: { action: "run", jobId: req.params.jobId }
      })
    }, 5000);

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data?.error || "cron run failed" });
    return res.json({ ok: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: "cron run failed" });
  }
});

app.get("/api/fleet/agents/:id/activity", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (!agent.discordBotId) return res.json([]);

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return res.json([]);

  const channelId = "1471822299203371030";
  try {
    const resp = await fetchWithTimeout(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
      headers: { Authorization: `Bot ${token}` }
    }, 5000);
    if (!resp.ok) return res.json([]);
    const data = await resp.json();
    const items = (Array.isArray(data) ? data : [])
      .filter((msg) => msg?.author?.id === agent.discordBotId)
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        channel: channelId
      }));
    return res.json(items);
  } catch (err) {
    return res.json([]);
  }
});

app.get("/api/fleet/agents/:id/metrics", async (req, res) => {
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const tasks = readJson(tasksFile, []);
  const tasksCompleted = tasks.filter((t) => t.agentId === agent.id && t.status === "done").length;

  const metrics = ensureMetricsShape(readJson(metricsFile, {}), agents);
  const uptimeChecks = Array.isArray(metrics[agent.id]?.uptimeChecks) ? metrics[agent.id].uptimeChecks : [];
  const lastSeen = metrics[agent.id]?.lastSeen || null;

  const recentChecks = uptimeChecks.slice(-24);
  const uptime = recentChecks.length
    ? Math.round((recentChecks.filter((c) => c.online).length / recentChecks.length) * 100)
    : 0;

  let messagesSent = 0;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (token && agent.discordBotId) {
    const channelId = "1471822299203371030";
    try {
      const resp = await fetchWithTimeout(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
        headers: { Authorization: `Bot ${token}` }
      }, 5000);
      if (resp.ok) {
        const data = await resp.json();
        const since = Date.now() - 24 * 60 * 60 * 1000;
        messagesSent = (Array.isArray(data) ? data : []).filter((msg) => {
          if (msg?.author?.id !== agent.discordBotId) return false;
          const ts = Date.parse(msg.timestamp);
          return Number.isFinite(ts) && ts >= since;
        }).length;
      }
    } catch (err) {
      messagesSent = 0;
    }
  }

  return res.json({ tasksCompleted, messagesSent, lastSeen, uptime });
});

app.post("/api/fleet/metrics/check", async (req, res) => {
  const agents = loadAgents();
  const metrics = ensureMetricsShape(readJson(metricsFile, {}), agents);
  const now = new Date().toISOString();

  const results = await Promise.all(agents.map(async (agent) => {
    let online = false;
    if (agent.gateway) {
      try {
        const resp = await fetchWithTimeout(`${agent.gateway}/tools/invoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(agent.gatewayToken ? { "Authorization": `Bearer ${agent.gatewayToken}` } : {})
          },
          body: JSON.stringify({ tool: "session_status", parameters: {} })
        }, 5000);
        online = resp.ok;
      } catch (err) {
        online = false;
      }
    }

    const agentMetrics = metrics[agent.id] || { tasksCompleted: 0, messagesSent: 0, lastSeen: null, uptimeChecks: [] };
    agentMetrics.uptimeChecks = Array.isArray(agentMetrics.uptimeChecks) ? agentMetrics.uptimeChecks : [];
    agentMetrics.uptimeChecks.push({ ts: now, online });
    if (agentMetrics.uptimeChecks.length > 200) {
      agentMetrics.uptimeChecks = agentMetrics.uptimeChecks.slice(-200);
    }
    if (online) agentMetrics.lastSeen = now;
    metrics[agent.id] = agentMetrics;

    return { id: agent.id, online };
  }));

  writeJson(metricsFile, metrics);
  return res.json({ ok: true, results });
});

app.get("/api/fleet/tasks", (req, res) => {
  const tasks = readJson(tasksFile, []);
  const { agent, status } = req.query;
  let filtered = tasks;
  if (agent) filtered = filtered.filter((t) => t.agentId === agent);
  if (status) filtered = filtered.filter((t) => t.status === status);
  return res.json(filtered);
});

app.post("/api/fleet/tasks", (req, res) => {
  const { title, description, priority, agentId } = req.body;
  if (!title || !agentId) {
    return res.status(400).json({ error: "title and agentId are required" });
  }
  const tasks = readJson(tasksFile, []);
  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    title: sanitize(title, 200),
    description: sanitize(description || "", 2000),
    priority: sanitize(priority || "P2", 3) || "P2",
    agentId: sanitize(agentId, 50),
    status: "backlog",
    createdAt: now,
    updatedAt: now
  };
  tasks.push(task);
  writeJson(tasksFile, tasks);

  if (["backlog", "in_progress"].includes(task.status)) {
    const agents = loadAgents();
    const agent = agents.find((a) => a.id === task.agentId);
    notifyAgentTask(agent, task);
  }

  return res.status(201).json(task);
});

app.post("/api/fleet/tasks/:id/notify", (req, res) => {
  const tasks = readJson(tasksFile, []);
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  const agents = loadAgents();
  const agent = agents.find((a) => a.id === task.agentId);
  notifyAgentTask(agent, task);
  return res.json({ ok: true });
});

app.patch("/api/fleet/tasks/:id", (req, res) => {
  const tasks = readJson(tasksFile, []);
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });

  const updates = req.body || {};
  const updated = {
    ...tasks[idx],
    title: updates.title ? sanitize(updates.title, 200) : tasks[idx].title,
    description: typeof updates.description === "string" ? sanitize(updates.description, 2000) : tasks[idx].description,
    priority: updates.priority ? sanitize(updates.priority, 3) : tasks[idx].priority,
    status: updates.status ? sanitize(updates.status, 20) : tasks[idx].status,
    updatedAt: new Date().toISOString()
  };

  tasks[idx] = updated;
  writeJson(tasksFile, tasks);
  return res.json(updated);
});

app.delete("/api/fleet/tasks/:id", (req, res) => {
  const tasks = readJson(tasksFile, []);
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });
  const [removed] = tasks.splice(idx, 1);
  writeJson(tasksFile, tasks);
  return res.json({ ok: true, removed });
});

// --- Public endpoints ---

app.post("/api/waitlist", rateLimit({ windowMs: 60000, max: 3 }), async (req, res) => {
  const email = sanitize(req.body.email, 254);
  const source = sanitize(req.body.source || "website", 50);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "valid email required" });
  }

  try {
    const { error } = await supabase
      .from("waitlist")
      .upsert({ email: email.toLowerCase().trim(), source: source || "website" }, { onConflict: "email" });

    if (error && error.code === "42P01") {
      console.error("waitlist table does not exist");
      return res.status(500).json({ error: "waitlist table not configured" });
    }
    if (error) return res.status(500).json({ error: error.message });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics Endpoints ---

// Receive analytics events from landing pages (public, CORS-enabled)
app.post("/api/analytics/track", async (req, res) => {
  const { p: projectId, e: event, u: url, r: referrer, s: sessionId, t: timestamp, ...props } = req.body;
  
  if (!projectId || !event) {
    return res.status(400).json({ error: "missing project_id or event" });
  }

  try {
    const { error } = await supabase.from("analytics_events").insert({
      project_id: projectId,
      event_type: event,
      url: url?.substring(0, 500) || null,
      referrer: referrer?.substring(0, 500) || null,
      session_id: sessionId?.substring(0, 100) || null,
      properties: props,
      created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    });

    if (error) {
      // Table may not exist, log but don't fail
      console.warn("Analytics insert failed:", error.message);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Analytics track error:", err);
    res.json({ ok: true }); // Always return success to not block landing pages
  }
});

// Get analytics stats for a project (protected)
app.get("/api/analytics/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const { days = 7 } = req.query;
  
  try {
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    
    // Get pageviews
    const { data: pageviews } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("project_id", projectId)
      .eq("event_type", "pageview")
      .gte("created_at", since);

    // Get unique sessions
    const { data: sessions } = await supabase
      .from("analytics_events")
      .select("session_id")
      .eq("project_id", projectId)
      .eq("event_type", "pageview")
      .gte("created_at", since);

    // Get CTA clicks
    const { data: clicks } = await supabase
      .from("analytics_events")
      .select("id, properties")
      .eq("project_id", projectId)
      .eq("event_type", "cta_click")
      .gte("created_at", since);

    // Get daily breakdown
    const { data: daily } = await supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .eq("project_id", projectId)
      .gte("created_at", since);

    const uniqueSessions = new Set(sessions?.map(s => s.session_id)).size;
    
    // Group by day for chart
    const dailyStats = {};
    daily?.forEach(e => {
      const day = e.created_at.split('T')[0];
      if (!dailyStats[day]) dailyStats[day] = { views: 0, clicks: 0 };
      if (e.event_type === 'pageview') dailyStats[day].views++;
      if (e.event_type === 'cta_click') dailyStats[day].clicks++;
    });

    res.json({
      views: pageviews?.length || 0,
      uniqueVisitors: uniqueSessions,
      clicks: clicks?.length || 0,
      ctr: pageviews?.length ? Math.round((clicks?.length || 0) / pageviews.length * 1000) / 10 : 0,
      daily: Object.entries(dailyStats)
        .sort()
        .map(([date, stats]) => ({ date, ...stats }))
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// --- Custom Domain Endpoints ---

// Check domain availability
app.get("/api/domains/check", requireAuth, async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "domain is required" });
  
  const token = process.env.VERCEL_TOKEN;
  if (!token) return res.status(500).json({ error: "Domain service not configured" });

  try {
    const manager = new DomainManager(token);
    const result = await manager.checkDomain(domain.toLowerCase().trim());
    res.json(result);
  } catch (err) {
    console.error("Domain check error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Configure domain for a project
app.post("/api/domains/configure", requireAuth, async (req, res) => {
  const { project_id, domain } = req.body;
  if (!project_id || !domain) {
    return res.status(400).json({ error: "project_id and domain are required" });
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) return res.status(500).json({ error: "Domain service not configured" });

  try {
    // Get the Vercel project name for this landing page
    const { data: deliverable } = await supabase
      .from("deliverables")
      .select("content")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    // Find or create deployment record to get Vercel project name
    const githubUrl = deliverable?.content?.github_url || '';
    const repoMatch = githubUrl.match(/github\.com\/[^/]+\/(.+?)(?:\.git)?$/);
    const repoName = repoMatch ? repoMatch[1] : null;

    if (!repoName) {
      return res.status(400).json({ error: "No deployed landing page found for this project" });
    }

    const manager = new DomainManager(token);
    const result = await manager.configureDomain(repoName, domain.toLowerCase().trim());

    // Store domain config in Supabase
    await supabase.from("custom_domains").upsert({
      project_id,
      domain: domain.toLowerCase().trim(),
      status: result.status,
      verification: result.verification,
      dns_config: result.dns,
      updated_at: new Date().toISOString()
    }, { onConflict: "domain" });

    res.json(result);
  } catch (err) {
    console.error("Domain configure error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify domain configuration
app.post("/api/domains/verify", requireAuth, async (req, res) => {
  const { project_id, domain } = req.body;
  if (!project_id || !domain) {
    return res.status(400).json({ error: "project_id and domain are required" });
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) return res.status(500).json({ error: "Domain service not configured" });

  try {
    const { data: deliverable } = await supabase
      .from("deliverables")
      .select("content")
      .eq("project_id", project_id)
      .eq("type", "landing_page")
      .single();

    const githubUrl = deliverable?.content?.github_url || '';
    const repoMatch = githubUrl.match(/github\.com\/[^/]+\/(.+?)(?:\.git)?$/);
    const repoName = repoMatch ? repoMatch[1] : null;

    if (!repoName) {
      return res.status(400).json({ error: "No deployed landing page found" });
    }

    const manager = new DomainManager(token);
    const result = await manager.verifyDomain(repoName, domain.toLowerCase().trim());

    // Update domain status
    await supabase.from("custom_domains").update({
      status: result.verified ? 'active' : 'pending',
      updated_at: new Date().toISOString()
    }).eq("domain", domain.toLowerCase().trim());

    res.json(result);
  } catch (err) {
    console.error("Domain verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get domains for a project
app.get("/api/domains/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const { data: domains } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("project_id", projectId);

    res.json({ domains: domains || [] });
  } catch (err) {
    console.error("Domain list error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- AI Co-founder Chat Endpoints ---

// Get chat history for a project
app.get("/api/chat/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const { limit = 50 } = req.query;

  try {
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Get project context for system message
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("type, content")
      .eq("project_id", projectId)
      .eq("status", "completed");

    res.json({
      messages: (messages || []).reverse(),
      context: {
        project: { name: project?.company_name, idea: project?.idea, stage: project?.stage },
        deliverables: (deliverables || []).map(d => ({ type: d.type, summary: summarizeDeliverable(d) }))
      }
    });
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send message to AI co-founder
app.post("/api/chat/:projectId", requireAuth, rateLimit({ windowMs: 60000, max: 20 }), async (req, res) => {
  const { projectId } = req.params;
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    // Save user message
    const { data: userMsg, error: userError } = await supabase
      .from("chat_messages")
      .insert({ project_id: projectId, role: "user", content: message.trim() })
      .select()
      .single();

    if (userError) throw userError;

    // Get recent context (last 10 messages)
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get project and deliverables for context
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("type, content")
      .eq("project_id", projectId)
      .eq("status", "completed");

    // Build AI prompt with full business context
    const systemPrompt = buildCofounderSystemPrompt(project, deliverables);
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(recentMessages || []).reverse().map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() }
    ];

    // Call AI
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const aiData = await aiRes.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "I'm not sure how to help with that right now.";

    // Save AI response
    const { data: aiMsg } = await supabase
      .from("chat_messages")
      .insert({ project_id: projectId, role: "assistant", content: aiResponse })
      .select()
      .single();

    res.json({
      user_message: userMsg,
      assistant_message: aiMsg,
      context_used: deliverables?.length || 0
    });
  } catch (err) {
    console.error("Chat message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Clear chat history
app.delete("/api/chat/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;

  try {
    await supabase
      .from("chat_messages")
      .delete()
      .eq("project_id", projectId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Build system prompt with full business context
function buildCofounderSystemPrompt(project, deliverables) {
  const dMap = {};
  (deliverables || []).forEach(d => { dMap[d.type] = d.content; });

  let prompt = `You are an experienced startup co-founder and advisor. You're helping ${project?.full_name || 'the founder'} with their startup ${project?.company_name || ''}.

Your role is to provide strategic advice, answer questions, challenge assumptions, and help them think through decisions. Be direct, practical, and actionable — like a real co-founder would be.

Here's what you know about their business:

`;

  if (project?.idea) {
    prompt += `**The Idea:** ${project.idea}\n\n`;
  }
  if (project?.stage) {
    prompt += `**Current Stage:** ${project.stage}\n\n`;
  }

  if (dMap.business_plan?.executive_summary) {
    prompt += `**Business Summary:** ${dMap.business_plan.executive_summary}\n\n`;
  }

  if (dMap.brand_identity?.taglines?.[0]) {
    prompt += `**Positioning:** "${dMap.brand_identity.taglines[0].text}"\n\n`;
  }

  if (dMap.competitor_analysis?.competitors?.length > 0) {
    const comps = dMap.competitor_analysis.competitors.slice(0, 3).map(c => c.name).join(', ');
    prompt += `**Key Competitors:** ${comps}\n\n`;
  }

  if (dMap.growth_strategy?.channel_strategy?.length > 0) {
    const channels = dMap.growth_strategy.channel_strategy.slice(0, 2).map(c => c.channel).join(', ');
    prompt += `**Growth Focus:** ${channels}\n\n`;
  }

  prompt += `When answering:
1. Reference specific details from their business context when relevant
2. Give concrete next steps, not just high-level advice
3. Challenge weak assumptions gently but directly
4. Prioritize speed and validation over perfection
5. If they ask about something not in your context, tell them you need more info

Current date: ${new Date().toISOString().split('T')[0]}`;

  return prompt;
}

// Helper: Summarize deliverable for context list
function summarizeDeliverable(d) {
  switch (d.type) {
    case 'brand_identity':
      return d.content?.taglines?.[0]?.text || 'Brand strategy completed';
    case 'landing_page':
      return d.content?.hero?.headline || 'Landing page created';
    case 'business_plan':
      return d.content?.executive_summary?.slice(0, 100) + '...' || 'Business plan complete';
    case 'growth_strategy':
      return `${d.content?.channel_strategy?.length || 0} growth channels identified`;
    case 'personal_brand':
      return 'Launch content ready';
    case 'pitch_deck':
      return `${d.content?.slides?.length || 0}-slide pitch deck ready`;
    case 'competitor_analysis':
      return `${d.content?.competitors?.length || 0} competitors analyzed`;
    default:
      return 'Completed';
  }
}

// --- Stripe Billing Endpoints ---

app.get("/api/subscription", requireAuth, async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    const plan = sub?.plan || "free";
    res.json({
      plan,
      status: sub?.status || "active",
      currentPeriodEnd: sub?.current_period_end || null,
      projectLimit: PLANS[plan]?.projectLimit ?? 1,
      plans: Object.entries(PLANS).map(([key, p]) => ({
        id: key, name: p.name, price: p.price, projectLimit: p.projectLimit === Infinity ? "unlimited" : p.projectLimit,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/checkout", requireAuth, async (req, res) => {
  const { plan } = req.body;
  if (!plan || !PLANS[plan] || plan === "free") {
    return res.status(400).json({ error: "Invalid plan" });
  }
  try {
    const session = await createCheckoutSession(supabase, req.user.id, req.user.email, plan);
    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/billing-portal", requireAuth, async (req, res) => {
  try {
    const session = await createPortalSession(supabase, req.user.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Error handling ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
