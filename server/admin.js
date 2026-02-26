const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ADMIN_EMAIL = "me@dante.id";

async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: "Admin access required" });
    req.user = user;
    next();
  } catch (err) { return res.status(401).json({ error: "Auth failed" }); }
}

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const { data: projects } = await supabase.from("projects").select("status");
    const statusCounts = {};
    (projects || []).forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
    
    const { count: userCount } = await supabase.from("projects").select("user_id", { count: "exact", head: true });
    // Get unique users
    const { data: users } = await supabase.rpc("get_unique_user_count").catch(() => ({ data: null }));
    const uniqueUsers = users || new Set((projects || []).map(p => p.user_id)).size;

    res.json({ total_projects: (projects || []).length, total_users: typeof uniqueUsers === 'number' ? uniqueUsers : uniqueUsers, status_counts: statusCounts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/projects", requireAdmin, async (req, res) => {
  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, company_name, full_name, status, stage, idea, user_id, created_at, updated_at")
      .order("updated_at", { ascending: false });

    // Get counts for each project
    const ids = (projects || []).map(p => p.id);
    const [featRes, bpRes, woRes, buildRes, testRes, deployRes] = await Promise.all([
      supabase.from("features").select("project_id").in("project_id", ids),
      supabase.from("blueprints").select("project_id").in("project_id", ids),
      supabase.from("work_orders").select("project_id").in("project_id", ids),
      supabase.from("builds").select("project_id").in("project_id", ids),
      supabase.from("test_results").select("project_id").in("project_id", ids),
      supabase.from("deployments").select("project_id, url, vercel_url, status").in("project_id", ids),
    ]);

    const count = (data, pid) => (data || []).filter(r => r.project_id === pid).length;

    // Get cost per project
    const { data: costLogs } = await supabase.from("ai_usage_logs").select("project_id, cost_usd").in("project_id", ids);
    const costMap = {};
    let totalPlatformCost = 0;
    (costLogs || []).forEach(l => {
      const c = Number(l.cost_usd) || 0;
      costMap[l.project_id] = (costMap[l.project_id] || 0) + c;
      totalPlatformCost += c;
    });

    // Get user emails via auth admin
    const userIds = [...new Set((projects || []).map(p => p.user_id))];
    const userEmails = {};
    for (const uid of userIds) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(uid);
        if (user) userEmails[uid] = user.email;
      } catch (e) { userEmails[uid] = "unknown"; }
    }

    const result = (projects || []).map(p => ({
      id: p.id,
      name: p.name || p.company_name || p.full_name || "Untitled",
      user_email: userEmails[p.user_id] || "unknown",
      status: p.status || "pending",
      idea: p.idea,
      features: count(featRes.data, p.id),
      blueprints: count(bpRes.data, p.id),
      work_orders: count(woRes.data, p.id),
      builds: count(buildRes.data, p.id),
      tests: count(testRes.data, p.id),
      deployments: count(deployRes.data, p.id),
      created_at: p.created_at,
      updated_at: p.updated_at,
      deploy_url: ((deployRes.data || []).find(d => d.project_id === p.id && d.status === 'live') || {}).vercel_url
        || ((deployRes.data || []).find(d => d.project_id === p.id && d.status === 'live') || {}).url
        || null,
      cost_usd: Math.round((costMap[p.id] || 0) * 10000) / 10000,
    }));

    res.json({ projects: result, total_users: Object.keys(userEmails).length, total_platform_cost: Math.round(totalPlatformCost * 100) / 100 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AI Usage Stats ---
router.get("/usage", requireAdmin, async (req, res) => {
  try {
    // Per-project totals
    const { data: perProject } = await supabase.rpc("exec_sql", { sql: "" }).catch(() => ({ data: null }));
    
    // Use direct query instead
    const { data: logs } = await supabase.from("ai_usage_logs")
      .select("project_id, module, operation, model, input_tokens, output_tokens, cost_usd, latency_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    // Aggregate per project
    const byProject = {};
    const byModule = {};
    let totalCost = 0, totalTokens = 0;

    (logs || []).forEach(l => {
      const pid = l.project_id || "unknown";
      if (!byProject[pid]) byProject[pid] = { cost: 0, tokens: 0, calls: 0 };
      byProject[pid].cost += Number(l.cost_usd) || 0;
      byProject[pid].tokens += (l.input_tokens + l.output_tokens) || 0;
      byProject[pid].calls += 1;

      const mod = l.module || "unknown";
      if (!byModule[mod]) byModule[mod] = { cost: 0, tokens: 0, calls: 0 };
      byModule[mod].cost += Number(l.cost_usd) || 0;
      byModule[mod].tokens += (l.input_tokens + l.output_tokens) || 0;
      byModule[mod].calls += 1;

      totalCost += Number(l.cost_usd) || 0;
      totalTokens += (l.input_tokens + l.output_tokens) || 0;
    });

    res.json({
      total_cost_usd: Math.round(totalCost * 10000) / 10000,
      total_tokens: totalTokens,
      total_calls: (logs || []).length,
      by_project: byProject,
      by_module: byModule,
      recent: (logs || []).slice(0, 20),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
