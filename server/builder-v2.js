const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Builder worker: Mu's OpenClaw instance (dedicated build plane)
// Override with OPENCLAW_BUILDER_URL/TOKEN for different workers
const OPENCLAW_URL = process.env.OPENCLAW_BUILDER_URL || process.env.OPENCLAW_URL || "http://159.65.235.128:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_BUILDER_TOKEN || process.env.OPENCLAW_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN;

// Auth middleware (copy from builder.js)
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = authHeader.replace("Bearer ", "");
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
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed" });
  }
}

// --- Call OpenClaw API ---
async function openclawInvoke(tool, params) {
  const res = await fetch(`${OPENCLAW_URL}/tools/invoke`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENCLAW_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, params }),
  });
  return res.json();
}

// --- Spawn a Codex agent for a work order ---
async function spawnBuildAgent(projectId, featureId, workOrder, blueprint, platformContext) {
  const task = buildAgentTask(workOrder, blueprint, platformContext);
  
  const result = await openclawInvoke("sessions_spawn", {
    task,
    label: `build-${projectId}-${featureId}-${workOrder?.id || 'main'}`,
    model: "codex",
    runTimeoutSeconds: 300,
  });
  
  return result;
}

// --- Build the task prompt for a Codex agent ---
function buildAgentTask(workOrder, blueprint, platformContext) {
  const woDesc = workOrder 
    ? `## Work Order: ${workOrder.title}\n\n${workOrder.description || ''}\n\nPhase: ${workOrder.phase}\nPriority: ${workOrder.priority}\n\nTasks:\n${(workOrder.tasks || []).map(t => `- ${t}`).join('\n')}`
    : '';

  const bpDesc = blueprint
    ? `## Blueprint\n\n### API Design\n${blueprint.api_design || ''}\n\n### UI Components\n${blueprint.ui_components || ''}\n\n### Data Model\n${blueprint.data_model || ''}`
    : '';

  const ctxDesc = platformContext
    ? `## Existing Platform Context\n\nThis is an INTERNAL feature being added to the dante.id platform.\n\n### API Routes\n${JSON.stringify(platformContext.api_routes || [], null, 2)}\n\n### Database Tables\n${JSON.stringify(platformContext.db_tables || [], null, 2)}\n\n### Frontend Routes\n${JSON.stringify(platformContext.frontend_routes || [], null, 2)}\n\n### Tech Stack\n${JSON.stringify(platformContext.tech_stack || {}, null, 2)}`
    : '';

  return `You are building a feature for the dante.id platform.

${bpDesc}

${woDesc}

${ctxDesc}

## Instructions
1. Generate ALL necessary files for this feature
2. Each file should be complete and production-ready
3. Use the existing tech stack (React + Vite + Tailwind frontend, Express + Supabase backend)
4. Follow the dark terminal design aesthetic (bg: #0a0a0a, accent: #33ff00, font: monospace, sharp edges)
5. Include error handling and proper TypeScript/JSX patterns

## Output Format
After generating all files, create a JSON summary file at /tmp/build-output.json with:
{
  "files": [
    { "path": "relative/path/to/file.js", "content": "file content..." },
    ...
  ],
  "tests": [
    { "path": "tests/feature.test.js", "content": "test content..." },
    ...
  ],
  "summary": "Brief description of what was built"
}

Write each file to disk first, then create the summary JSON.`;
}

// --- POST /generate-code --- (v2 with OpenClaw agents)
router.post("/generate-code", requireAuth, async (req, res) => {
  const { feature_id, project_id } = req.body;
  if (!feature_id || !project_id) {
    return res.status(400).json({ error: "feature_id and project_id required" });
  }

  try {
    // Fetch feature, blueprint, project, work orders
    const { data: feature } = await supabase.from("features").select("*").eq("id", feature_id).single();
    if (!feature) return res.status(404).json({ error: "Feature not found" });

    const { data: blueprint } = await supabase.from("blueprints").select("*").eq("feature_id", feature_id).single();
    if (!blueprint) return res.status(404).json({ error: "Blueprint not found" });

    const { data: project } = await supabase.from("projects").select("*, type").eq("id", project_id).single();
    
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("*")
      .eq("feature_id", feature_id)
      .eq("project_id", project_id)
      .order("phase");

    // Get platform context for internal projects
    let platformContext = null;
    if (project?.type === "internal") {
      try {
        const ctxRes = await fetch("http://localhost:3001/api/platform/context");
        if (ctxRes.ok) platformContext = await ctxRes.json();
      } catch (e) { console.log("[Builder-v2] Platform context fetch failed"); }
    }

    // Create/update build record
    const { data: existingBuild } = await supabase
      .from("builds")
      .select("id")
      .eq("feature_id", feature_id)
      .eq("project_id", project_id)
      .single();

    let buildId;
    if (existingBuild) {
      buildId = existingBuild.id;
      await supabase.from("builds")
        .update({ status: "generating", files: [], logs: ["Spawning OpenClaw agents..."], updated_at: new Date().toISOString() })
        .eq("id", buildId);
    } else {
      const { data: newBuild } = await supabase
        .from("builds")
        .insert({ project_id, feature_id, status: "generating", files: [], logs: ["Spawning OpenClaw agents..."] })
        .select().single();
      buildId = newBuild.id;
    }

    // Spawn agents — one per work order, or one for the whole feature
    const agents = [];
    if (workOrders?.length > 0) {
      const spawnPromises = workOrders.map(wo => 
        spawnBuildAgent(project_id, feature_id, wo, blueprint, platformContext)
      );
      const results = await Promise.allSettled(spawnPromises);
      results.forEach((r, i) => {
        agents.push({
          workOrder: workOrders[i].title,
          status: r.status,
          sessionKey: r.status === 'fulfilled' ? r.value?.childSessionKey : null,
          error: r.status === 'rejected' ? r.reason?.message : null,
        });
      });
    } else {
      const result = await spawnBuildAgent(project_id, feature_id, null, blueprint, platformContext);
      agents.push({
        workOrder: feature.name,
        status: 'fulfilled',
        sessionKey: result?.childSessionKey,
      });
    }

    // Update build with agent info
    const logs = agents.map(a => 
      `[${new Date().toISOString()}] Spawned agent for "${a.workOrder}": ${a.sessionKey || a.error || 'unknown'}`
    );
    
    await supabase.from("builds")
      .update({ 
        status: "building", 
        logs,
        metadata: { agents, engine: "openclaw-swarm-v2" },
        updated_at: new Date().toISOString() 
      })
      .eq("id", buildId);

    // Start background polling for agent completion
    pollAgentCompletion(buildId, agents, project_id, feature_id).catch(err => {
      console.error("[Builder-v2] Polling error:", err.message);
    });

    return res.json({
      build_id: buildId,
      engine: "openclaw-swarm-v2",
      agents_spawned: agents.length,
      agents,
      message: "Build agents spawned. Poll GET /api/builder-v2/:project_id/builds/:build_id for status.",
    });
  } catch (err) {
    console.error("[Builder-v2] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Background polling for agent completion ---
async function pollAgentCompletion(buildId, agents, projectId, featureId) {
  const MAX_POLLS = 60;
  const POLL_INTERVAL = 5000;
  
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    
    let allDone = true;
    
    for (const agent of agents) {
      if (!agent.sessionKey || agent.completed) continue;
      
      try {
        const history = await openclawInvoke("sessions_history", {
          sessionKey: agent.sessionKey,
          limit: 1,
        });
        
        const msgs = history?.messages || [];
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.content) {
            const textContent = lastMsg.content.find?.(c => c.type === 'text')?.text || 
                              (typeof lastMsg.content === 'string' ? lastMsg.content : '');
            if (textContent && !lastMsg.content.find?.(c => c.type === 'toolCall')) {
              agent.completed = true;
              agent.output = textContent;
            }
          }
        }
      } catch (e) {
        console.log(`[Builder-v2] Poll error for ${agent.sessionKey}:`, e.message);
      }
      
      if (!agent.completed) allDone = false;
    }
    
    const completedCount = agents.filter(a => a.completed).length;
    await supabase.from("builds")
      .update({ 
        logs: [`[${new Date().toISOString()}] Progress: ${completedCount}/${agents.length} agents complete`],
        updated_at: new Date().toISOString(),
      })
      .eq("id", buildId);
    
    if (allDone) break;
  }
  
  // Collect results from all agents
  const allFiles = [];
  const allTests = [];
  
  for (const agent of agents) {
    if (agent.output) {
      try {
        const jsonMatch = agent.output.match(/```json\n([\s\S]*?)\n```/) || 
                          agent.output.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          if (parsed.files) allFiles.push(...parsed.files);
          if (parsed.tests) allTests.push(...parsed.tests);
        }
      } catch (e) {
        console.log(`[Builder-v2] Failed to parse agent output:`, e.message);
      }
    }
  }
  
  const finalStatus = allFiles.length > 0 ? "done" : "failed";
  await supabase.from("builds")
    .update({ 
      status: finalStatus,
      files: allFiles.map(f => ({ path: f.path, language: f.path.split('.').pop() || 'txt', content: f.content })),
      logs: [
        ...agents.map(a => `Agent "${a.workOrder}": ${a.completed ? 'completed' : 'timed out'}`),
        `Total files: ${allFiles.length}, Tests: ${allTests.length}`,
        `Engine: openclaw-swarm-v2`,
      ],
      metadata: { agents: agents.map(a => ({ ...a, output: undefined })), engine: "openclaw-swarm-v2", files_count: allFiles.length, tests_count: allTests.length },
      updated_at: new Date().toISOString(),
    })
    .eq("id", buildId);
  
  console.log(`[Builder-v2] Build ${buildId} complete: ${allFiles.length} files, ${allTests.length} tests, status: ${finalStatus}`);
}

// --- GET /:project_id/builds/:build_id --- (status polling)
router.get("/:project_id/builds/:build_id", requireAuth, async (req, res) => {
  const { data: build } = await supabase
    .from("builds")
    .select("*")
    .eq("id", req.params.build_id)
    .eq("project_id", req.params.project_id)
    .single();
  
  if (!build) return res.status(404).json({ error: "Build not found" });
  res.json({ build });
});

// --- POST /build-all --- (v2: spawn all features in parallel)
router.post("/build-all", requireAuth, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id required" });

  try {
    const { data: features } = await supabase
      .from("features")
      .select("id, name")
      .eq("project_id", project_id)
      .order("sort_order");
    
    if (!features?.length) return res.status(400).json({ error: "No features" });

    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    const results = await Promise.allSettled(
      features.map(f =>
        fetch("http://localhost:3001/api/builder-v2/generate-code", {
          method: "POST",
          headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ project_id, feature_id: f.id }),
        }).then(r => r.json())
      )
    );

    const summary = results.map((r, i) => ({
      feature: features[i].name,
      status: r.status === "fulfilled" ? "spawned" : "error",
      agents: r.status === "fulfilled" ? r.value?.agents_spawned : 0,
      build_id: r.status === "fulfilled" ? r.value?.build_id : null,
    }));

    await supabase.from("projects")
      .update({ status: "building", stage: "building" })
      .eq("id", project_id);

    return res.json({ 
      engine: "openclaw-swarm-v2",
      features_started: summary.length,
      summary,
      message: "All build agents spawned. Builds will complete asynchronously.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
