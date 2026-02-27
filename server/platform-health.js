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

// GET /api/platform/health — Pipeline success/failure rates
router.get("/", requireAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();

    // Get internal projects with PR outcomes
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, name, stage, status, created_at")
      .eq("type", "internal")
      .gte("created_at", since);

    if (projErr) throw projErr;

    // Count PRs by outcome
    const outcomes = {
      total_prs: 0,
      merged: 0,
      rejected: 0,
      pending: 0,
      unknown: 0
    };

    const projectDetails = [];

    for (const p of (projects || [])) {
      const detail = {
        id: p.id,
        name: p.name,
        pr_url: "",
        created_at: p.created_at,
        outcome: "unknown"
      };

      if ("") {
        outcomes.total_prs++;
        
        // Check if project was "completed" (PR merged) or "tested" (rejected/closed)
        if (p.status === "live" || p.stage === "launched") {
          // Check deployments for actual merge status
          const { data: deploy } = await supabase
            .from("deployments")
            .select("status, url")
            .eq("project_id", p.id)
            .eq("target", "github-pr")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (deploy?.status === "live") {
            outcomes.merged++;
            detail.outcome = "merged";
          } else {
            outcomes.pending++;
            detail.outcome = "pending_review";
          }
        } else if (p.status === "tested") {
          outcomes.rejected++;
          detail.outcome = "rejected_by_inspector";
        } else {
          outcomes.pending++;
          detail.outcome = "in_pipeline";
        }
      } else {
        detail.outcome = "no_pr_created";
      }

      projectDetails.push(detail);
    }

    // Calculate rates
    const successRate = outcomes.total_prs > 0 
      ? Math.round((outcomes.merged / outcomes.total_prs) * 100)
      : 0;

    const rejectionRate = outcomes.total_prs > 0
      ? Math.round((outcomes.rejected / outcomes.total_prs) * 100)
      : 0;

    // Get pipeline stage distribution
    const byStage = {};
    (projects || []).forEach(p => {
      byStage[p.status] = (byStage[p.status] || 0) + 1;
    });

    // Recent failures (why PRs were rejected)
    const { data: failedBuilds } = await supabase
      .from("builds")
      .select("project_id, status, logs, created_at")
      .eq("status", "failed")
      .gte("created_at", since)
      .limit(10);

    const { data: failedInspections } = await supabase
      .from("test_results")
      .select("project_id, status, results, created_at")
      .eq("status", "failed")
      .gte("created_at", since)
      .limit(10);

    return res.json({
      period: { days: parseInt(days), since },
      summary: {
        total_internal_projects: projects?.length || 0,
        prs_created: outcomes.total_prs,
        prs_merged: outcomes.merged,
        prs_rejected: outcomes.rejected,
        prs_pending: outcomes.pending,
        success_rate_percent: successRate,
        rejection_rate_percent: rejectionRate
      },
      by_stage: byStage,
      recent_failures: {
        builds: (failedBuilds || []).map(b => ({
          project_id: b.project_id,
          timestamp: b.created_at,
          error: b.logs?.[b.logs.length - 1]?.msg || "Unknown error"
        })),
        inspections: (failedInspections || []).map(i => ({
          project_id: i.project_id,
          timestamp: i.created_at,
          issues: i.results?.length || 0
        }))
      },
      projects: projectDetails.slice(0, 20), // Last 20 for detail
      health_score: Math.round(
        (successRate * 0.6) + 
        ((100 - rejectionRate) * 0.4)
      ),
      generated_at: new Date().toISOString()
    });

  } catch (err) {
    console.error("[platform-health] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
