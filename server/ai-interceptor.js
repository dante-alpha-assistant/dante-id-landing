// Global OpenRouter fetch interceptor for AI usage logging
// Require this ONCE in server/index.js — it monkey-patches global fetch
const { createClient } = require("@supabase/supabase-js");
const { Langfuse } = require("langfuse");

// LangFuse initialization (optional — works without keys, just skips)
let langfuse = null;
if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
  langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
  });
  console.log("[LangFuse] Initialized ✅");
} else {
  console.log("[LangFuse] No keys — using local logging only");
}

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

        // Log to Supabase
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
        }).then(({ error }) => {
          if (error) console.error("[AI$] Supabase insert error:", error.message, error.details, error.hint);
          else console.log("[AI$] Logged to Supabase ✅");
        }).catch(err => console.error("[AI$] Log error:", err.message));

        // Log to LangFuse
        if (langfuse) {
          try {
            const trace = langfuse.trace({
              name: `${ctx.module || "unknown"}/${ctx.operation || "unknown"}`,
              metadata: { projectId: ctx.projectId, userId: ctx.userId },
            });
            trace.generation({
              name: ctx.operation || "ai_call",
              model,
              modelParameters: {},
              input: `[${ctx.module}] ${ctx.operation}`,
              output: "response",
              usage: { promptTokens: inputTokens, completionTokens: outputTokens },
              metadata: { projectId: ctx.projectId, costUsd },
            });
          } catch (lfErr) {
            console.error("[LangFuse] Error:", lfErr.message);
          }
        }
      }
    } catch {}
  }).catch(() => {});

  return response;
};

// Self-test on load
supabase.from("ai_usage_logs").select("id").limit(1).then(({ data, error }) => {
  if (error) console.error("[AI$] Supabase self-test FAILED:", error.message);
  else console.log("[AI$] Supabase self-test OK, rows:", data?.length);
}).catch(err => console.error("[AI$] Supabase self-test error:", err.message));

module.exports = { setAIContext };
