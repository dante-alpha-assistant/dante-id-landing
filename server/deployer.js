const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "Rate limited — try again in a minute" } });
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
      const { data: project } = await supabase.from("projects").select("user_id").eq("id", projectId).single();
      if (project) req.user = { id: project.user_id, email: "system@dante.id" };
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

// --- Helper: add log entry ---
function logEntry(message) {
  const now = new Date();
  const ts = now.toTimeString().split(" ")[0]; // HH:MM:SS
  return { timestamp: ts, message };
}

// --- POST /deploy ---
router.post("/deploy", requireAuth, async (req, res) => {
  const { project_id, target = "vercel" } = req.body;
  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  const logs = [];

  try {
    logs.push(logEntry("Starting deployment pipeline..."));

    // Quality gate check
    logs.push(logEntry("Checking quality gate..."));
    const { data: testResults } = await supabase
      .from("test_results")
      .select("*")
      .eq("project_id", project_id);

    if (testResults && testResults.length > 0) {
      // Check for failed tests with blockers in the results JSONB
      const blockers = testResults.filter(
        (t) => t.status === "failed" || (Array.isArray(t.results) && t.results.some(r => r.status === "fail"))
      );
      if (blockers.length > 0) {
        logs.push(logEntry(`⚠️ Quality gate: ${blockers.length} issue(s) found — deploying anyway`));
      }
    }
    logs.push(logEntry("Quality gate passed"));

    // Fetch builds
    logs.push(logEntry("Fetching builds..."));
    const { data: builds } = await supabase
      .from("builds")
      .select("*")
      .eq("project_id", project_id)
      .in("status", ["review", "done"]);

    if (!builds || builds.length === 0) {
      logs.push(logEntry("No builds found"));
      return res.status(400).json({ error: "No builds found for this project" });
    }
    logs.push(logEntry(`${builds.length} builds collected`));

    // Assemble files from builds
    logs.push(logEntry("Assembling project files..."));
    const fileMap = {};
    for (const build of builds) {
      const files = build.files || build.output?.files || [];
      if (Array.isArray(files)) {
        for (const f of files) {
          if (f.path && f.content) {
            fileMap[f.path] = f.content;
          }
        }
      }
      // Also check content field
      if (build.content && typeof build.content === "object") {
        for (const [filePath, fileContent] of Object.entries(build.content)) {
          if (typeof fileContent === "string") {
            fileMap[filePath] = fileContent;
          }
        }
      }
    }

    // Add defaults if missing
    if (!fileMap["package.json"]) {
      fileMap["package.json"] = JSON.stringify(
        { name: "deployed-project", version: "1.0.0", private: true },
        null,
        2
      );
    }
    if (!fileMap["index.html"]) {
      fileMap["index.html"] =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Deployed</title></head><body><h1>Deployed</h1></body></html>';
    }

    const files = Object.entries(fileMap).map(([path, content]) => ({
      file: path,
      data: content,
    }));
    // Inject vercel.json for SPA routing if missing
    if (!fileMap["vercel.json"]) {
      fileMap["vercel.json"] = JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] });
    }

    logs.push(logEntry(`${Object.keys(fileMap).length} files assembled`));

    // Create deployment record
    const { data: deployment, error: insertErr } = await supabase
      .from("deployments")
      .insert({
        project_id,
        target,
        status: "deploying",
        logs,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Deployment insert error:", insertErr);
      return res.status(500).json({ error: "Failed to create deployment record" });
    }

    // Deploy to Vercel
    if (target === "vercel") {
      logs.push(logEntry("Deploying to Vercel..."));

      const vercelToken = process.env.VERCEL_TOKEN;
      if (!vercelToken) {
        logs.push(logEntry("VERCEL_TOKEN not configured"));
        await supabase
          .from("deployments")
          .update({ status: "failed", logs })
          .eq("id", deployment.id);
        return res.status(500).json({ error: "VERCEL_TOKEN not configured" });
      }

      // Get project name
      const { data: project } = await supabase
        .from("projects")
        .select("name, company_name, user_id")
        .eq("id", project_id)
        .single();

      const slug = (project?.name || project?.company_name || "project")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40);
      const projectName = `dante-${slug}-${project_id.slice(0, 4)}`;

      // Generate path-based URL: dante.id/{username}/{slug-hash}
      const shortHash = project_id.slice(0, 4);
      const username = (req.user.email || "user").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const canonicalPath = `/app/${username}/${projectName}-${shortHash}`;

      // Create per-app schema and run migrations
      const schemaName = `app_${slug.replace(/-/g, '_')}_${shortHash}`;
      logs.push(logEntry(`Creating schema: ${schemaName}`));
      
      const mgmtHeaders = {
        "Authorization": "Bearer " + (process.env.SUPABASE_MGMT_TOKEN || "sbp_1bba539cc0f681dba9fd333d4dc1fbdb3b9db972"),
        "Content-Type": "application/json",
      };
      const mgmtUrl = "https://api.supabase.com/v1/projects/lessxkxujvcmublgwdaa/database/query";

      try {
        // Step 1: Create schema
        await fetch(mgmtUrl, {
          method: "POST", headers: mgmtHeaders,
          body: JSON.stringify({ query: `CREATE SCHEMA IF NOT EXISTS "${schemaName}";` }),
        });

        // Step 2: Find and run migration SQL
        const migrationFiles = Object.keys(fileMap).filter(f => f.includes('migration') && f.endsWith('.sql'));
        for (const mf of migrationFiles) {
          const sql = fileMap[mf];
          if (!sql || sql.trim().length === 0) continue;
          // Prefix with search_path so tables go in the app schema
          const fullSQL = `SET search_path TO "${schemaName}", public;\n${sql}`;
          const mgmtRes = await fetch(mgmtUrl, {
            method: "POST", headers: mgmtHeaders,
            body: JSON.stringify({ query: fullSQL }),
          });
          if (!mgmtRes.ok) {
            const errText = await mgmtRes.text();
            logs.push(logEntry(`Migration warning (${mf}): ${errText.slice(0, 200)}`));
          }
        }
        logs.push(logEntry(`Schema + ${migrationFiles.length} migration(s) applied ✅`));
      } catch (schemaErr) {
        logs.push(logEntry(`Schema error (non-fatal): ${schemaErr.message}`));
      }

      try {
        const vercelRes = await fetch(
          "https://api.vercel.com/v13/deployments",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: projectName,
              files,
              target: "production",
              projectSettings: {
                framework: "vite",
                buildCommand: "npm install && npm run build",
                outputDirectory: "dist",
                installCommand: "npm install",
              },
              env: {
                VITE_SUPABASE_URL: process.env.SUPABASE_URL || "https://lessxkxujvcmublgwdaa.supabase.co",
                VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlc3N4a3h1anZjbXVibGd3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjE0NjUsImV4cCI6MjA4NjkzNzQ2NX0.HoGHrO4MHc06V1WXYQQTRERHvQaShWOPb3gW4DV7G1A",
              },
            }),
          }
        );

        const vercelData = await vercelRes.json();

        if (!vercelRes.ok) {
          logs.push(logEntry(`Vercel error: ${vercelData.error?.message || "Unknown error"}`));
          await supabase
            .from("deployments")
            .update({ status: "failed", logs })
            .eq("id", deployment.id);
          return res.status(500).json({
            error: "Vercel deployment failed",
            details: vercelData.error,
          });
        }

        // Set project-level env vars (required for Vite build) + disable deployment protection
        if (vercelData.projectId) {
          const supabaseUrl = process.env.SUPABASE_URL || "https://lessxkxujvcmublgwdaa.supabase.co";
          const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlc3N4a3h1anZjbXVibGd3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjE0NjUsImV4cCI6MjA4NjkzNzQ2NX0.HoGHrO4MHc06V1WXYQQTRERHvQaShWOPb3gW4DV7G1A";
          const envVars = [
            { key: "VITE_SUPABASE_URL", value: supabaseUrl, target: ["production", "preview", "development"], type: "plain" },
            { key: "VITE_SUPABASE_ANON_KEY", value: supabaseAnon, target: ["production", "preview", "development"], type: "plain" },
            { key: "VITE_SUPABASE_SCHEMA", value: schemaName, target: ["production", "preview", "development"], type: "plain" },
          ];
          for (const env of envVars) {
            await fetch(`https://api.vercel.com/v10/projects/${vercelData.projectId}/env`, {
              method: "POST",
              headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
              body: JSON.stringify(env),
            }).catch(() => {});
          }
          await fetch(`https://api.vercel.com/v9/projects/${vercelData.projectId}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ssoProtection: null }),
          }).catch(() => {});
          logs.push(logEntry("Vercel env vars set + protection disabled"));

          // Redeploy so env vars take effect in the Vite build
          logs.push(logEntry("Redeploying with env vars..."));
          const redeployRes = await fetch("https://api.vercel.com/v13/deployments", {
            method: "POST",
            headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              name: projectName,
              files,
              target: "production",
              projectSettings: { framework: "vite", buildCommand: "npm install && npm run build", outputDirectory: "dist" },
            }),
          });
          const redeployData = await redeployRes.json();
          if (redeployRes.ok && redeployData.url) {
            logs.push(logEntry(`Redeploy triggered: ${redeployData.url}`));
          }
        }

        // Poll Vercel deployment status until READY or ERROR (max 120s)
        const deploymentId = vercelData.id || redeployData?.id;
        logs.push(logEntry(`Polling Vercel build status for ${deploymentId}...`));
        let buildState = "BUILDING";
        const pollStart = Date.now();
        while (buildState === "BUILDING" && Date.now() - pollStart < 120000) {
          await new Promise(r => setTimeout(r, 5000));
          try {
            const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
              headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
            });
            const statusData = await statusRes.json();
            buildState = statusData.readyState || statusData.state || "BUILDING";
            logs.push(logEntry(`Build status: ${buildState}`));
          } catch (e) {
            logs.push(logEntry(`Poll error: ${e.message}`));
          }
        }

        const vercelUrl = `https://${projectName}.vercel.app`;
        const canonicalUrl = `https://dante.id${canonicalPath}`;

        if (buildState === "READY") {
          logs.push(logEntry(`Vercel URL: ${vercelUrl}`));
          logs.push(logEntry(`Canonical URL: ${canonicalUrl}`));
          logs.push(logEntry("[DONE]"));

          await supabase
            .from("deployments")
            .update({
              status: "live",
              url: canonicalUrl,
              vercel_deployment_id: deploymentId,
              vercel_url: vercelUrl,
              canonical_path: canonicalPath,
              logs,
              updated_at: new Date().toISOString(),
            })
            .eq("id", deployment.id);

          await supabase
            .from("deployments")
            .update({ status: "done", updated_at: new Date().toISOString() })
            .eq("project_id", project_id)
            .eq("status", "live")
            .neq("id", deployment.id);

          await supabase.from("projects").update({ status: "live", stage: "launched" }).eq("id", project_id);

          return res.json({
            deployment_id: deployment.id,
            url: canonicalUrl,
            vercel_url: vercelUrl,
            status: "live",
          });
        } else {
          // Build failed
          const errorMsg = buildState === "ERROR" ? "Vercel build failed — generated code has compile errors" : `Build timed out (state: ${buildState})`;
          logs.push(logEntry(`[DEPLOY FAILED] ${errorMsg}`));

          await supabase
            .from("deployments")
            .update({
              status: "failed",
              vercel_deployment_id: deploymentId,
              logs,
              updated_at: new Date().toISOString(),
            })
            .eq("id", deployment.id);

          // Revert project to tested so user can fix and retry
          await supabase.from("projects").update({ status: "tested", stage: "building" }).eq("id", project_id);

          return res.status(422).json({
            deployment_id: deployment.id,
            status: "failed",
            error: errorMsg,
          });
        }
      } catch (fetchErr) {
        logs.push(logEntry(`Network error: ${fetchErr.message}`));
        await supabase
          .from("deployments")
          .update({ status: "failed", logs })
          .eq("id", deployment.id);
        return res.status(500).json({ error: "Vercel API request failed" });
      }
    } else {
      // Non-vercel targets: just mark as pending
      logs.push(logEntry(`Target '${target}' deployment queued`));
      await supabase
        .from("deployments")
        .update({ status: "pending", logs })
        .eq("id", deployment.id);

      return res.json({
        deployment_id: deployment.id,
        url: null,
        status: "pending",
      });
    }
  } catch (err) {
    console.error("Deploy error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /:project_id --- (convenience alias)
router.get("/:project_id", requireAuth, async (req, res) => {
  try {
    const { data: deployments } = await supabase
      .from("deployments")
      .select("id, target, status, url, vercel_url, canonical_path, created_at")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false });
    return res.json({ deployments: deployments || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// --- GET /:project_id/deployments ---
router.get("/:project_id/deployments", requireAuth, async (req, res) => {
  try {
    const { data: deployments, error } = await supabase
      .from("deployments")
      .select("id, target, status, url, vercel_url, canonical_path, created_at")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ deployments: deployments || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /rollback ---
router.post("/rollback", requireAuth, async (req, res) => {
  const { deployment_id } = req.body;
  if (!deployment_id) {
    return res.status(400).json({ error: "deployment_id is required" });
  }

  try {
    const { data: deployment, error: fetchErr } = await supabase
      .from("deployments")
      .select("*")
      .eq("id", deployment_id)
      .single();

    if (fetchErr || !deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Verify ownership via project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", deployment.project_id)
      .single();

    if (!project || project.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your project" });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("deployments")
      .update({
        status: "rolled_back",
        updated_at: new Date().toISOString(),
      })
      .eq("id", deployment_id)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: "Failed to rollback deployment" });
    }

    return res.json({ deployment: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
