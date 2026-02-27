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

// GET /api/platform/analytics — Self-building loop metrics
router.get("/", requireAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();

    // Get internal projects count
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, status, stage, created_at")
      .eq("type", "internal")
      .gte("created_at", since);

    if (projErr) throw projErr;

    const projectIds = (projects || []).map(p => p.id);

    // Get builds metrics
    const { data: builds } = await supabase
      .from("builds")
      .select("project_id, status, created_at, updated_at")
      .in("project_id", projectIds)
      .gte("created_at", since);

    // Get inspector/test results
    const { data: inspections } = await supabase
      .from("test_results")
      .select("project_id, status, created_at")
      .in("project_id", projectIds)
      .gte("created_at", since);

    // Get deployments
    const { data: deployments } = await supabase
      .from("deployments")
      .select("project_id, status, target, created_at")
      .in("project_id", projectIds)
      .gte("created_at", since);

    // Calculate build metrics
    const buildMetrics = {
      total: builds?.length || 0,
      by_status: {},
      success_rate: 0
    };
    (builds || []).forEach(b => {
      buildMetrics.by_status[b.status] = (buildMetrics.by_status[b.status] || 0) + 1;
    });
    const successfulBuilds = (buildMetrics.by_status['review'] || 0) + (buildMetrics.by_status['done'] || 0);
    buildMetrics.success_rate = builds?.length ? Math.round((successfulBuilds / builds.length) * 100) : 0;

    // Calculate inspector metrics
    const inspectorMetrics = {
      total: inspections?.length || 0,
      passed: 0,
      failed: 0,
      pass_rate: 0
    };
    (inspections || []).forEach(i => {
      if (i.status === 'passed') inspectorMetrics.passed++;
      else if (i.status === 'failed') inspectorMetrics.failed++;
    });
    inspectorMetrics.pass_rate = inspections?.length ? Math.round((inspectorMetrics.passed / inspections.length) * 100) : 0;

    // Calculate deploy metrics
    const deployMetrics = {
      total: deployments?.length || 0,
      live: 0,
      failed: 0,
      pending: 0,
      success_rate: 0,
      github_prs: 0,
      vercel_deploys: 0
    };
    (deployments || []).forEach(d => {
      if (d.status === 'live') deployMetrics.live++;
      else if (d.status === 'failed') deployMetrics.failed++;
      else if (d.status === 'pending') deployMetrics.pending++;
      
      if (d.target === 'github-pr') deployMetrics.github_prs++;
      if (d.target === 'vercel') deployMetrics.vercel_deploys++;
    });
    deployMetrics.success_rate = deployments?.length ? Math.round((deployMetrics.live / deployments.length) * 100) : 0;

    // Calculate self-building loop completion
    const loopMetrics = {
      total_projects: projects?.length || 0,
      completed: projects?.filter(p => p.stage === "launched").length || 0,
      completion_rate: 0,
      by_stage: {}
    };
    loopMetrics.completion_rate = loopMetrics.total_projects ? Math.round((loopMetrics.completed / loopMetrics.total_projects) * 100) : 0;
    (projects || []).forEach(p => {
      loopMetrics.by_stage[p.status] = (loopMetrics.by_stage[p.status] || 0) + 1;
    });

    // Daily trends (last 14 days)
    const dailyTrends = {};
    const daysToTrack = Math.min(parseInt(days), 30);
    for (let i = 0; i < daysToTrack; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyTrends[date] = { builds: 0, inspections: 0, deploys: 0 };
    }
    
    (builds || []).forEach(b => {
      const date = b.created_at.split('T')[0];
      if (dailyTrends[date]) dailyTrends[date].builds++;
    });
    (inspections || []).forEach(i => {
      const date = i.created_at.split('T')[0];
      if (dailyTrends[date]) dailyTrends[date].inspections++;
    });
    (deployments || []).forEach(d => {
      const date = d.created_at.split('T')[0];
      if (dailyTrends[date]) dailyTrends[date].deploys++;
    });

    // Average durations (where available)
    let totalBuildDuration = 0;
    let buildDurationCount = 0;
    (builds || []).forEach(b => {
      if (b.created_at && b.updated_at) {
        const duration = new Date(b.updated_at) - new Date(b.created_at);
        if (duration > 0 && duration < 30 * 60 * 1000) { // < 30 min
          totalBuildDuration += duration;
          buildDurationCount++;
        }
      }
    });
    const avgBuildDurationMs = buildDurationCount ? Math.round(totalBuildDuration / buildDurationCount) : 0;

    return res.json({
      period: { days: parseInt(days), since },
      summary: {
        projects: loopMetrics,
        builds: buildMetrics,
        inspections: inspectorMetrics,
        deployments: deployMetrics
      },
      avg_build_duration_ms: avgBuildDurationMs,
      avg_build_duration_min: Math.round(avgBuildDurationMs / 60000 * 10) / 10,
      trends: Object.entries(dailyTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats })),
      generated_at: new Date().toISOString()
    });

  } catch (err) {
    console.error("[platform-analytics] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
