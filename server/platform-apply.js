const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const REPO_DIR = "/root/.openclaw/workspace/dante-id-landing";

function git(cmd) {
  return execSync("git " + cmd, { cwd: REPO_DIR, encoding: "utf8" }).trim();
}

// --- Auth middleware (same pattern as refinery.js) ---
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
    if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth verification failed" });
  }
}

/**
 * Map a filename from build content to a codebase path
 */
function mapFilePath(filename) {
  if (filename === "package.json") return null; // SKIP

  if (filename.startsWith("server/") && filename.endsWith(".js")) return filename;
  if (filename.startsWith("src/") && filename.endsWith(".jsx")) return filename;
  if (filename.endsWith(".sql")) return `supabase/migrations/${path.basename(filename)}`;
  if (filename.endsWith(".js")) return `server/${path.basename(filename)}`;
  if (filename.endsWith(".jsx")) return `src/components/${path.basename(filename)}`;

  // Default: keep as-is
  return filename;
}

/**
 * Collect all files from builds with status="review" for a project
 */
async function collectFiles(projectId) {
  const { data: builds, error } = await supabase
    .from("builds")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "review");

  if (error) throw new Error("Failed to fetch builds: " + error.message);
  if (!builds || builds.length === 0) throw new Error("No builds with status='review' found");

  const fileMap = {}; // path -> code
  for (const build of builds) {
    const files = build.content?.files;
    if (!files || typeof files !== "object") continue;
    for (const [filename, code] of Object.entries(files)) {
      const mapped = mapFilePath(filename);
      if (!mapped) continue; // skipped
      fileMap[mapped] = code;
    }
  }

  return fileMap;
}

// POST / — Apply internal project builds to codebase
router.post("/", requireAuth, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id is required" });

  let branch;
  try {
    // 1. Verify internal project
    const { data: project, error: projErr } = await supabase
      .from("projects").select("*").eq("id", project_id).single();
    if (projErr || !project) return res.status(404).json({ error: "Project not found" });
    if (project.type !== "internal") return res.status(400).json({ error: "Only internal projects can be applied" });

    // 2-3. Collect files from builds
    const fileMap = await collectFiles(project_id);
    if (Object.keys(fileMap).length === 0) return res.status(400).json({ error: "No files to apply" });

    // 4-5. Create branch
    branch = `internal/${project_id.substring(0, 8)}`;
    git("checkout main");
    git("pull origin main");
    try { git(`branch -D ${branch}`); } catch (e) { /* branch may not exist */ }
    git(`checkout -b ${branch}`);

    // 6. Write files
    const filesWritten = [];
    for (const [filePath, code] of Object.entries(fileMap)) {
      const fullPath = path.join(REPO_DIR, filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, code, "utf8");
      filesWritten.push(filePath);
    }

    // 7. Commit
    git("add -A");
    git(`commit -m "feat(internal): apply ${project.company_name || project.idea?.substring(0, 50) || project_id}"`);

    // 8. Push
    git(`push origin ${branch} --force`);

    // 9. Create PR
    const prBody = `## Files applied\n\n${filesWritten.map(f => "- `" + f + "`").join("\n")}`;
    const prRes = await fetch("https://api.github.com/repos/dante-alpha-assistant/dante-id-landing/pulls", {
      method: "POST",
      headers: {
        "Authorization": `token ${process.env.GH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `feat(internal): ${project.company_name || project.idea?.substring(0, 50) || "internal project"}`,
        body: prBody,
        head: branch,
        base: "main",
      }),
    });
    const prData = await prRes.json();
    const prUrl = prData.html_url || null;

    // Record deployment
    await supabase.from("deployments").insert({
      project_id,
      target: "github-pr",
      url: prUrl,
      status: "live",
      branch,
    });

    // 10. Return
    return res.json({ success: true, branch, pr_url: prUrl, files_written: filesWritten });
  } catch (err) {
    console.error("[platform-apply] Error:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    // 11. Always checkout main
    try { git("checkout main"); } catch (e) { /* best effort */ }
  }
});

// GET /preview/:project_id — Preview what files would be written
router.get("/preview/:project_id", requireAuth, async (req, res) => {
  try {
    const { project_id } = req.params;

    const { data: project } = await supabase
      .from("projects").select("type").eq("id", project_id).single();
    if (!project || project.type !== "internal") {
      return res.status(400).json({ error: "Not an internal project" });
    }

    const fileMap = await collectFiles(project_id);

    const files = Object.entries(fileMap).map(([filePath, code]) => {
      const fullPath = path.join(REPO_DIR, filePath);
      const exists = fs.existsSync(fullPath);
      return {
        path: filePath,
        action: exists ? "overwrite" : "create",
        size: Buffer.byteLength(code, "utf8"),
      };
    });

    return res.json({ files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /status/:project_id — Check if project was already applied
router.get("/status/:project_id", requireAuth, async (req, res) => {
  try {
    const { project_id } = req.params;

    const { data: deployment } = await supabase
      .from("deployments")
      .select("*")
      .eq("project_id", project_id)
      .eq("target", "github-pr")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!deployment) {
      return res.json({ applied: false, branch: null, pr_url: null });
    }

    return res.json({
      applied: true,
      branch: deployment.branch || null,
      pr_url: deployment.url || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
