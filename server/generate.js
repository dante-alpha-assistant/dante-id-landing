const { createClient } = require("@supabase/supabase-js");
const { getPrompts } = require("./prompts");
const { generateLandingProject } = require("./generate-landing");
const { deployLandingPage } = require("./deploy");
const { notifyDeliverablesComplete } = require("./email");
const path = require("path");
const fs = require("fs");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DELIVERABLE_TYPES = ["brand_identity", "landing_page", "business_plan", "growth_strategy", "personal_brand", "pitch_deck", "competitor_analysis"];

function repairJson(raw) {
  // Strip markdown fences
  raw = raw.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '').trim();
  // Extract the JSON object
  const match = raw.match(/\{[\s\S]*$/);
  if (!match) throw new Error('No JSON object found in AI response');
  let json = match[0];
  
  // Fix trailing commas
  json = json.replace(/,\s*([\]}])/g, '$1');
  
  // Try parsing as-is
  try { return JSON.parse(json); } catch (_) {}
  
  // Smart bracket repair: fix mismatched close brackets
  const chars = [...json];
  const stack = [];
  let inStr = false, esc = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') stack.push({ ch, i });
    if (ch === '}' || ch === ']') {
      const expected = ch === '}' ? '{' : '[';
      if (stack.length && stack[stack.length - 1].ch === expected) {
        stack.pop();
      } else if (stack.length) {
        // Mismatch: fix the close bracket to match the opener
        const opener = stack[stack.length - 1].ch;
        chars[i] = opener === '{' ? '}' : ']';
        stack.pop();
      }
    }
  }
  let repaired = chars.join('');
  repaired = repaired.replace(/,\s*$/, '');
  while (stack.length) {
    const opener = stack.pop();
    repaired += opener.ch === '{' ? '}' : ']';
  }
  repaired = repaired.replace(/,\s*([\]}])/g, '$1');
  
  return JSON.parse(repaired);
}

async function callAI(prompts, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
    if (!data.choices || !data.choices[0]) {
      console.error('AI returned no choices:', JSON.stringify(data).substring(0, 500));
      if (attempt < maxRetries) continue;
      throw new Error('AI returned no choices');
    }

    const raw = data.choices[0].message.content;
    try {
      return repairJson(raw);
    } catch (e) {
      console.error(`JSON parse attempt ${attempt + 1} failed:`, e.message);
      console.error('Raw response (first 500 chars):', raw.substring(0, 500));
      if (attempt >= maxRetries) throw e;
    }
  }
}

async function generateDeliverables(projectId) {
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) {
    console.error("Failed to fetch project:", fetchError);
    return;
  }

  const { data: existing } = await supabase
    .from("deliverables")
    .select("id")
    .eq("project_id", projectId);

  if (existing && existing.length > 0) {
    console.log(`Deliverables already exist for project ${projectId}, skipping`);
    return;
  }

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

  for (const deliverable of deliverables) {
    try {
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

      const content = await callAI(prompts);

      // Special handling for landing_page
      if (deliverable.type === 'landing_page') {
        try {
          const projectDir = path.join('/tmp/landing-projects', deliverable.project_id);
          if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true });
          }

          const meta = { company_name: project.company_name || '', full_name: project.full_name || '' };
          await generateLandingProject(content, projectDir, meta, null, deliverable.project_id);
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

  await supabase
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId);

  console.log(`Project ${projectId} generation complete`);

  // Send email notification
  notifyDeliverablesComplete(supabase, projectId).catch((err) =>
    console.error("Email notification error:", err.message)
  );
}

async function retrySingleDeliverable(projectId, deliverableId) {
  const { data: project } = await supabase
    .from("projects").select("*").eq("id", projectId).single();
  if (!project) throw new Error("Project not found");

  const { data: deliverable } = await supabase
    .from("deliverables").select("*").eq("id", deliverableId).single();
  if (!deliverable) throw new Error("Deliverable not found");

  await supabase.from("deliverables").update({ status: "generating" }).eq("id", deliverableId);

  const prompts = getPrompts(deliverable.type, {
    idea: project.idea || "", stage: project.stage || "",
    needs: project.needs || "", company_name: project.company_name || "",
    full_name: project.full_name || ""
  });

  const content = await callAI(prompts);

  if (deliverable.type === 'landing_page') {
    try {
      const projectDir = path.join('/tmp/landing-projects', projectId);
      if (fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true });
      const meta = { company_name: project.company_name || '', full_name: project.full_name || '' };
      await generateLandingProject(content, projectDir, meta, null, projectId);
      const urls = await deployLandingPage(projectDir, project.company_name || project.full_name || 'project', deliverableId);
      content.deploy_url = urls.deploy_url;
      content.github_url = urls.github_url;
      try { fs.rmSync(projectDir, { recursive: true }); } catch(e) {}
    } catch (deployErr) {
      console.error('Landing page deploy failed:', deployErr.message);
    }
  }

  await supabase.from("deliverables").update({ content, status: "completed" }).eq("id", deliverableId);
  console.log(`Retry completed: ${deliverable.type}`);

  // Check if all deliverables are now done and notify
  notifyDeliverablesComplete(supabase, projectId).catch((err) =>
    console.error("Email notification error:", err.message)
  );
}

module.exports = { generateDeliverables, retrySingleDeliverable, repairJson };
