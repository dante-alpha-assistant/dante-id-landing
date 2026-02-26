const express = require("express");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { getUserGitHubToken } = require("./github-auth");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const router = express.Router();

// Webhook endpoint - no auth middleware, uses signature verification
// Must use express.raw() to get the raw body for signature verification
router.post("/github", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers["x-hub-signature-256"];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error("[Webhook] GITHUB_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }
    
    if (!signature) {
      console.error("[Webhook] Missing X-Hub-Signature-256 header");
      return res.status(401).send("Unauthorized");
    }
    
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(req.body).digest("hex");
    
    if (signature !== digest) {
      console.error("[Webhook] Invalid signature");
      return res.status(401).send("Unauthorized");
    }
    
    const event = JSON.parse(req.body);
    const eventType = req.headers["x-github-event"];
    
    console.log(`[Webhook] Received ${eventType} event for ${event.repository?.full_name || "unknown"}`);
    
    // Handle PR events
    if (eventType === "pull_request" && ["opened", "synchronize"].includes(event.action)) {
      const repoId = event.repository.id;
      const prNumber = event.number;
      
      // Store in webhook_events table
      const { error: insertError } = await supabase.from("webhook_events").insert({
        github_repo_id: repoId,
        event_type: event.action,
        payload: event
      });
      
      if (insertError) {
        console.error("[Webhook] Failed to store event:", insertError.message);
      } else {
        console.log(`[Webhook] Stored ${event.action} event for PR #${prNumber} in repo ${repoId}`);
      }
      
      // Find connected repo and trigger QA if enabled
      const { data: connected, error: connectedError } = await supabase
        .from("connected_repos")
        .select("id, full_name, enabled, user_id")
        .eq("github_repo_id", repoId)
        .eq("enabled", true)
        .single();
      
      if (connectedError && connectedError.code !== "PGRST116") {
        console.error("[Webhook] Error fetching connected repo:", connectedError.message);
      }
      
      if (connected) {
        console.log(`[Webhook] Found connected repo: ${connected.full_name}, triggering QA...`);
        
        // Get user's GitHub token for the dispatch call
        const tokenData = await getUserGitHubToken(connected.user_id);
        
        if (!tokenData || !tokenData.token) {
          console.error(`[Webhook] No GitHub token found for user ${connected.user_id}`);
          return res.status(200).send("OK");
        }
        
        // Trigger repository_dispatch via GitHub API
        const dispatchRes = await fetch(
          `https://api.github.com/repos/${connected.full_name}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenData.token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              event_type: "dante-qa",
              client_payload: {
                pr_number: prNumber,
                action: event.action,
                repo_id: repoId,
                repo_full_name: connected.full_name
              }
            })
          }
        );
        
        if (!dispatchRes.ok) {
          const errorText = await dispatchRes.text().catch(() => "Unknown error");
          console.error(`[Webhook] Failed to trigger dispatch: ${dispatchRes.status} ${errorText}`);
        } else {
          console.log(`[Webhook] Successfully triggered dante-qa dispatch for PR #${prNumber}`);
        }
      } else {
        console.log(`[Webhook] No connected repo found for ${repoId} or QA not enabled`);
      }
    }
    
    res.status(200).send("OK");
  } catch (err) {
    console.error("[Webhook] Error processing webhook:", err.message);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
