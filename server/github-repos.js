const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { getUserGitHubToken } = require("./github-auth");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Helper to get cache key for a user
function getCacheKey(userId) {
  return `repos:${userId}`;
}

// Helper to get cached data if valid
function getCached(userId) {
  const key = getCacheKey(userId);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  // Clean up expired entry
  if (cached) {
    cache.delete(key);
  }
  return null;
}

// Helper to set cached data
function setCached(userId, data) {
  const key = getCacheKey(userId);
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

// Auth middleware
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch (err) { 
    return res.status(401).json({ error: "Auth failed" }); 
  }
}

// --- GET /api/github/repos --- List user's GitHub repositories
router.get("/repos", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check cache first
    const cached = getCached(userId);
    if (cached) {
      return res.json({ repos: cached, cached: true });
    }

    // Get user's GitHub token
    const tokenData = await getUserGitHubToken(userId);
    if (!tokenData || !tokenData.token) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    // Fetch repos from GitHub API
    const githubUrl = "https://api.github.com/user/repos?affiliation=owner,collaborator&sort=updated&per_page=100";
    const githubRes = await fetch(githubUrl, {
      headers: {
        "Authorization": `Bearer ${tokenData.token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text().catch(() => "Unknown error");
      console.error(`GitHub API error: ${githubRes.status} ${errorText}`);
      
      if (githubRes.status === 401) {
        return res.status(401).json({ error: "GitHub token expired or invalid" });
      }
      if (githubRes.status === 403) {
        return res.status(403).json({ error: "GitHub API rate limit exceeded" });
      }
      return res.status(502).json({ error: "GitHub API request failed", details: errorText });
    }

    const githubRepos = await githubRes.json();

    // Fetch enabled repos from connected_repos table
    const { data: connectedRepos, error: dbError } = await supabase
      .from("connected_repos")
      .select("repo_full_name, enabled")
      .eq("user_id", userId);

    if (dbError) {
      console.error("Database error fetching connected_repos:", dbError);
      // Don't fail the request, just assume no repos are enabled
    }

    // Build a set of enabled repo full_names
    const enabledRepos = new Set();
    if (connectedRepos) {
      connectedRepos.forEach(repo => {
        if (repo.enabled) {
          enabledRepos.add(repo.repo_full_name);
        }
      });
    }

    // Map GitHub repos to response format
    const repos = githubRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      html_url: repo.html_url,
      description: repo.description,
      enabled: enabledRepos.has(repo.full_name)
    }));

    // Cache the results
    setCached(userId, repos);

    res.json({ repos });
  } catch (err) {
    console.error("Error fetching GitHub repos:", err.message);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// --- POST /api/github/repos/:repo_id/enable --- Enable QA, register webhook
router.post("/repos/:repo_id/enable", requireAuth, async (req, res) => {
  try {
    const repoId = parseInt(req.params.repo_id, 10);
    if (isNaN(repoId)) {
      return res.status(400).json({ error: "Invalid repo_id" });
    }

    const userId = req.user.id;
    const tokenData = await getUserGitHubToken(userId);
    if (!tokenData || !tokenData.token) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    // Get repo details from GitHub
    const repoRes = await fetch(`https://api.github.com/repositories/${repoId}`, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (!repoRes.ok) {
      const errorText = await repoRes.text().catch(() => "Unknown error");
      console.error("GitHub API error fetching repo:", errorText);
      return res.status(404).json({ error: "Repository not found" });
    }

    const repo = await repoRes.json();

    // Register webhook with GitHub
    const webhookRes = await fetch(`https://api.github.com/repos/${repo.full_name}/hooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        name: "web",
        config: {
          url: "https://dante.id/api/webhooks/github",
          content_type: "json"
        },
        events: ["pull_request"],
        active: true
      })
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text().catch(() => "Unknown error");
      console.error("GitHub webhook registration error:", errorText);
      return res.status(500).json({ error: "Failed to register webhook" });
    }

    const webhook = await webhookRes.json();

    // Upsert connected repo record
    const { data: existing, error: existingError } = await supabase
      .from("connected_repos")
      .select("id")
      .eq("user_id", userId)
      .eq("github_repo_id", repoId)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Database error checking existing repo:", existingError);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("connected_repos")
        .update({
          enabled: true,
          webhook_id: webhook.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Database error updating connected repo:", updateError);
        return res.status(500).json({ error: "Failed to update repo status" });
      }
    } else {
      const { error: insertError } = await supabase
        .from("connected_repos")
        .insert({
          user_id: userId,
          github_repo_id: repoId,
          full_name: repo.full_name,
          webhook_id: webhook.id,
          enabled: true
        });

      if (insertError) {
        console.error("Database error inserting connected repo:", insertError);
        return res.status(500).json({ error: "Failed to save repo status" });
      }
    }

    // Clear cache
    cache.delete(getCacheKey(userId));

    res.json({
      enabled: true,
      repo_id: repoId,
      full_name: repo.full_name,
      webhook_id: webhook.id
    });
  } catch (err) {
    console.error("Error enabling repo:", err.message);
    res.status(500).json({ error: "Failed to enable repository" });
  }
});

// --- POST /api/github/repos/:repo_id/disable --- Disable QA, remove webhook
router.post("/repos/:repo_id/disable", requireAuth, async (req, res) => {
  try {
    const repoId = parseInt(req.params.repo_id, 10);
    if (isNaN(repoId)) {
      return res.status(400).json({ error: "Invalid repo_id" });
    }

    const userId = req.user.id;
    const tokenData = await getUserGitHubToken(userId);
    if (!tokenData || !tokenData.token) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    // Get the connected repo record
    const { data: connectedRepo, error: fetchError } = await supabase
      .from("connected_repos")
      .select("id, full_name, webhook_id")
      .eq("user_id", userId)
      .eq("github_repo_id", repoId)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      return res.status(404).json({ error: "Repository not connected" });
    }

    if (fetchError) {
      console.error("Database error fetching connected repo:", fetchError);
      return res.status(500).json({ error: "Failed to fetch repository status" });
    }

    if (!connectedRepo) {
      return res.status(404).json({ error: "Repository not connected" });
    }

    // Remove webhook if exists
    if (connectedRepo.webhook_id) {
      const deleteRes = await fetch(
        `https://api.github.com/repos/${connectedRepo.full_name}/hooks/${connectedRepo.webhook_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
          }
        }
      );

      if (!deleteRes.ok && deleteRes.status !== 404) {
        const errorText = await deleteRes.text().catch(() => "Unknown error");
        console.error("GitHub webhook deletion error:", errorText);
        // Continue anyway - webhook might already be deleted
      }
    }

    // Update the record to disabled
    const { error: updateError } = await supabase
      .from("connected_repos")
      .update({
        enabled: false,
        webhook_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", connectedRepo.id);

    if (updateError) {
      console.error("Database error updating connected repo:", updateError);
      return res.status(500).json({ error: "Failed to update repo status" });
    }

    // Clear cache
    cache.delete(getCacheKey(userId));

    res.json({
      enabled: false,
      repo_id: repoId,
      full_name: connectedRepo.full_name
    });
  } catch (err) {
    console.error("Error disabling repo:", err.message);
    res.status(500).json({ error: "Failed to disable repository" });
  }
});

module.exports = router;
