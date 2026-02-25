// Global OpenRouter fetch interceptor for AI usage logging
// Require this ONCE in server/index.js — it monkey-patches global fetch
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const MODEL_COSTS = {
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "anthropic/claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "anthropic/claude-sonnet-3.5": { input: 3.0, output: 15.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
};

function calcCost(model, inputTokens, outputTokens) {
  const rates = MODEL_COSTS[model] || { input: 3.0, output: 15.0 };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

// Track context per request (set by middleware)
let _currentContext = {};

function setAIContext(ctx) {
  _currentContext = { ...ctx };
}

// Monkey-patch fetch
const originalFetch = global.fetch;
global.fetch = async function patchedFetch(url, opts) {
  const isOpenRouter = typeof url === "string" && url.includes("openrouter.ai/api/v1/chat/completions");
  if (!isOpenRouter) return originalFetch(url, opts);

  const startTime = Date.now();
  const ctx = { ..._currentContext };
  
  // Extract model from request body
  let requestModel = "unknown";
  try {
    const body = JSON.parse(opts?.body || "{}");
    requestModel = body.model || "unknown";
  } catch {}

  const response = await originalFetch(url, opts);
  
  // Clone the response so we can read the body without consuming it
  const cloned = response.clone();
  
  // Read body in background for logging (don't block the caller)
  cloned.text().then(bodyText => {
    try {
      const data = JSON.parse(bodyText);
      const usage = data?.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const model = data?.model || requestModel;
      const latencyMs = Date.now() - startTime;
      const costUsd = calcCost(model, inputTokens, outputTokens);

      if (inputTokens > 0 || outputTokens > 0) {
        console.log(`[AI$] ${ctx.module || "?"}/${ctx.operation || "?"} | ${model} | ${inputTokens}+${outputTokens}t | $${costUsd.toFixed(4)} | ${latencyMs}ms`);

        supabase.from("ai_usage_logs").insert({
          project_id: ctx.projectId || null,
          user_id: ctx.userId || null,
          module: ctx.module || "unknown",
          operation: ctx.operation || "unknown",
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: costUsd,
          latency_ms: latencyMs,
        }).then(() => {}).catch(err => console.error("[AI$] Log error:", err.message));
      }
    } catch {}
  }).catch(() => {});

  return response;
};

module.exports = { setAIContext };
