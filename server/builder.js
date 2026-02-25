const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware (same pattern as foundry.js) ---
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
      const timeout = setTimeout(() => { console.log("[AI] Aborting after 180s"); controller.abort(); }, 180000);
      
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
      
      // Read body as text with a 120s body timeout
      const bodyPromise = res.text();
      const bodyTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Body read timeout after 300s')), 300000));
      const bodyText = await Promise.race([bodyPromise, bodyTimeout]);
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

const CODE_GEN_SYSTEM = `You are a senior full-stack engineer. Generate a WORKING, DEPLOYABLE React + Supabase app based on the technical blueprint.

ARCHITECTURE:
- Frontend: React + Vite + TypeScript → deploys to Vercel as static site
- Backend: Supabase (database, auth, realtime, storage) → NO Express, NO custom server
- All data operations use @supabase/supabase-js client
- Auth via supabase.auth.signUp() / signInWithPassword()

TECH STACK (MANDATORY):
- React 18 + Vite + TypeScript (.tsx for components, .ts for utils)
- @supabase/supabase-js for all backend operations
- Tailwind CSS for styling
- React Router for navigation
- NO Express, NO backend server, NO SQLite, NO native modules

USE THESE EXACT VERSIONS in package.json:
react: "18.2.0", react-dom: "18.2.0", react-router-dom: "6.20.0", @supabase/supabase-js: "2.39.0", @vitejs/plugin-react: "4.2.1", vite: "5.4.0", typescript: "5.3.3", tailwindcss: "3.4.0", postcss: "8.4.32", autoprefixer: "10.4.16", @types/react: "18.2.43", @types/react-dom: "18.2.17"
Put ALL in "dependencies" (NOT devDependencies).

MANDATORY FILES:
1. tsconfig.json: {"compilerOptions":{"target":"ES2020","module":"ESNext","moduleResolution":"bundler","jsx":"react-jsx","strict":false,"skipLibCheck":true,"esModuleInterop":true,"allowSyntheticDefaultImports":true,"resolveJsonModule":true,"isolatedModules":true,"noEmit":true},"include":["src"]}
2. vite.config.ts: standard Vite + React config
3. index.html with root div + module script src="/src/main.tsx"
4. package.json with scripts: "dev": "vite", "build": "vite build", "preview": "vite preview"
5. src/lib/supabase.ts: Initialize Supabase client using import.meta.env.VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
6. src/main.tsx: React entry point
7. tailwind.config.js + postcss.config.js
8. supabase/migration.sql: DO NOT include CREATE SCHEMA — the platform handles that. Just CREATE TABLE statements (no schema prefix), Row Level Security policies, and indexes. Use UUID primary keys with gen_random_uuid(). Include RLS: ALTER TABLE x ENABLE ROW LEVEL SECURITY; CREATE POLICY ... USING (auth.uid() = user_id).
9. .env.example: VITE_SUPABASE_URL=your-project-url, VITE_SUPABASE_ANON_KEY=your-anon-key, VITE_SUPABASE_SCHEMA=app_myproject
10. vercel.json: {"rewrites":[{"source":"/(.*)", "destination":"/index.html"}]}
11. src/lib/supabase.ts MUST use: createClient(url, key, { db: { schema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public' } })

DATA OPERATIONS (use Supabase client, NOT fetch):
- Read: supabase.from('table').select('*').eq('user_id', user.id)
- Create: supabase.from('table').insert({...}).select().single()
- Update: supabase.from('table').update({...}).eq('id', id)
- Delete: supabase.from('table').delete().eq('id', id)
- Auth: supabase.auth.signUp/signInWithPassword/signOut/getUser

CRITICAL RULES:
- Every import MUST resolve to a file you create. No phantom imports.
- Use \`any\` type freely. No complex type hierarchies.
- The code MUST pass \`vite build\` without errors.
- Implement real UI with forms, lists, modals, state management — not placeholders.
- All CRUD: create, read, update, AND delete via Supabase.
- Max 12 files per feature.

Return JSON: {
  "files": [{"path": "relative/path/to/file.ext", "content": "file content", "language": "tsx|ts|json|html|css|js|sql"}],
  "summary": "What was generated and key decisions made",
  "setup_instructions": "npm install && npm run dev (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env)"
}`;

// --- POST /generate-code ---
router.post("/generate-code", requireAuth, async (req, res) => {
  const { feature_id, project_id, work_order_id } = req.body;
  if (!feature_id || !project_id) {
    return res.status(400).json({ error: "feature_id and project_id are required" });
  }

  try {
    // Fetch feature
    const { data: feature, error: featError } = await supabase
      .from("features")
      .select("*")
      .eq("id", feature_id)
      .single();

    if (featError || !feature) {
      return res.status(404).json({ error: "Feature not found" });
    }

    // Fetch blueprint
    const { data: blueprint, error: bpError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("feature_id", feature_id)
      .single();

    if (bpError || !blueprint) {
      return res.status(404).json({ error: "Blueprint not found. Generate a blueprint in Foundry first." });
    }

    // Fetch project + PRD for context
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    const { data: prd } = await supabase
      .from("prds")
      .select("content")
      .eq("project_id", project_id)
      .single();

    // Upsert build record as 'generating'
    const { data: existingBuild } = await supabase
      .from("builds")
      .select("id")
      .eq("feature_id", feature_id)
      .eq("project_id", project_id)
      .single();

    let buildId;
    if (existingBuild) {
      buildId = existingBuild.id;
      await supabase
        .from("builds")
        .update({ status: "generating", files: [], logs: [], updated_at: new Date().toISOString() })
        .eq("id", buildId);
    } else {
      const { data: newBuild } = await supabase
        .from("builds")
        .insert({ project_id, feature_id, status: "generating", files: [], logs: [] })
        .select()
        .single();
      buildId = newBuild.id;
    }

    // Fetch work orders for this feature (if any)
    let workOrders = [];
    if (work_order_id) {
      const { data: wo } = await supabase.from("work_orders").select("*").eq("id", work_order_id).single();
      if (wo) workOrders = [wo];
    } else {
      const { data: wos } = await supabase.from("work_orders").select("*").eq("feature_id", feature_id).eq("project_id", project_id).order("phase");
      workOrders = wos || [];
    }

    // Build user prompt
    const techStack = prd?.content?.tech_stack || project?.tech_stack || "React + Node.js";
    const woContext = workOrders.length > 0
      ? `\n\n## Work Orders (Implementation Plan)\n${workOrders.map(wo => `### ${wo.title} (Phase ${wo.phase}, ${wo.priority})
${wo.description || ""}
Files to create: ${JSON.stringify(wo.files_to_create || [])}
Files to modify: ${JSON.stringify(wo.files_to_modify || [])}
Acceptance criteria: ${JSON.stringify(wo.acceptance_criteria || [])}`).join("\n\n")}`
      : "";

    const userPrompt = `Feature: ${feature.name}
Description: ${feature.description || ""}
Priority: ${feature.priority || "medium"}
Acceptance Criteria: ${JSON.stringify(feature.acceptance_criteria || [])}

Technical Blueprint:
${JSON.stringify(blueprint.content, null, 2)}
${woContext}

Tech Stack Context: ${typeof techStack === 'string' ? techStack : JSON.stringify(techStack)}
Project: ${project?.company_name || project?.full_name || "Unknown"}

Generate concise, working code for this feature. Focus on core logic, keep files short.`;

    console.log('[Builder] Calling AI for feature:', feature.name);
    const result = await callAI(CODE_GEN_SYSTEM, userPrompt);
    console.log('[Builder] AI returned, files:', (result.files || []).length, 'keys:', Object.keys(result).join(','));

    const files = result.files || [];
    const logs = [
      { ts: new Date().toISOString(), msg: `Generated ${files.length} files` },
      { ts: new Date().toISOString(), msg: `Summary: ${result.summary || ""}` }
    ];

    // Update build
    console.log('[Builder] Saving', files.length, 'files to build', buildId);
    const { data: build, error: updateErr } = await supabase
      .from("builds")
      .update({
        status: "review",
        files,
        logs,
        updated_at: new Date().toISOString()
      })
      .eq("id", buildId)
      .select()
      .single();
    if (updateErr) console.error('[Builder] DB update error:', updateErr.message || updateErr);

    // Update project status
    await supabase.from("projects").update({ status: "building", stage: "building" }).eq("id", project_id);

    return res.json({ build: { ...build, summary: result.summary, setup_instructions: result.setup_instructions } });
  } catch (err) {
    console.error("Generate code error:", err.message);
    // Try to mark build as failed
    if (req.body.feature_id) {
      await supabase
        .from("builds")
        .update({ status: "failed", logs: [{ ts: new Date().toISOString(), msg: err.message }], updated_at: new Date().toISOString() })
        .eq("feature_id", req.body.feature_id)
        .eq("project_id", req.body.project_id);
    }
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /build-all ---
router.post("/build-all", requireAuth, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id is required" });

  try {
    const { data: features } = await supabase.from("features").select("id, name").eq("project_id", project_id).order("sort_order");
    if (!features?.length) return res.status(400).json({ error: "No features found" });

    const token = req.headers.authorization;
    const CONCURRENCY = 3;
    const results = [];

    for (let i = 0; i < features.length; i += CONCURRENCY) {
      const batch = features.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(f =>
          fetch("http://localhost:3001/api/builder/generate-code", {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({ project_id, feature_id: f.id }),
          }).then(r => r.json())
        )
      );
      results.push(...batchResults.map((r, j) => ({
        feature: batch[j].name,
        status: r.status === "fulfilled" ? "ok" : "error",
        files: r.status === "fulfilled" ? (r.value?.build?.files?.length || 0) : 0,
      })));
    }

    return res.json({ built: results.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/builds ---
router.get("/:project_id/builds", requireAuth, async (req, res) => {
  try {
    const { data: builds } = await supabase
      .from("builds")
      .select("id, feature_id, status, files, created_at, features(name)")
      .eq("project_id", req.params.project_id)
      .order("created_at");

    const result = (builds || []).map(b => ({
      build_id: b.id,
      feature_id: b.feature_id,
      feature_name: b.features?.name || "Unknown",
      status: b.status,
      file_count: Array.isArray(b.files) ? b.files.length : 0,
      created_at: b.created_at
    }));

    return res.json({ builds: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id/builds/:feature_id ---
router.get("/:project_id/builds/:feature_id", requireAuth, async (req, res) => {
  try {
    const { data: build } = await supabase
      .from("builds")
      .select("*")
      .eq("project_id", req.params.project_id)
      .eq("feature_id", req.params.feature_id)
      .single();

    return res.json({ build: build || null });
  } catch (err) {
    return res.json({ build: null });
  }
});

// --- POST /create-repo ---
router.post("/create-repo", requireAuth, async (req, res) => {
  const { project_id, repo_name, description } = req.body;
  if (!project_id || !repo_name) {
    return res.status(400).json({ error: "project_id and repo_name are required" });
  }

  // Try user's GitHub token first, fall back to service token
  const { getUserGitHubToken } = require("./github-auth");
  const userGh = await getUserGitHubToken(req.user.id);
  const githubToken = userGh?.token || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const githubUser = userGh?.username || "dante-alpha-assistant";
  if (!githubToken) {
    return res.status(500).json({ error: "GitHub not connected. Connect your GitHub account first." });
  }

  try {
    // Fetch all builds for project
    const { data: builds } = await supabase
      .from("builds")
      .select("*")
      .eq("project_id", project_id)
      .in("status", ["review", "done"]);

    if (!builds || builds.length === 0) {
      return res.status(400).json({ error: "No builds ready for deployment" });
    }

    // Assemble file tree (later files overwrite earlier ones at same path)
    const fileTree = {};
    for (const build of builds) {
      for (const file of (build.files || [])) {
        fileTree[file.path] = file.content;
      }
    }

    const org = githubUser;

    // 1. Create repo (user account, not org)
    const createRes = await fetch(`https://api.github.com/user/repos`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        name: repo_name,
        description: description || "",
        private: false,
        auto_init: false
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      // If already exists, continue
      if (err.errors?.[0]?.message !== "name already exists on this account") {
        return res.status(500).json({ error: `GitHub repo creation failed: ${err.message || JSON.stringify(err)}` });
      }
    }

    // 2. Create blobs, tree, and commit via GitHub API
    const filePaths = Object.keys(fileTree);

    // Create blobs for each file
    const treeItems = [];
    for (const filePath of filePaths) {
      const blobRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/blobs`, {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          content: fileTree[filePath],
          encoding: "utf-8"
        })
      });
      const blob = await blobRes.json();
      treeItems.push({
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blob.sha
      });
    }

    // Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ tree: treeItems })
    });
    const tree = await treeRes.json();

    // Create commit
    const commitRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `Initial commit: ${filePaths.length} files from dante.id Builder`,
        tree: tree.sha
      })
    });
    const commit = await commitRes.json();

    // Create/update main branch ref
    const refRes = await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        ref: "refs/heads/main",
        sha: commit.sha
      })
    });

    if (!refRes.ok) {
      // Branch might exist, try update
      await fetch(`https://api.github.com/repos/${org}/${repo_name}/git/refs/heads/main`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({ sha: commit.sha, force: true })
      });
    }

    const repoUrl = `https://github.com/${org}/${repo_name}`;

    // Update all builds with github_url
    for (const build of builds) {
      await supabase
        .from("builds")
        .update({ github_url: repoUrl, status: "done", updated_at: new Date().toISOString() })
        .eq("id", build.id);
    }

    return res.json({ repo_url: repoUrl, files_committed: filePaths.length });
  } catch (err) {
    console.error("Create repo error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
