const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { getUserGitHubToken } = require("./github-auth");

const router = express.Router({ mergeParams: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Auth middleware
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "");

  // Service key bypass for internal/admin calls
  if (token === process.env.SUPABASE_SERVICE_KEY) {
    const projectId = req.params?.id;
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

    // Verify project ownership
    const projectId = req.params?.id;
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

// Helper: Query GitHub Actions API for workflow runs
async function fetchGitHubWorkflowRuns(repoFullName, token, options = {}) {
  const { per_page = 10, branch, event = "push" } = options;
  
  let url = `https://api.github.com/repos/${repoFullName}/actions/runs?per_page=${per_page}`;
  if (branch) url += `&branch=${encodeURIComponent(branch)}`;
  if (event) url += `&event=${encodeURIComponent(event)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json();
}

// Helper: Query GitHub Actions API for a specific workflow run
async function fetchGitHubWorkflowRun(repoFullName, runId, token) {
  const url = `https://api.github.com/repos/${repoFullName}/actions/runs/${runId}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json();
}

// Helper: Query GitHub Actions API for workflow run jobs
async function fetchGitHubWorkflowJobs(repoFullName, runId, token) {
  const url = `https://api.github.com/repos/${repoFullName}/actions/runs/${runId}/jobs`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json();
}

// --- GET /api/projects/:id/qa-results — fetch latest results ---
router.get("/", requireAuth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { limit = 20, offset = 0, status } = req.query;

    let query = supabase
      .from("qa_results")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[QA Results] Fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Get connected repo info for the project
    const { data: connectedRepo } = await supabase
      .from("connected_repos")
      .select("repo_full_name, default_branch")
      .eq("project_id", projectId)
      .single();

    res.json({
      results: data || [],
      repo: connectedRepo || null,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: data?.length || 0
      }
    });
  } catch (err) {
    console.error("[QA Results] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/projects/:id/qa-results/sync — sync from GitHub Actions API ---
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { pr_number, branch, run_id } = req.body;

    // Get connected repo info
    const { data: connectedRepo } = await supabase
      .from("connected_repos")
      .select("repo_full_name, default_branch")
      .eq("project_id", projectId)
      .single();

    if (!connectedRepo) {
      return res.status(404).json({ error: "No connected repository found for this project" });
    }

    // Get user's GitHub token
    const githubAuth = await getUserGitHubToken(req.user.id);
    if (!githubAuth || !githubAuth.token) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    const repoFullName = connectedRepo.repo_full_name;
    const syncResults = [];

    // If specific run_id provided, fetch just that run
    if (run_id) {
      const runData = await fetchGitHubWorkflowRun(repoFullName, run_id, githubAuth.token);
      const jobsData = await fetchGitHubWorkflowJobs(repoFullName, run_id, githubAuth.token);
      
      // Extract job statuses
      const lintJob = jobsData.jobs?.find(j => j.name.toLowerCase().includes("lint"));
      const buildJob = jobsData.jobs?.find(j => j.name.toLowerCase().includes("build"));
      const testJob = jobsData.jobs?.find(j => j.name.toLowerCase().includes("test"));

      const qaResult = {
        project_id: projectId,
        repo_full_name: repoFullName,
        pr_number: pr_number || null,
        commit_sha: runData.head_sha,
        status: runData.status === "completed" ? runData.conclusion : runData.status,
        lint_status: lintJob?.conclusion || lintJob?.status || null,
        build_status: buildJob?.conclusion || buildJob?.status || null,
        test_status: testJob?.conclusion || testJob?.status || null,
        test_summary: testJob ? {
          total: testJob.steps?.length || 0,
          passed: testJob.steps?.filter(s => s.conclusion === "success").length || 0,
          failed: testJob.steps?.filter(s => s.conclusion === "failure").length || 0
        } : null,
        github_run_id: runData.id,
        github_run_url: runData.html_url,
        started_at: runData.run_started_at,
        completed_at: runData.updated_at
      };

      // Upsert the QA result
      const { data: upserted, error: upsertError } = await supabase
        .from("qa_results")
        .upsert(qaResult, {
          onConflict: ["project_id", "github_run_id"],
          returning: true
        })
        .select()
        .single();

      if (upsertError) {
        console.error("[QA Results] Upsert error:", upsertError);
        return res.status(500).json({ error: upsertError.message });
      }

      syncResults.push(upserted);
    } else {
      // Fetch recent workflow runs
      const targetBranch = branch || connectedRepo.default_branch || "main";
      const runsData = await fetchGitHubWorkflowRuns(repoFullName, githubAuth.token, {
        per_page: 10,
        branch: targetBranch
      });

      // Process each workflow run
      for (const run of runsData.workflow_runs || []) {
        // Skip if already synced and completed
        const { data: existing } = await supabase
          .from("qa_results")
          .select("id, status")
          .eq("project_id", projectId)
          .eq("github_run_id", run.id)
          .single();

        if (existing && existing.status === "completed") {
          continue; // Skip completed runs that are already synced
        }

        try {
          const jobsData = await fetchGitHubWorkflowJobs(repoFullName, run.id, githubAuth.token);
          
          // Extract job statuses
          const lintJob = jobsData.jobs?.find(j => j.name.toLowerCase().includes("lint"));
          const buildJob = jobsData.jobs?.find(j => j.name.toLowerCase().includes("build"));
          const testJob = jobsData.jobs?.find(j => j.name.toLowerCase().includes("test"));

          const qaResult = {
            project_id: projectId,
            repo_full_name: repoFullName,
            pr_number: pr_number || null,
            commit_sha: run.head_sha,
            status: run.status === "completed" ? run.conclusion : run.status,
            lint_status: lintJob?.conclusion || lintJob?.status || null,
            build_status: buildJob?.conclusion || buildJob?.status || null,
            test_status: testJob?.conclusion || testJob?.status || null,
            test_summary: testJob ? {
              total: testJob.steps?.length || 0,
              passed: testJob.steps?.filter(s => s.conclusion === "success").length || 0,
              failed: testJob.steps?.filter(s => s.conclusion === "failure").length || 0
            } : null,
            github_run_id: run.id,
            github_run_url: run.html_url,
            started_at: run.run_started_at,
            completed_at: run.status === "completed" ? run.updated_at : null
          };

          const { data: upserted, error: upsertError } = await supabase
            .from("qa_results")
            .upsert(qaResult, {
              onConflict: ["project_id", "github_run_id"]
            })
            .select()
            .single();

          if (!upsertError) {
            syncResults.push(upserted);
          }
        } catch (jobErr) {
          console.error(`[QA Results] Error fetching jobs for run ${run.id}:`, jobErr.message);
          // Continue with other runs even if one fails
        }
      }
    }

    res.json({
      synced: syncResults.length,
      results: syncResults
    });
  } catch (err) {
    console.error("[QA Results] Sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/projects/:id/qa-results/:runId — fetch specific result ---
router.get("/:runId", requireAuth, async (req, res) => {
  try {
    const { id: projectId, runId } = req.params;

    const { data, error } = await supabase
      .from("qa_results")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", runId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "QA result not found" });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ result: data });
  } catch (err) {
    console.error("[QA Results] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;