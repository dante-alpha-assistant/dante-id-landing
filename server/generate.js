const { createClient } = require("@supabase/supabase-js");
const { getPrompts } = require("./prompts");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DELIVERABLE_TYPES = ["brand_identity", "landing_page", "business_plan", "growth_strategy"];

async function generateDeliverables(projectId) {
  // 1. Fetch project
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) {
    console.error("Failed to fetch project:", fetchError);
    return;
  }

  // 2. Create pending deliverable rows
  const rows = DELIVERABLE_TYPES.map((type) => ({
    project_id: projectId,
    type,
    status: "pending",
    content: null
  }));

  const { data: deliverables, error: insertError } = await supabase
    .from("deliverables")
    .insert(rows)
    .select();

  if (insertError) {
    console.error("Failed to create deliverable rows:", insertError);
    return;
  }

  // 3. Generate each sequentially
  for (const deliverable of deliverables) {
    try {
      // Update to generating
      await supabase
        .from("deliverables")
        .update({ status: "generating" })
        .eq("id", deliverable.id);

      const prompts = getPrompts(deliverable.type, {
        idea: project.idea || "",
        stage: project.stage || "",
        needs: project.needs || "",
        company_name: project.company_name || "",
        full_name: project.full_name || ""
      });

      // Call OpenRouter
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: prompts.system },
            { role: "user", content: prompts.user }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await res.json();
      const content = JSON.parse(data.choices[0].message.content);

      await supabase
        .from("deliverables")
        .update({ content, status: "completed" })
        .eq("id", deliverable.id);

      console.log(`Completed: ${deliverable.type}`);
    } catch (err) {
      console.error(`Failed: ${deliverable.type}`, err.message);
      await supabase
        .from("deliverables")
        .update({ status: "failed" })
        .eq("id", deliverable.id);
    }
  }

  // 4. Mark project completed
  await supabase
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId);

  console.log(`Project ${projectId} generation complete`);
}

module.exports = { generateDeliverables };
