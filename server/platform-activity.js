const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/platform/activity
router.get("/", async (req, res) => {
  try {
    // Get last 5 self-improve cycles
    const { data: cycles } = await supabase
      .from("self_improve_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);

    // Get stats
    const { count: total } = await supabase
      .from("self_improve_log")
      .select("*", { count: "exact", head: true });

    const { count: successful } = await supabase
      .from("self_improve_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: failed } = await supabase
      .from("self_improve_log")
      .select("*", { count: "exact", head: true })
      .in("status", ["failed", "error"]);

    res.json({
      cycles: (cycles || []).map(c => ({
        id: c.id,
        suggestion: c.suggestion,
        status: c.status,
        started_at: c.started_at,
        completed_at: c.completed_at,
        github_issue_url: c.github_issue_url,
        project_id: c.project_id,
      })),
      stats: {
        total_cycles: total || 0,
        successful: successful || 0,
        failed: failed || 0,
        last_cycle: cycles?.[0]?.started_at || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
