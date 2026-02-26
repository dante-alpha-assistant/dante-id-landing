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

module.exports = router;
