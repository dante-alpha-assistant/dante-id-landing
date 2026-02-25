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
      supabase.from("deployments").select("project_id").in("project_id", ids),
    ]);

    const count = (data, pid) => (data || []).filter(r => r.project_id === pid).length;

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
    }));

    res.json({ projects: result, total_users: Object.keys(userEmails).length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
