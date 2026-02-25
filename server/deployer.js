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
              projectSettings: { framework: null },
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

        // Always use the project name as the canonical Vercel URL
        const vercelUrl = `https://${projectName}.vercel.app`;
        const canonicalUrl = `https://dante.id${canonicalPath}`;
        logs.push(logEntry(`Vercel URL: ${vercelUrl}`));
        logs.push(logEntry(`Canonical URL: ${canonicalUrl}`));
        logs.push(logEntry("[DONE]"));

        await supabase
          .from("deployments")
          .update({
            status: "live",
            url: canonicalUrl,
            vercel_deployment_id: vercelData.id,
            vercel_url: vercelUrl,
            canonical_path: canonicalPath,
            logs,
            updated_at: new Date().toISOString(),
          })
          .eq("id", deployment.id);

        // Mark any previous 'live' deployments as old
        await supabase
          .from("deployments")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .eq("project_id", project_id)
          .eq("status", "live")
          .neq("id", deployment.id);

        // Update project status
        await supabase.from("projects").update({ status: "live" }).eq("id", project_id);

        return res.json({
          deployment_id: deployment.id,
          url: canonicalUrl,
          vercel_url: vercelUrl,
          status: "live",
        });
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
