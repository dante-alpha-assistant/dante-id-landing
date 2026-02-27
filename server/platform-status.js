const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware ---
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (token === process.env.SUPABASE_SERVICE_KEY) {
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

// GET /api/platform/status — Dashboard of all internal projects
router.get("/", requireAuth, async (req, res) => {
  try {
    // Get all internal projects
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, name, company_name, idea, status, type, internal_applied_at, internal_pr_url, created_at")
      .eq("type", "internal")
      .order("created_at", { ascending: false });

    if (projErr) throw projErr;

    const projectIds = (projects || []).map(p => p.id);
    
    // Get latest builds for these projects
    const { data: builds } = await supabase
      .from("builds")
      .select("project_id, status, feature_id, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    // Get latest deployments
    const { data: deployments } = await supabase
      .from("deployments")
      .select("project_id, status, url, branch, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    // Get inspector results
    const { data: inspectorResults } = await supabase
      .from("test_results")
      .select("project_id, status, results, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    // Build status map per project
    const buildMap = {};
    (builds || []).forEach(b => {
      if (!buildMap[b.project_id]) buildMap[b.project_id] = b;
    });

    const deployMap = {};
    (deployments || []).forEach(d => {
      if (!deployMap[d.project_id]) deployMap[d.project_id] = d;
    });

    const inspectorMap = {};
    (inspectorResults || []).forEach(i => {
      if (!inspectorMap[i.project_id]) inspectorMap[i.project_id] = i;
    });

    // Format response
    const status = (projects || []).map(p => {
      const build = buildMap[p.id];
      const deploy = deployMap[p.id];
      const inspector = inspectorMap[p.id];

      return {
        id: p.id,
        name: p.name || p.company_name || p.idea?.substring(0, 50),
        idea: p.idea,
        pipeline_stage: p.status,
        created_at: p.created_at,
        build: build ? {
          status: build.status,
          feature_id: build.feature_id,
          last_update: build.created_at
        } : null,
        inspector: inspector ? {
          status: inspector.status,
          issues: inspector.results?.length || 0,
          last_update: inspector.created_at
        } : null,
        deploy: deploy ? {
          status: deploy.status,
          pr_url: deploy.url,
          branch: deploy.branch,
          last_update: deploy.created_at
        } : null,
        platform_apply: p.internal_applied_at ? {
          applied_at: p.internal_applied_at,
          pr_url: p.internal_pr_url
        } : null
      };
    });

    // Summary stats
    const stats = {
      total: status.length,
      by_stage: {},
      applied: status.filter(s => s.platform_apply).length,
      pending: status.filter(s => !s.platform_apply && s.pipeline_stage !== "live").length
    };
    status.forEach(s => {
      stats.by_stage[s.pipeline_stage] = (stats.by_stage[s.pipeline_stage] || 0) + 1;
    });

    return res.json({
      projects: status,
      stats,
      generated_at: new Date().toISOString()
    });

  } catch (err) {
    console.error("[platform-status] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
