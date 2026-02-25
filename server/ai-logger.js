// AI usage logger — wraps fetch to intercept OpenRouter responses
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

/**
 * Log AI usage after a successful call
 * @param {Object} opts - { projectId, userId, module, operation, responseData }
 * responseData = parsed OpenRouter JSON response with .usage and .model
 */
function logAIUsage({ projectId, userId, module, operation, responseData, latencyMs }) {
  const usage = responseData?.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const model = responseData?.model || "unknown";
  const costUsd = calcCost(model, inputTokens, outputTokens);

  console.log(`[AI] ${module}/${operation} | ${inputTokens}+${outputTokens} tokens | $${costUsd.toFixed(4)} | ${latencyMs || 0}ms`);

  supabase.from("ai_usage_logs").insert({
    project_id: projectId || null,
    user_id: userId || null,
    module,
    operation,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
    latency_ms: latencyMs || null,
  }).then(() => {}).catch(err => console.error("[AI Log] Insert error:", err.message));
}

module.exports = { logAIUsage, calcCost };
