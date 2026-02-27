const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Internal project context fetcher ---
async function getInternalContext() {
  try {
    const res = await fetch("http://localhost:3001/api/platform/context");
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.log("[Builder] Failed to fetch platform context:", e.message);
    return null;
  }
}

// --- Auth middleware (same pattern as foundry.js) ---
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
      const timeout = setTimeout(() => { console.log("[AI] Aborting after 300s"); controller.abort(); }, 300000);
      
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

BRANDING:
- The app name, tagline, and description will be provided in the prompt. Use them throughout the UI.
- The sign-in/sign-up page MUST show the app name as a large heading, with a one-line tagline below it.
- Use a consistent brand color derived from the project context (not generic gray).
- The main layout/nav should show the app name, not "My App" or generic text.
- Every page should feel intentional and branded, not scaffolded.

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

const INTERNAL_CODE_GEN_SYSTEM = `You are a senior full-stack engineer adding a feature to an EXISTING React + Express + Supabase application (dante.id).

CRITICAL: You are NOT building a new app. You are generating NEW files that integrate into an existing codebase.

EXISTING CODEBASE:
- Frontend: React 19 + Vite 7 + Tailwind 3 (JSX, not TSX)
- Backend: Express API on port 3001 (server/*.js files)
- Database: Supabase (tables and RLS already configured)
- Styling: Material You (MD3) design system — see design tokens below
- Auth: Supabase Auth with ProtectedRoute component

DO NOT GENERATE THESE FILES (they already exist):
- index.html, package.json, vite.config.*, tsconfig.json
- tailwind.config.*, postcss.config.*
- src/App.jsx, src/main.jsx, src/index.css
- .env, .env.example, vercel.json
- src/lib/supabase.ts (use existing import patterns)

ONLY GENERATE:
- New components: src/components/YourComponent.jsx
- New pages: src/pages/YourPage.jsx
- New hooks: src/hooks/useYourHook.js
- New contexts: src/contexts/YourContext.jsx
- New API routes: server/your-route.js
- New migrations: supabase/migrations/NNN_your_migration.sql

FILE FORMAT: Use .jsx for components/pages (NOT .tsx). Use .js for server files.

IMPORT PATTERNS (use these exact patterns from the existing codebase):
- Supabase: Use the supabase client from the route's own createClient() call (server-side) or useAuth() context (client-side)
- Auth: import { useAuth } from '../contexts/AuthContext'
- Router: import { useNavigate, useParams, Link } from 'react-router-dom'
- Protected routes: Wrap in <ProtectedRoute> in App.jsx (you won't modify App.jsx — document what route to add)

STYLING: Material You (MD3) design tokens:
- Primary: bg-md-primary (#6750A4), text-md-on-primary
- Surface: bg-md-surface-container (#F3EDF7), bg-md-background (#FFFBFE)
- Cards: bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md
- Buttons: rounded-full bg-md-primary text-md-on-primary px-6 py-2.5
- Inputs: rounded-t-lg rounded-b-none border-b-2 border-md-border bg-md-surface-variant h-14
- Font: font-sans (Roboto)

INTEGRATION NOTES:
- Include a "setup_instructions" field explaining what manual wiring is needed (e.g., "Add route to App.jsx", "Mount router in index.js")
- Reference existing components when possible (don't recreate what exists)
- Max 8 files per feature — focused, minimal additions

Return JSON: {
  "files": [{"path": "relative/path/to/file.ext", "content": "file content", "language": "jsx|js|json|sql"}],
  "summary": "What was generated and how it integrates with the existing codebase",
  "setup_instructions": "Manual steps needed: 1. Add <Route path='/x' element={<X/>}/> to App.jsx  2. Mount router in index.js"
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

    // Fetch project + PRD for context (include type for internal project detection)
    const { data: project } = await supabase
      .from("projects")
      .select("*, type")
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

    const projectName = project?.name || project?.company_name || "App";
    const projectIdea = project?.idea || "";
    const userPrompt = `## App Branding
App Name: ${projectName}
App Description: ${projectIdea}
Use "${projectName}" as the app name on all pages (auth, nav, headings). Make the UI feel branded and polished.

## Feature Details
Feature: ${feature.name}
Description: ${feature.description || ""}
Priority: ${feature.priority || "medium"}
Acceptance Criteria: ${JSON.stringify(feature.acceptance_criteria || [])}

Technical Blueprint:
${JSON.stringify(blueprint.content, null, 2)}
${woContext}

Tech Stack Context: ${typeof techStack === 'string' ? techStack : JSON.stringify(techStack)}
Project: ${project?.company_name || project?.full_name || "Unknown"}

Generate concise, working code for this feature. Focus on core logic, keep files short.`;

    // Inject file manifest of already-built features for cross-feature imports
    let manifestContext = "";
    try {
      const { data: existingBuilds } = await supabase
        .from("builds")
        .select("files, feature_id")
        .eq("project_id", project_id)
        .in("status", ["review", "complete"])
        .neq("feature_id", feature_id);
      if (existingBuilds?.length) {
        const fileList = [];
        for (const b of existingBuilds) {
          for (const f of (b.files || [])) {
            fileList.push(f.path || f.filename);
          }
        }
        if (fileList.length > 0) {
          manifestContext = `\n\n## Already Built Files (available for import)\nThese files already exist from other features. Import them directly — do NOT recreate them:\n${fileList.map(f => `- ${f}`).join("\n")}\n`;
        }
      }
    } catch (_) {}

    let fullPrompt = userPrompt + manifestContext;

    // Inject codebase context for internal projects
    let systemPrompt = CODE_GEN_SYSTEM;
    if (project.type === 'internal') {
      systemPrompt = INTERNAL_CODE_GEN_SYSTEM;
      try {
        const platformCtx = await getInternalContext();
        if (platformCtx) {
          const ctxSummary = `\n\nEXISTING CODEBASE CONTEXT:\n` +
            `Frontend Routes: ${JSON.stringify(platformCtx.frontend_routes || [])}\n` +
            `API Routes: ${JSON.stringify(platformCtx.api_routes || {})}\n` +
            `Database Tables: ${JSON.stringify(platformCtx.database_schema || [])}\n` +
            `Project Files: ${JSON.stringify(platformCtx.project_structure || [])}\n` +
            `Design System: ${JSON.stringify(platformCtx.design_system || {})}\n`;
          fullPrompt += ctxSummary;
        }
      } catch (ctxErr) {
        console.log('[Builder] Context injection failed (non-fatal):', ctxErr.message);
      }
      console.log('[Builder] Using INTERNAL system prompt for project type:', project.type);
    }

    console.log('[Builder] Calling AI for feature:', feature.name, manifestContext ? `(${manifestContext.split('\n').length - 4} existing files)` : '(no prior builds)');
    const result = await callAI(systemPrompt, fullPrompt);
    console.log('[Builder] AI returned, files:', (result.files || []).length, 'keys:', Object.keys(result).join(','));

    let files = result.files || [];

    // Self-validation: resolve broken imports by inlining placeholders
    const generatedPaths = new Set(files.map(f => f.path || f.filename));
    // Also include manifest files
    const allKnownFiles = new Set([...generatedPaths]);
    // Common utility files that always exist in generated projects
    ['src/lib/supabase.ts', 'src/lib/supabase.js', 'lib/supabase.ts', 'lib/supabase.js'].forEach(f => allKnownFiles.add(f));
    if (manifestContext) {
      const manifestLines = manifestContext.match(/- (.+)/g) || [];
      manifestLines.forEach(l => allKnownFiles.add(l.replace('- ', '')));
    }

    let fixedImports = 0;
    for (const file of files) {
      if (!file.content) continue;
      const imports = [...file.content.matchAll(/import\s+(\{[^}]+\}|\w+)\s+from\s+['"]\.\/(.*?)['"]/g)];
      for (const match of imports) {
        const importName = match[1].replace(/[{}]/g, '').trim();
        const importPath = match[2];
        const exists = [importPath, `${importPath}.jsx`, `${importPath}.tsx`, `${importPath}.js`, `${importPath}.ts`,
          `src/${importPath}`, `src/${importPath}.jsx`, `src/${importPath}.tsx`]
          .some(p => allKnownFiles.has(p));
        if (!exists && !importPath.includes('supabase') && !importPath.includes('lib/')) {
          // Inline a placeholder component, remove the import
          const componentName = importName.split(',')[0].trim();
          const stub = `\nfunction ${componentName}(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[${componentName}]</div>; }\n`;
          file.content = file.content.replace(match[0], `// Placeholder: ${componentName} (auto-inlined)`) + stub;
          fixedImports++;
        }
      }
    }
    if (fixedImports > 0) {
      console.log(`[Builder] Self-validation: inlined ${fixedImports} missing imports as placeholders`);
    }

    const logs = [
      { ts: new Date().toISOString(), msg: `Generated ${files.length} files` },
      { ts: new Date().toISOString(), msg: fixedImports > 0 ? `Self-validation: ${fixedImports} phantom imports inlined` : 'All imports resolved' },
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

    // Update feature status to 'built'
    await supabase.from("features").update({ status: "built" }).eq("id", feature_id);

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

    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const token = req.headers.authorization;
    const CONCURRENCY = 3;
    const results = [];

    for (let i = 0; i < features.length; i += CONCURRENCY) {
      const batch = features.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(f =>
          fetch("http://localhost:3001/api/builder/generate-code", {
            method: "POST",
            headers: { Authorization: "Bearer " + serviceKey, "Content-Type": "application/json" },
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

    // Advance status after all builds complete
    await supabase.from("projects").update({ status: "building", stage: "building" }).eq("id", project_id);
    console.log(`[Builder] build-all complete for ${project_id}: ${results.length} features built — auto-advancing to inspector`);

    // Auto-advance to inspector
    const autoToken = process.env.SUPABASE_SERVICE_KEY;
    fetch(`http://localhost:3001/api/inspector/run-all`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + autoToken, "Content-Type": "application/json" },
      body: JSON.stringify({ project_id }),
    }).then(r => console.log(`[Builder→Inspector] Auto-advance: ${r.status}`))
      .catch(err => console.error(`[Builder→Inspector] Auto-advance failed:`, err.message));

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
