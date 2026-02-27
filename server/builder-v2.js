const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Builder worker: Mu's OpenClaw instance (dedicated build plane)
// Override with OPENCLAW_BUILDER_URL/TOKEN for different workers
const OPENCLAW_URL = process.env.OPENCLAW_BUILDER_URL || process.env.OPENCLAW_URL || "http://165.22.180.183:18789";
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
async function openclawInvoke(tool, args) {
  const res = await fetch(`${OPENCLAW_URL}/tools/invoke`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENCLAW_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, args }),
  });
  return res.json();
}

// --- Spawn a Codex agent for a work order ---
async function spawnBuildAgent(projectId, featureId, workOrder, blueprint, platformContext) {
  const task = buildAgentTask(workOrder, blueprint, platformContext);
  
  const result = await openclawInvoke("sessions_spawn", {
    task,
    label: `build-${(workOrder?.id || 'main').slice(0, 50)}`,
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

    // Always create a new build record (history preserved)
    const { data: newBuild } = await supabase
      .from("builds")
      .insert({ project_id, feature_id, status: "generating", files: [], logs: ["Spawning OpenClaw agents..."] })
      .select().single();
    const buildId = newBuild.id;

    // Spawn agents — one per work order, or one for the whole feature
    const agents = [];
    if (workOrders?.length > 0) {
      const spawnPromises = workOrders.map(wo => 
        spawnBuildAgent(project_id, feature_id, wo, blueprint, platformContext)
      );
      const results = await Promise.allSettled(spawnPromises);
      results.forEach((r, i) => {
        const details = r.status === 'fulfilled' ? r.value?.result?.details : null;
        agents.push({
          workOrder: workOrders[i].title,
          status: r.status,
          sessionKey: details?.childSessionKey || null,
          runId: details?.runId || null,
          error: r.status === 'rejected' ? r.reason?.message : (r.value?.ok === false ? r.value?.error?.message : null),
        });
      });
    } else {
      const result = await spawnBuildAgent(project_id, feature_id, null, blueprint, platformContext);
      const details = result?.result?.details;
      agents.push({
        workOrder: feature.name,
        status: result?.ok ? 'fulfilled' : 'rejected',
        sessionKey: details?.childSessionKey || null,
        runId: details?.runId || null,
        error: result?.ok === false ? result?.error?.message : null,
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
  const MAX_POLLS = 120;  // 10 minutes max
  const POLL_INTERVAL = 5000;
  
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    
    let allDone = true;
    
    for (const agent of agents) {
      if (!agent.sessionKey || agent.completed) continue;
      
      try {
        const historyRes = await openclawInvoke("sessions_history", {
          sessionKey: agent.sessionKey,
          limit: 20,
          includeTools: true,
        });
        
        // /tools/invoke wraps result in { ok, result: { details } }
        const msgs = historyRes?.result?.details?.messages || historyRes?.messages || [];
        if (msgs.length > 0) {
          // Extract files from write tool calls
          const toolFiles = [];
          for (const msg of msgs) {
            const content = Array.isArray(msg.content) ? msg.content : [];
            for (const c of content) {
              if (c.type === 'toolCall' && (c.name === 'write' || c.name === 'Write')) {
                const args = c.arguments || {};
                const path = args.path || args.file_path || '';
                const fileContent = args.content || '';
                if (path && fileContent && path.includes('/') && !path.startsWith(',')) {
                  // Strip workspace prefix
                  const cleanPath = path.replace(/^\/root\/\.openclaw\/workspace\//, '');
                  toolFiles.push({ path: cleanPath, content: fileContent });
                }
              }
            }
          }
          
          // Check if agent is done (last msg from assistant without pending tool calls)
          const lastMsg = msgs[msgs.length - 1];
          const hasToolCalls = Array.isArray(lastMsg?.content) && 
            lastMsg.content.some(c => c.type === 'toolCall');
          const hasAssistantText = lastMsg?.role === 'assistant' && !hasToolCalls;
          
          if (hasAssistantText || (msgs.length >= 3 && toolFiles.length > 0)) {
            agent.completed = true;
            agent.toolFiles = toolFiles;
            const textContent = Array.isArray(lastMsg?.content) ? 
              lastMsg.content.find?.(c => c.type === 'text')?.text : 
              (typeof lastMsg?.content === 'string' ? lastMsg.content : '');
            agent.output = textContent || '';
            console.log(`[Builder-v2] Agent "${agent.workOrder}" completed: ${toolFiles.length} files from tool calls`);
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
    // Extract files from tool call write operations (primary method)
    if (agent.toolFiles?.length > 0) {
      for (const f of agent.toolFiles) {
        const isTest = /test|spec/i.test(f.path);
        (isTest ? allTests : allFiles).push(f);
      }
    }
    
    // Also try extracting from text output (fallback)
    if (agent.output) {
      try {
        const jsonMatch = agent.output.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.files) allFiles.push(...parsed.files);
          if (parsed.tests) allTests.push(...parsed.tests);
          continue;
        }
      } catch (e) { /* JSON parse failed */ }

      const codeBlockRegex = /```(\w+)?[\s]*(?:\/\/\s*)?([^\n]*?\.\w+)\n([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(agent.output)) !== null) {
        const path = match[2].trim().replace(/^\/\/\s*/, '').replace(/^#\s*/, '');
        const content = match[3];
        if (path && content && (path.includes('/') || path.includes('.'))) {
          const isTest = /test|spec/i.test(path);
          (isTest ? allTests : allFiles).push({ path, content });
        }
      }
    }
    
    if (!agent.toolFiles?.length && !agent.output) {
      console.log(`[Builder-v2] Agent "${agent.workOrder}": no output or files`);
    }
  }
  
  const completedCount = agents.filter(a => a.completed).length;
  const finalStatus = allFiles.length > 0 ? "done" : completedCount > 0 ? "partial" : "failed";
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
