const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Platform CI project ID — used when "dashboard" is passed as project_id
const PLATFORM_CI_PROJECT = "91607ad6-bacc-4ea9-8d58-007d984016f2";

// Rewrite "dashboard" to platform CI project
router.use("/:project_id", (req, res, next) => {
  if (req.params.project_id === "dashboard") {
    req.params.project_id = PLATFORM_CI_PROJECT;
  }
  next();
});

// --- Auth middleware (copied from refinery.js) ---
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
      const { data: proj } = await supabase.from("projects").select("user_id").eq("id", projectId).single();
      if (proj) req.user = { id: proj.user_id, email: "system@dante.id" };
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

// Default quality gate config
const DEFAULT_GATES = {
  min_quality_score: 70,
  max_lint_errors: 10,
  min_test_pass_rate: 80,
  require_build_passing: true,
};

// 1. GET /:project_id/status — latest qa_metrics row
router.get("/:project_id/status", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("qa_metrics")
      .select("*")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error) return res.status(404).json({ error: "No QA metrics found" });
    res.json({ metrics: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /:project_id/trends?days=30
router.get("/:project_id/trends", requireAuth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from("quality_snapshots")
      .select("*")
      .eq("project_id", req.params.project_id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ snapshots: data || [], days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /:project_id/errors?type=&severity=&page=1&limit=20
router.get("/:project_id/errors", requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("error_logs")
      .select("*", { count: "exact" })
      .eq("project_id", req.params.project_id);

    if (req.query.type) query = query.eq("type", req.query.type);
    if (req.query.severity) query = query.eq("severity", req.query.severity);

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const total = count || 0;
    res.json({ errors: data || [], total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PATCH /:project_id/errors/:error_id/resolve
router.patch("/:project_id/errors/:error_id/resolve", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("error_logs")
      .update({ resolved: true })
      .eq("id", req.params.error_id)
      .eq("project_id", req.params.project_id)
      .select()
      .single();
    if (error) return res.status(404).json({ error: "Error log not found" });
    res.json({ resolved: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /:project_id/error-history?days=30
router.get("/:project_id/error-history", requireAuth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from("error_logs")
      .select("type, created_at")
      .eq("project_id", req.params.project_id)
      .gte("created_at", since);
    if (error) return res.status(500).json({ error: error.message });

    // Group by date and type
    const grouped = {};
    (data || []).forEach((row) => {
      const date = row.created_at.slice(0, 10);
      if (!grouped[date]) grouped[date] = {};
      const type = row.type || "unknown";
      grouped[date][type] = (grouped[date][type] || 0) + 1;
    });

    const history = Object.entries(grouped)
      .map(([date, types]) => ({ date, ...types }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ history, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /:project_id/gates
router.get("/:project_id/gates", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from("quality_gates")
      .select("*")
      .eq("project_id", req.params.project_id)
      .single();
    res.json({ gates: data || { project_id: req.params.project_id, ...DEFAULT_GATES } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. PUT /:project_id/gates
router.put("/:project_id/gates", requireAuth, async (req, res) => {
  try {
    const config = {
      project_id: req.params.project_id,
      min_quality_score: req.body.min_quality_score ?? DEFAULT_GATES.min_quality_score,
      max_lint_errors: req.body.max_lint_errors ?? DEFAULT_GATES.max_lint_errors,
      min_test_pass_rate: req.body.min_test_pass_rate ?? DEFAULT_GATES.min_test_pass_rate,
      require_build_passing: req.body.require_build_passing ?? DEFAULT_GATES.require_build_passing,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("quality_gates")
      .upsert(config, { onConflict: "project_id" })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ gates: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /:project_id/gates/validate
router.post("/:project_id/gates/validate", requireAuth, async (req, res) => {
  try {
    const projectId = req.params.project_id;

    // Get latest metrics
    const { data: metrics } = await supabase
      .from("qa_metrics")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!metrics) return res.status(404).json({ error: "No QA metrics found" });

    // Get gates config
    const { data: gatesRow } = await supabase
      .from("quality_gates")
      .select("*")
      .eq("project_id", projectId)
      .single();
    const gates = gatesRow || DEFAULT_GATES;

    const violations = [];
    if (metrics.quality_score < gates.min_quality_score) {
      violations.push({ gate: "min_quality_score", expected: gates.min_quality_score, actual: metrics.quality_score });
    }
    if (metrics.lint_errors > gates.max_lint_errors) {
      violations.push({ gate: "max_lint_errors", expected: gates.max_lint_errors, actual: metrics.lint_errors });
    }
    if (metrics.test_pass_rate < gates.min_test_pass_rate) {
      violations.push({ gate: "min_test_pass_rate", expected: gates.min_test_pass_rate, actual: metrics.test_pass_rate });
    }
    if (gates.require_build_passing && !metrics.build_passing) {
      violations.push({ gate: "require_build_passing", expected: true, actual: metrics.build_passing });
    }

    const passes = violations.length === 0;

    // Insert validation record
    await supabase.from("quality_validations").insert({
      project_id: projectId,
      passes,
      violations,
      metrics_snapshot: metrics,
      gates_snapshot: gates,
      created_at: new Date().toISOString(),
    });

    res.json({ passes, violations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /:project_id/trigger-ci
router.post("/:project_id/trigger-ci", requireAuth, async (req, res) => {
  try {
    const projectId = req.params.project_id;
    const userId = req.user.id;
    const { workflow_name, branch } = req.body;

    if (!workflow_name || !branch) {
      return res.status(400).json({ error: "workflow_name and branch are required" });
    }

    // Rate limit: 5/hour/user/project
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("trigger_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo);
    if ((count || 0) >= 5) {
      return res.status(429).json({ error: "Rate limit exceeded. Max 5 triggers per hour." });
    }

    // Get GitHub connection
    const { data: ghConn } = await supabase
      .from("github_connections")
      .select("*")
      .eq("project_id", projectId)
      .single();
    if (!ghConn || !ghConn.oauth_token) {
      return res.status(400).json({ error: "No GitHub connection found for this project" });
    }

    // Trigger workflow dispatch
    const ghRes = await fetch(
      `https://api.github.com/repos/${ghConn.owner}/${ghConn.repo}/actions/workflows/${workflow_name}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${ghConn.oauth_token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({ ref: branch }),
      }
    );

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      return res.status(ghRes.status).json({ error: `GitHub API error: ${errText}` });
    }

    // Record rate limit
    await supabase.from("trigger_rate_limits").insert({
      project_id: projectId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });

    // Insert CI trigger record
    const { data: trigger, error: trigError } = await supabase
      .from("ci_triggers")
      .insert({
        project_id: projectId,
        user_id: userId,
        workflow_name,
        branch,
        status: "dispatched",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (trigError) return res.status(500).json({ error: trigError.message });
    res.json({ trigger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /:project_id/triggers/:trigger_id
router.get("/:project_id/triggers/:trigger_id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ci_triggers")
      .select("*")
      .eq("id", req.params.trigger_id)
      .eq("project_id", req.params.project_id)
      .single();
    if (error || !data) return res.status(404).json({ error: "Trigger not found" });
    res.json({ trigger: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /:project_id/triggers?limit=20
router.get("/:project_id/triggers", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const { data, error } = await supabase
      .from("ci_triggers")
      .select("*")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ triggers: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/qa/ci-report — receive CI results from GitHub Actions
router.post("/ci-report", async (req, res) => {
  const secret = req.headers["x-ci-secret"];
  if (secret !== process.env.GITHUB_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Invalid secret" });
  }

  const { status, lint_errors, test_total, test_passed, test_failed, test_coverage } = req.body;

  const row = {
    repo_id: req.body.repo_id || "dante-alpha-assistant/dante-id-landing",
    lint_errors: lint_errors || 0,
    lint_warnings: req.body.lint_warnings || 0,
    build_status: status === "passed" ? "success" : "failure",
    test_total: test_total || (status === "passed" ? 1 : 0),
    test_passed: test_passed || (status === "passed" ? 1 : 0),
    test_failed: test_failed || 0,
  };
  // Default to dante.id Platform CI project
  row.project_id = req.body.project_id || "91607ad6-bacc-4ea9-8d58-007d984016f2";
  if (test_coverage != null) row.test_coverage = test_coverage;

  const { error } = await supabase.from("qa_metrics").insert(row);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ received: true });
});

// 12. POST /webhook/event — GitHub webhook (no auth)
router.post("/webhook/event", async (req, res) => {
  try {
    // Verify signature
    const sig = req.headers["x-hub-signature-256"];
    if (!sig) return res.status(401).json({ error: "Missing signature" });

    const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
    hmac.update(JSON.stringify(req.body));
    const expected = "sha256=" + hmac.digest("hex");
    if (sig !== expected) return res.status(401).json({ error: "Invalid signature" });

    const event = req.headers["x-github-event"];
    const payload = req.body;

    if (event === "workflow_run" && payload.workflow_run) {
      const run = payload.workflow_run;
      const repoFullName = payload.repository?.full_name;

      // Find project by repo
      const { data: ghConn } = await supabase
        .from("github_connections")
        .select("project_id")
        .eq("owner", payload.repository?.owner?.login)
        .eq("repo", payload.repository?.name)
        .single();

      if (ghConn) {
        const projectId = ghConn.project_id;

        // Insert qa_metrics
        await supabase.from("qa_metrics").insert({
          project_id: projectId,
          quality_score: run.conclusion === "success" ? 100 : 0,
          lint_errors: 0,
          test_pass_rate: run.conclusion === "success" ? 100 : 0,
          build_passing: run.conclusion === "success",
          workflow_name: run.name,
          workflow_run_id: String(run.id),
          branch: run.head_branch,
          commit_sha: run.head_sha,
          created_at: new Date().toISOString(),
        });

        // Insert error log if failed
        if (run.conclusion === "failure") {
          await supabase.from("error_logs").insert({
            project_id: projectId,
            type: "build",
            severity: "high",
            message: `Workflow "${run.name}" failed on branch ${run.head_branch}`,
            source: `${repoFullName}/${run.name}`,
            resolved: false,
            created_at: new Date().toISOString(),
          });
        }

        // Update any matching ci_trigger
        await supabase
          .from("ci_triggers")
          .update({
            status: run.conclusion || run.status,
            completed_at: run.updated_at || new Date().toISOString(),
          })
          .eq("project_id", projectId)
          .eq("workflow_name", run.name)
          .eq("status", "dispatched");
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[QA Webhook] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 13. GET /:project_id/summary
router.get("/:project_id/summary", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from("qa_metrics")
      .select("lint_errors, build_status, test_total, test_passed, test_failed, test_coverage, created_at")
      .eq("project_id", req.params.project_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      return res.json({
        quality_score: null,
        lint_errors: null,
        test_pass_rate: null,
        build_passing: null,
        last_run: null,
      });
    }

    const testPassRate = data.test_total > 0 ? Math.round((data.test_passed / data.test_total) * 100) : 100;
    res.json({
      quality_score: testPassRate,
      lint_errors: data.lint_errors,
      test_pass_rate: testPassRate,
      build_passing: data.build_status === "success",
      test_total: data.test_total,
      test_passed: data.test_passed,
      test_failed: data.test_failed,
      test_coverage: data.test_coverage,
      last_run: data.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
