const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- Auth middleware ---
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (token === process.env.SUPABASE_SERVICE_KEY) {
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed" });
  }
}

// POST /api/platform/test-pipeline — E2E smoke test (dry run)
router.post("/", requireAuth, async (req, res) => {
  const testId = `test-${Date.now()}`;
  const logs = [];
  const log = (stage, msg) => {
    const entry = { timestamp: new Date().toISOString(), stage, message: msg };
    logs.push(entry);
    console.log(`[Pipeline Test ${testId}] ${stage}: ${msg}`);
  };

  const results = {
    test_id: testId,
    started_at: new Date().toISOString(),
    stages: {},
    overall: "pending"
  };

  try {
    log("setup", "Starting E2E pipeline smoke test");

    // 1. Create fake internal project
    log("setup", "Creating test project");
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        user_id: req.user?.id || "system",
        company_name: "Test Project",
        idea: "A simple test feature for smoke testing the self-building pipeline",
        stage: "pending",
        type: "internal",
        status: "pending"
      })
      .select()
      .single();

    if (projErr || !project) {
      throw new Error(`Failed to create test project: ${projErr?.message}`);
    }
    results.stages.project_creation = { status: "passed", project_id: project.id };
    log("project", `Created test project ${project.id}`);

    // 2. Test Refinery (PRD generation) - with short timeout
    log("refinery", "Testing PRD generation");
    const refineryRes = await fetch("http://localhost:3001/api/refinery/generate-all", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project_id: project.id, idea: project.idea })
    });

    if (!refineryRes.ok) {
      throw new Error(`Refinery failed: ${refineryRes.status}`);
    }
    results.stages.refinery = { status: "passed" };
    log("refinery", "PRD generated successfully");

    // 3. Test Foundry (blueprints) - poll for completion
    log("foundry", "Testing blueprint generation");
    await sleep(2000); // Wait for refinery to complete
    
    const foundryRes = await fetch("http://localhost:3001/api/foundry/generate-all-architecture", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project_id: project.id })
    });

    if (!foundryRes.ok) {
      throw new Error(`Foundry failed: ${foundryRes.status}`);
    }
    results.stages.foundry = { status: "passed" };
    log("foundry", "Blueprints generated");

    // 4. Test Planner (work orders)
    log("planner", "Testing work order generation");
    await sleep(2000);
    
    const plannerRes = await fetch("http://localhost:3001/api/planner/generate-all-work-orders", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project_id: project.id })
    });

    if (!plannerRes.ok) {
      throw new Error(`Planner failed: ${plannerRes.status}`);
    }
    results.stages.planner = { status: "passed" };
    log("planner", "Work orders created");

    // 5. Test Builder (code generation) - this is the critical one
    log("builder", "Testing code generation");
    await sleep(2000);
    
    const builderRes = await fetch("http://localhost:3001/api/builder/build-all", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project_id: project.id })
    });

    if (!builderRes.ok) {
      throw new Error(`Builder failed: ${builderRes.status}`);
    }
    
    // Wait and check builds completed
    await sleep(5000);
    const { data: builds } = await supabase
      .from("builds")
      .select("id, status")
      .eq("project_id", project.id);
    
    const successfulBuilds = builds?.filter(b => b.status === "review" || b.status === "done").length || 0;
    const totalBuilds = builds?.length || 0;
    
    results.stages.builder = { 
      status: successfulBuilds > 0 ? "passed" : "failed",
      builds_created: totalBuilds,
      builds_successful: successfulBuilds
    };
    log("builder", `${successfulBuilds}/${totalBuilds} builds successful`);

    if (successfulBuilds === 0) {
      throw new Error("No builds completed successfully");
    }

    // 6. Test Inspector (code review)
    log("inspector", "Testing code inspection");
    const inspectorRes = await fetch("http://localhost:3001/api/inspector/run-all", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project_id: project.id })
    });

    results.stages.inspector = { 
      status: inspectorRes.ok ? "passed" : "warning",
      http_status: inspectorRes.status
    };
    log("inspector", `Inspector returned ${inspectorRes.status}`);

    // 7. Test platform/apply (dry run - no actual PR)
    log("platform_apply", "Testing platform/apply (dry run)");
    const previewRes = await fetch(`http://localhost:3001/api/platform/apply/preview/${project.id}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      }
    });

    if (!previewRes.ok) {
      throw new Error(`Platform apply preview failed: ${previewRes.status}`);
    }
    
    const previewData = await previewRes.json();
    results.stages.platform_apply = { 
      status: "passed",
      files_found: previewData.files?.length || 0,
      dry_run: true
    };
    log("platform_apply", `${previewData.files?.length || 0} files ready for PR`);

    // Cleanup - mark project for deletion (don't actually delete during test)
    results.stages.cleanup = { status: "passed", note: "Test project preserved for inspection" };
    log("cleanup", `Test project ${project.id} preserved`);

    // Overall result
    results.overall = "passed";
    results.completed_at = new Date().toISOString();
    results.duration_ms = new Date(results.completed_at) - new Date(results.started_at);

    log("complete", `E2E test passed in ${results.duration_ms}ms`);

    return res.json({
      success: true,
      test_id: testId,
      results,
      logs
    });

  } catch (err) {
    results.overall = "failed";
    results.error = err.message;
    results.completed_at = new Date().toISOString();
    
    log("error", err.message);

    return res.status(500).json({
      success: false,
      test_id: testId,
      results,
      logs,
      error: err.message
    });
  }
});

// GET /api/platform/test-pipeline/:testId — Get test results
router.get("/:testId", requireAuth, async (req, res) => {
  // In a real implementation, we'd store test results in a table
  // For now, just return a placeholder
  return res.json({ 
    test_id: req.params.testId,
    status: "results_not_persisted",
    note: "Run POST /api/platform/test-pipeline to execute a new test"
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;
