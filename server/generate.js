const { createClient } = require("@supabase/supabase-js");
const { getPrompts } = require("./prompts");
const { generateLandingProject } = require("./generate-landing");
const { deployLandingPage } = require("./deploy");
const path = require("path");
const fs = require("fs");

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

  // 2. Check if deliverables already exist (idempotent)
  const { data: existing } = await supabase
    .from("deliverables")
    .select("id")
    .eq("project_id", projectId);

  if (existing && existing.length > 0) {
    console.log(`Deliverables already exist for project ${projectId}, skipping`);
    return;
  }

  // 3. Create pending deliverable rows
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

      // Special handling for landing_page: generate full project + deploy
      if (deliverable.type === 'landing_page') {
        try {
          const projectDir = path.join('/tmp/landing-projects', deliverable.project_id);
          if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true });
          }

          const meta = { company_name: project.company_name || '', full_name: project.full_name || '' };

          await generateLandingProject(content, projectDir, meta);

          const urls = await deployLandingPage(projectDir, project.company_name || project.full_name || 'project', deliverable.id);

          content.deploy_url = urls.deploy_url;
          content.github_url = urls.github_url;

          try { fs.rmSync(projectDir, { recursive: true }); } catch(e) {}

          console.log('Landing page deployed:', urls);
        } catch (deployErr) {
          console.error('Landing page deploy failed:', deployErr.message);
        }
      }

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
