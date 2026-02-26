const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- GET /api/platform/context --- Self-describing endpoint for dante.id
router.get("/", async (req, res) => {
  try {
    const context = {
      platform: "dante.id",
      description: "AI-native software factory. From idea to deployed production software.",
      version: "1.0",
      generated_at: new Date().toISOString(),

      tech_stack: {
        backend: {
          runtime: "Node.js",
          framework: "Express",
          language: "JavaScript (CommonJS)",
          port: 3001,
          entry: "server/index.js"
        },
        frontend: {
          framework: "React 19",
          bundler: "Vite 7",
          styling: "Tailwind CSS 3",
          router: "React Router 7 (SPA)",
          entry: "src/App.jsx"
        },
        database: {
          provider: "Supabase (PostgreSQL)",
          project_ref: "lessxkxujvcmublgwdaa",
          auth: "Supabase Auth (JWT)"
        },
        deployment: {
          frontend: "Vercel (auto-deploy on push)",
          backend: "systemd (dante-id-api) on DigitalOcean VPS",
          domain: "dante.id",
          api_domain: "api.dante.id"
        },
        ai: {
          provider: "OpenRouter",
          model: "Claude Sonnet 4.6",
          usage: "PRD generation, feature extraction, blueprints, code gen, QA"
        }
      },

      api_routes: {
        auth: [
          { method: "POST", path: "/api/auth/signup", description: "Create account", auth: false },
          { method: "POST", path: "/api/auth/login", description: "Get JWT token", auth: false },
          { method: "GET", path: "/api/auth/github/status", description: "Check GitHub OAuth connection", auth: true },
          { method: "GET", path: "/api/auth/github/connect", description: "Get GitHub OAuth URL", auth: true },
          { method: "DELETE", path: "/api/auth/github/disconnect", description: "Remove GitHub connection", auth: true }
        ],
        projects: [
          { method: "POST", path: "/api/onboarding/start", description: "Create new project from idea", auth: true },
          { method: "GET", path: "/api/projects", description: "List all user projects", auth: true },
          { method: "GET", path: "/api/projects/:id", description: "Get single project with features", auth: true },
          { method: "POST", path: "/api/projects", description: "Create project (raw)", auth: true },
          { method: "DELETE", path: "/api/projects/:id", description: "Delete project + cascade", auth: true },
          { method: "GET", path: "/api/projects/:id/features", description: "Get project features", auth: true },
          { method: "GET", path: "/api/projects/:id/usage", description: "Get AI usage stats for project", auth: true },
          { method: "POST", path: "/api/projects/:id/resume", description: "Advance to next pipeline step", auth: true },
          { method: "GET", path: "/api/projects/:id/pipeline-steps", description: "Get pipeline step history", auth: true },
          { method: "POST", path: "/api/projects/:id/retry-step", description: "Retry a failed pipeline step", auth: true }
        ],
        refinery: [
          { method: "POST", path: "/api/refinery/generate-prd", description: "Generate PRD from project idea (~40s)", auth: true },
          { method: "GET", path: "/api/refinery/:project_id/prd", description: "Get generated PRD", auth: true },
          { method: "PUT", path: "/api/refinery/:project_id/prd", description: "Update PRD manually", auth: true },
          { method: "POST", path: "/api/refinery/refine", description: "AI refine PRD with feedback", auth: true },
          { method: "POST", path: "/api/refinery/extract-features", description: "Extract features from PRD (~19s)", auth: true },
          { method: "GET", path: "/api/refinery/:project_id/features", description: "Get extracted features", auth: true },
          { method: "PUT", path: "/api/refinery/:project_id/features", description: "Update features manually", auth: true }
        ],
        foundry: [
          { method: "POST", path: "/api/foundry/generate-foundation", description: "Generate project-wide architecture doc (~30s)", auth: true },
          { method: "POST", path: "/api/foundry/generate-system-diagrams", description: "Generate ERD + architecture diagrams (~30s)", auth: true },
          { method: "POST", path: "/api/foundry/generate-blueprint", description: "Generate blueprint for one feature (~65s)", auth: true },
          { method: "GET", path: "/api/foundry/:project_id/documents", description: "Get foundation + diagram docs", auth: true },
          { method: "GET", path: "/api/foundry/:project_id/blueprints", description: "Get all feature blueprints", auth: true },
          { method: "GET", path: "/api/foundry/:project_id/blueprints/:feature_id", description: "Get single blueprint", auth: true },
          { method: "POST", path: "/api/foundry/refine-blueprint", description: "AI refine blueprint with feedback", auth: true }
        ],
        planner: [
          { method: "POST", path: "/api/planner/generate-work-orders", description: "Generate work orders for one feature", auth: true },
          { method: "POST", path: "/api/planner/generate-all-work-orders", description: "Generate work orders for all features (~33s)", auth: true },
          { method: "GET", path: "/api/planner/:project_id/work-orders", description: "Get all work orders", auth: true },
          { method: "PATCH", path: "/api/planner/work-orders/:id/status", description: "Update work order status", auth: true }
        ],
        builder: [
          { method: "POST", path: "/api/builder/generate-code", description: "Generate code for feature (~90s)", auth: true },
          { method: "GET", path: "/api/builder/:project_id/builds", description: "Get all builds", auth: true },
          { method: "GET", path: "/api/builder/:project_id/builds/:feature_id", description: "Get feature build with files", auth: true },
          { method: "POST", path: "/api/builder/create-repo", description: "Create GitHub repo + commit code", auth: true }
        ],
        inspector: [
          { method: "POST", path: "/api/inspector/run-tests", description: "AI QA review of feature code (~30s)", auth: true },
          { method: "GET", path: "/api/inspector/:project_id/results", description: "Get all test results", auth: true },
          { method: "GET", path: "/api/inspector/:project_id/results/:feature_id", description: "Get feature test results", auth: true },
          { method: "POST", path: "/api/inspector/fix-suggestion", description: "Get AI fix suggestion for issue", auth: true }
        ],
        deployer: [
          { method: "POST", path: "/api/deployer/deploy", description: "Deploy to Vercel production", auth: true },
          { method: "GET", path: "/api/deployer/:project_id/deployments", description: "Get deployment history", auth: true },
          { method: "POST", path: "/api/deployer/rollback", description: "Rollback deployment", auth: true }
        ],
        github: [
          { method: "GET", path: "/api/github/repos", description: "List user GitHub repos with QA enabled flag", auth: true },
          { method: "POST", path: "/api/github/repos/:repo_id/enable", description: "Enable QA pipeline + register webhook", auth: true },
          { method: "POST", path: "/api/github/repos/:repo_id/disable", description: "Disable QA + remove webhook", auth: true }
        ],
        fleet: [
          { method: "GET", path: "/api/fleet/agents", description: "List all agents", auth: false },
          { method: "GET", path: "/api/fleet/agents/:id", description: "Get single agent", auth: false },
          { method: "GET", path: "/api/fleet/agents/:id/status", description: "Check agent online status", auth: false },
          { method: "GET", path: "/api/fleet/agents/:id/memory", description: "Read agent MEMORY.md + SOUL.md", auth: false },
          { method: "PUT", path: "/api/fleet/agents/:id/memory", description: "Write agent memory files", auth: false },
          { method: "GET", path: "/api/fleet/agents/:id/cron", description: "List agent cron jobs", auth: false },
          { method: "POST", path: "/api/fleet/agents/:id/cron", description: "Add cron job to agent", auth: false }
        ],
        utility: [
          { method: "GET", path: "/api/health", description: "Health check", auth: false },
          { method: "GET", path: "/api/docs", description: "API documentation (markdown)", auth: false },
          { method: "GET", path: "/api/platform/context", description: "Platform self-description (this endpoint)", auth: false }
        ]
      },

      frontend_routes: [
        { path: "/", component: "Landing", auth: false },
        { path: "/login", component: "Login", auth: false },
        { path: "/signup", component: "Signup", auth: false },
        { path: "/onboarding", component: "Onboarding", auth: true },
        { path: "/dashboard", component: "ProjectList", auth: true },
        { path: "/dashboard/:project_id", component: "Dashboard", auth: true },
        { path: "/editor/:project_id", component: "Editor", auth: true },
        { path: "/refinery/:project_id", component: "Refinery", auth: true },
        { path: "/foundry/:project_id", component: "Foundry", auth: true },
        { path: "/planner/:project_id", component: "Planner", auth: true },
        { path: "/builder/:project_id", component: "Builder", auth: true },
        { path: "/inspector/:project_id", component: "Inspector", auth: true },
        { path: "/deployer/:project_id", component: "Deployer", auth: true },
        { path: "/validator/:project_id", component: "Validator", auth: true },
        { path: "/iterate/:project_id", component: "Iterate", auth: true },
        { path: "/usage/:project_id", component: "Usage", auth: true },
        { path: "/github/repos", component: "RepoSelector", auth: true }
      ],

      pipeline: {
        description: "6-step software factory pipeline",
        steps: [
          { order: 1, name: "Refinery", module: "refinery", status_value: "refining", description: "Idea → PRD → Features" },
          { order: 2, name: "Foundry", module: "foundry", status_value: "designed", description: "Features → Architecture → Blueprints" },
          { order: 3, name: "Planner", module: "planner", status_value: "planning", description: "Blueprints → Work Orders" },
          { order: 4, name: "Builder", module: "builder", status_value: "building", description: "Work Orders → Code" },
          { order: 5, name: "Inspector", module: "inspector", status_value: "tested", description: "Code → Test Results" },
          { order: 6, name: "Deployer", module: "deployer", status_value: "live", description: "Code → Production" }
        ]
      },

      design_system: {
        theme: "Terminal CLI aesthetic",
        colors: {
          background: "#0a0a0a",
          primary: "#33ff00",
          font: "JetBrains Mono",
          border_radius: "0px",
          button_style: "bracket buttons"
        },
        palette: "zinc/indigo"
      }
    };

    // Dynamically fetch database schema from Supabase
    try {
      const { data: tables } = await supabase.rpc("get_table_info").catch(() => ({ data: null }));
      if (!tables) {
        // Fallback: query information_schema directly
        const { data: columns } = await supabase
          .from("information_schema.columns")
          .select("table_name, column_name, data_type, is_nullable, column_default")
          .eq("table_schema", "public")
          .order("table_name")
          .order("ordinal_position");

        if (columns && columns.length > 0) {
          const schema = {};
          columns.forEach(col => {
            if (!schema[col.table_name]) schema[col.table_name] = [];
            schema[col.table_name].push({
              column: col.column_name,
              type: col.data_type,
              nullable: col.is_nullable === "YES",
              default: col.column_default
            });
          });
          context.database_schema = schema;
        }
      }
    } catch (dbErr) {
      // If dynamic schema fails, use static list from migrations
      context.database_schema = {
        _note: "Dynamic schema query failed. Static list from migrations:",
        tables: [
          "projects", "deliverables", "waitlist", "analytics_events",
          "custom_domains", "chat_messages", "subscriptions",
          "connected_repos", "webhook_events", "github_connections",
          "prds", "features", "blueprints", "builds", "test_results",
          "deployments", "pipeline_steps", "ai_usage_logs"
        ]
      };
    }

    // Try to get dynamic schema via Supabase Management API
    if (!context.database_schema || context.database_schema._note) {
      try {
        const mgmtToken = process.env.SUPABASE_MGMT_TOKEN || "sbp_1bba539cc0f681dba9fd333d4dc1fbdb3b9db972";
        const schemaRes = await fetch(
          `https://api.supabase.com/v1/projects/lessxkxujvcmublgwdaa/database/query`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${mgmtToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              query: `SELECT table_name, column_name, data_type, is_nullable, column_default
                      FROM information_schema.columns
                      WHERE table_schema = 'public'
                      ORDER BY table_name, ordinal_position`
            })
          }
        );
        const schemaData = await schemaRes.json();
        if (Array.isArray(schemaData) && schemaData.length > 0) {
          const schema = {};
          schemaData.forEach(col => {
            if (!schema[col.table_name]) schema[col.table_name] = [];
            schema[col.table_name].push({
              column: col.column_name,
              type: col.data_type,
              nullable: col.is_nullable === "YES",
              default: col.column_default
            });
          });
          context.database_schema = schema;
        }
      } catch (mgmtErr) {
        console.error("[platform-context] Management API schema query failed:", mgmtErr.message);
      }
    }

    // Project structure
    context.project_structure = {
      "server/": "Express API (index.js + module files)",
      "server/refinery.js": "Module 1: PRD generation + feature extraction",
      "server/foundry.js": "Module 2: Architecture + blueprints",
      "server/planner.js": "Module 3: Work order generation",
      "server/builder.js": "Module 4: Code generation + GitHub repo",
      "server/inspector.js": "Module 5: AI QA + test results",
      "server/deployer.js": "Module 6: Vercel deployment",
      "server/github-auth.js": "GitHub OAuth flow",
      "server/github-repos.js": "GitHub repo listing + QA toggle",
      "server/webhook.js": "GitHub webhook handler",
      "server/admin.js": "Admin dashboard API",
      "server/platform-context.js": "This endpoint (self-description)",
      "src/": "React frontend (SPA)",
      "src/App.jsx": "Main router + page imports",
      "src/pages/": "Page components (Dashboard, Refinery, Foundry, etc.)",
      "src/components/": "Shared components",
      "src/lib/": "API client, Supabase client, utilities",
      "supabase/migrations/": "Database schema (001-009)",
      "public/": "Static assets + docs.md"
    };

    res.json(context);
  } catch (err) {
    console.error("[platform-context] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
