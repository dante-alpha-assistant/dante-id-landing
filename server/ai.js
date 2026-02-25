// Shared AI call utility with usage logging
const { createClient } = require("@supabase/supabase-js");
const { repairJson } = require("./generate");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Cost per 1M tokens (USD) — update as pricing changes
const MODEL_COSTS = {
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "anthropic/claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "anthropic/claude-sonnet-3.5": { input: 3.0, output: 15.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
};

function calcCost(model, inputTokens, outputTokens) {
  const rates = MODEL_COSTS[model] || { input: 3.0, output: 15.0 }; // default to sonnet pricing
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

/**
 * Call AI via OpenRouter with automatic usage logging
 * @param {Object} opts
 * @param {string} opts.systemPrompt
 * @param {string} opts.userPrompt  
 * @param {string} opts.module - 'refinery', 'foundry', etc.
 * @param {string} opts.operation - 'generate_prd', 'build_feature', etc.
 * @param {string} [opts.projectId]
 * @param {string} [opts.userId]
 * @param {string} [opts.model] - defaults to claude-sonnet-4
 * @param {number} [opts.timeoutMs] - defaults to 180000
 * @param {boolean} [opts.raw] - return raw string instead of parsed JSON
 * @returns {Promise<any>} parsed JSON response (or raw string if opts.raw)
 */
async function callAI(opts) {
  const {
    systemPrompt, userPrompt, module, operation,
    projectId, userId,
    model = "anthropic/claude-sonnet-4",
    timeoutMs = 180000,
    raw = false,
  } = opts;

  const startTime = Date.now();
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      });

      const bodyPromise = res.text();
      const bodyTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Body timeout")), 300000));
      const bodyText = await Promise.race([bodyPromise, bodyTimeout]);
      clearTimeout(timeout);

      const data = JSON.parse(bodyText);
      if (!data.choices?.[0]) throw new Error("No AI response");

      const content = data.choices[0].message.content;
      const usage = data.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const latencyMs = Date.now() - startTime;
      const actualModel = data.model || model;
      const costUsd = calcCost(actualModel, inputTokens, outputTokens);

      // Log usage (fire and forget)
      supabase.from("ai_usage_logs").insert({
        project_id: projectId || null,
        user_id: userId || null,
        module,
        operation,
        model: actualModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        latency_ms: latencyMs,
      }).then(() => {}).catch(err => console.error("[AI Log] Insert error:", err.message));

      console.log(`[AI] ${module}/${operation} | ${inputTokens}+${outputTokens} tokens | $${costUsd.toFixed(4)} | ${latencyMs}ms`);

      if (raw) return content;
      return repairJson(content);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      console.log(`[AI] Retry ${attempt + 1} for ${module}/${operation}: ${err.message}`);
    }
  }
}

module.exports = { callAI, calcCost };
