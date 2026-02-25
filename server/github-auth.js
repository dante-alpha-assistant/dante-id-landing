const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL = "https://dante.id/api/auth/github/callback";
const SCOPES = "repo,read:user";

// Simple encryption for token storage
const ENCRYPT_KEY = process.env.TOKEN_ENCRYPT_KEY || "dante-id-default-key-change-me!!"; // 32 chars
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPT_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
function decrypt(text) {
  const [ivHex, encrypted] = text.split(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPT_KEY.padEnd(32).slice(0, 32)), Buffer.from(ivHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Auth middleware
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch (err) { return res.status(401).json({ error: "Auth failed" }); }
}

// In-memory state store for CSRF (simple, works for single server)
const stateStore = new Map();

// --- GET /connect --- Redirects to GitHub OAuth
router.get("/connect", requireAuth, (req, res) => {
  if (!GITHUB_CLIENT_ID) return res.status(500).json({ error: "GitHub OAuth not configured" });
  
  const state = crypto.randomBytes(16).toString("hex");
  stateStore.set(state, { userId: req.user.id, expires: Date.now() + 600000 }); // 10min TTL
  
  // Clean expired states
  for (const [k, v] of stateStore) { if (v.expires < Date.now()) stateStore.delete(k); }
  
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(SCOPES)}&state=${state}`;
  res.json({ url });
});

// --- GET /callback --- Exchange code for token
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.redirect("https://dante.id/dashboard?github=error&reason=missing_params");
  
  const stateData = stateStore.get(state);
  if (!stateData || stateData.expires < Date.now()) {
    stateStore.delete(state);
    return res.redirect("https://dante.id/dashboard?github=error&reason=invalid_state");
  }
  stateStore.delete(state);
  
  try {
    // Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: CALLBACK_URL })
    });
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error("GitHub OAuth failed:", tokenData);
      return res.redirect("https://dante.id/dashboard?github=error&reason=token_exchange_failed");
    }
    
    // Get GitHub user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" }
    });
    const ghUser = await userRes.json();
    
    // Store encrypted token
    const encryptedToken = encrypt(tokenData.access_token);
    
    const { error } = await supabase.from("github_connections").upsert({
      user_id: stateData.userId,
      github_username: ghUser.login,
      github_id: ghUser.id,
      access_token: encryptedToken,
      scopes: tokenData.scope || SCOPES,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    
    if (error) {
      console.error("DB error storing GitHub connection:", error);
      return res.redirect("https://dante.id/dashboard?github=error&reason=db_error");
    }
    
    res.redirect("https://dante.id/dashboard?github=connected");
  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    res.redirect("https://dante.id/dashboard?github=error&reason=server_error");
  }
});

// --- GET /status --- Check if user has GitHub connected
router.get("/status", requireAuth, async (req, res) => {
  try {
    const { data } = await supabase.from("github_connections")
      .select("github_username, scopes, created_at, updated_at")
      .eq("user_id", req.user.id)
      .single();
    
    if (!data) return res.json({ connected: false });
    res.json({ connected: true, github_username: data.github_username, scopes: data.scopes, connected_at: data.created_at });
  } catch (err) { res.json({ connected: false }); }
});

// --- DELETE /disconnect --- Remove GitHub connection
router.delete("/disconnect", requireAuth, async (req, res) => {
  try {
    await supabase.from("github_connections").delete().eq("user_id", req.user.id);
    res.json({ disconnected: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Helper: get user's GitHub token (for use by other modules) ---
async function getUserGitHubToken(userId) {
  const { data } = await supabase.from("github_connections")
    .select("access_token, github_username")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  return { token: decrypt(data.access_token), username: data.github_username };
}

module.exports = router;
module.exports.getUserGitHubToken = getUserGitHubToken;
