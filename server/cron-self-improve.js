const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function initSelfImproveCron(app) {
  if (process.env.SELF_IMPROVE_ENABLED === "false") {
    console.log("[Cron] Self-improve disabled");
    return;
  }

  // Run every 6 hours: 0 */6 * * *
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Cron] Self-improve cycle starting...");
    try {
      // Call the self-improve endpoint internally
      const serviceKey = process.env.SUPABASE_SERVICE_KEY;
      const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/platform/self-improve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      const data = await res.json();
      
      // Log the cycle
      await supabase.from("self_improve_log").insert({
        suggestion: data.improvements?.[0]?.title || data.suggestion || JSON.stringify(data).slice(0, 500),
        status: res.ok ? "completed" : "failed",
        result: data,
        completed_at: new Date().toISOString(),
      });

      console.log("[Cron] Self-improve cycle complete:", res.ok ? "success" : "failed");
    } catch (err) {
      console.error("[Cron] Self-improve error:", err.message);
      await supabase.from("self_improve_log").insert({
        suggestion: "Cron error: " + err.message,
        status: "error",
        result: { error: err.message },
        completed_at: new Date().toISOString(),
      }).catch(() => {});
    }
  });

  console.log("[Cron] Self-improve scheduled: every 6 hours");
}

module.exports = { initSelfImproveCron };
