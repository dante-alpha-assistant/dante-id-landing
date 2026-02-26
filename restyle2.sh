#!/bin/bash
set -e
cd /tmp/swarm/md3/wp-4/src/pages

FILES="Refinery.jsx Foundry.jsx Planner.jsx Builder.jsx Inspector.jsx Deployer.jsx Validator.jsx Iterate.jsx"

for f in $FILES; do
  echo "=== $f ==="
  
  # ─── Remove glow/caret styles ───
  sed -i "s/ style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}//g" "$f"
  sed -i "s/ style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}//g" "$f"
  sed -i "s/style={{ caretColor: '#33ff00' }}//g" "$f"
  sed -i "s/const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }//g" "$f"
  sed -i "s/ style={glowStyle}//g" "$f"

  # ─── Background colors ───
  sed -i "s/bg-\[#0a0a0a\]/bg-md-background/g" "$f"
  sed -i "s/bg-\[#0f0f0f\]/bg-md-surface-container/g" "$f"
  sed -i "s/bg-\[#0d0d0d\]/bg-md-surface-variant/g" "$f"
  sed -i "s/bg-\[#050505\]/bg-md-surface-variant/g" "$f"
  sed -i "s/bg-\[#111\]/bg-md-surface-container/g" "$f"
  sed -i "s/bg-black\/70/bg-black\/40/g" "$f"
  sed -i "s/bg-black\/80/bg-black\/40/g" "$f"

  # ─── Text colors ───
  sed -i "s/text-\[#33ff00\]/text-md-primary/g" "$f"
  sed -i "s/text-\[#22aa00\]/text-md-on-surface-variant/g" "$f"
  sed -i "s/text-\[#1a6b1a\]/text-md-outline/g" "$f"
  sed -i "s/text-\[#0f3f0f\]/text-md-outline/g" "$f"
  sed -i "s/text-\[#ffb000\]/text-amber-500/g" "$f"
  sed -i "s/text-\[#ff3333\]/text-red-500/g" "$f"
  sed -i "s/text-\[#33aaff\]/text-blue-500/g" "$f"
  sed -i "s/text-\[#555\]/text-md-outline/g" "$f"
  sed -i "s/text-\[#888\]/text-md-outline/g" "$f"
  sed -i "s/text-red-400/text-red-500/g" "$f"
  sed -i "s/text-yellow-400/text-amber-500/g" "$f"

  # ─── Border colors ───
  sed -i "s/border-\[#1f521f\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#33ff00\]/border-md-primary/g" "$f"
  sed -i "s/border-\[#333\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#0a0a0a\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#0f0f0f\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#1a6b1a\]/border-md-outline/g" "$f"
  sed -i "s/border-\[#ffb000\]/border-amber-500/g" "$f"
  sed -i "s/border-\[#ff3333\]/border-red-500/g" "$f"
  sed -i "s/border-red-400/border-red-500/g" "$f"
  sed -i "s/border-l-\[#33ff00\]/border-l-md-primary/g" "$f"

  # ─── Accent bg tints ───
  sed -i "s/bg-\[#33ff00\]\/10/bg-md-primary\/10/g" "$f"
  sed -i "s/bg-\[#33ff00\]\/5/bg-md-primary\/5/g" "$f"
  sed -i "s/bg-\[#ffb000\]\/10/bg-amber-500\/10/g" "$f"
  sed -i "s/bg-\[#ff3333\]\/10/bg-red-500\/10/g" "$f"
  sed -i "s/bg-\[#ff3333\]\/5/bg-red-500\/5/g" "$f"
  sed -i "s/bg-\[#33aaff\]\/10/bg-blue-500\/10/g" "$f"
  sed -i "s/bg-\[#1a6b1a\]\/10/bg-md-outline\/10/g" "$f"
  sed -i "s/bg-\[#33ff00\]/bg-md-primary/g" "$f"

  # ─── Hover states ───
  sed -i "s/hover:bg-\[#33ff00\]/hover:bg-md-primary/g" "$f"
  sed -i "s/hover:text-\[#0a0a0a\]/hover:text-md-on-primary/g" "$f"
  sed -i "s/hover:text-\[#33ff00\]/hover:text-md-primary/g" "$f"
  sed -i "s/hover:border-\[#33ff00\]/hover:border-md-primary/g" "$f"
  sed -i "s/hover:bg-\[#ffb000\]/hover:bg-amber-500/g" "$f"
  sed -i "s/hover:bg-\[#ff3333\]/hover:bg-red-500/g" "$f"
  sed -i "s/hover:border-\[#ff3333\]/hover:border-red-500/g" "$f"
  sed -i "s/hover:text-\[#ff3333\]/hover:text-red-500/g" "$f"
  sed -i "s/hover:text-\[#22aa00\]/hover:text-md-on-surface-variant/g" "$f"

  # ─── Focus + placeholder ───
  sed -i "s/focus:border-\[#33ff00\]/focus:border-md-primary/g" "$f"
  sed -i "s/placeholder-\[#1a6b1a\]/placeholder-md-outline/g" "$f"

  # ─── Remaining raw values ───
  sed -i "s/text-\[#0a0a0a\]/text-md-on-primary/g" "$f"

  # ─── Code syntax highlight colors (Builder only) ───
  sed -i "s/color: #33ff00/color: var(--md-primary, #6750A4)/g" "$f"
  sed -i "s/color: #ffb000/color: var(--md-tertiary, #7D5260)/g" "$f"
  sed -i "s/color: #1a6b1a/color: var(--md-outline, #79747E)/g" "$f"

  # ─── terminal-blink → animate-pulse ───
  sed -i 's/terminal-blink/animate-pulse/g' "$f"

  # ─── Remove font-mono from page-level ───
  sed -i "s/min-h-screen bg-md-background text-md-primary font-mono/min-h-screen bg-md-background text-md-on-surface/g" "$f"
  # Remove remaining font-mono (except in pre/code contexts which we'll re-add)
  sed -i 's/ font-mono//g' "$f"

  # ─── transition → ease-md-standard ───
  sed -i 's/transition-colors/transition-all ease-md-standard duration-300/g' "$f"

  # ─── Cards: add rounded-md-lg shadow ───
  sed -i 's/bg-md-surface-container border border-md-outline-variant p-4/bg-md-surface-container rounded-md-lg p-4 shadow-sm/g' "$f"
  sed -i 's/bg-md-surface-container border border-md-outline-variant p-3/bg-md-surface-container rounded-md-lg p-3 shadow-sm/g' "$f"
  sed -i 's/bg-md-surface-container border border-md-outline-variant p-6/bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md/g' "$f"
  sed -i 's/bg-md-surface-container border border-md-outline-variant p-8/bg-md-surface-container rounded-md-lg p-8 shadow-sm/g' "$f"
  sed -i 's/bg-md-surface-container border border-md-outline-variant p-2/bg-md-surface-container rounded-md-lg p-2 shadow-sm/g' "$f"
  sed -i 's/bg-md-surface-container border border-md-outline-variant p-12/bg-md-surface-container rounded-md-lg p-12 shadow-sm/g' "$f"
  
  # Non-bg cards
  sed -i 's/border border-md-outline-variant p-4/border border-md-outline-variant rounded-md-lg p-4/g' "$f"
  sed -i 's/border border-md-outline-variant p-3/border border-md-outline-variant rounded-md-lg p-3/g' "$f"
  sed -i 's/border border-md-outline-variant p-6/border border-md-outline-variant rounded-md-lg p-6/g' "$f"
  sed -i 's/border border-md-outline-variant p-2/border border-md-outline-variant rounded-md-lg p-2/g' "$f"
  sed -i 's/border border-md-outline-variant p-12/border border-md-outline-variant rounded-md-lg p-12/g' "$f"

  # ─── Remove bracket decorators from UI text ───
  # Button labels
  sed -i 's/\[ DASHBOARD \]/Dashboard/g' "$f"
  sed -i 's/\[ GENERATE PRD \]/Generate PRD/g' "$f"
  sed -i 's/\[ REFINE \]/Refine/g' "$f"
  sed -i 's/\[ EXPAND \]/Expand/g' "$f"
  sed -i 's/\[ CHALLENGE \]/Challenge/g' "$f"
  sed -i 's/\[ GO \]/Go/g' "$f"
  sed -i 's/\[ EXTRACT FEATURES \]/Extract Features/g' "$f"
  sed -i 's/\[ GENERATE BLUEPRINT \]/Generate Blueprint/g' "$f"
  sed -i 's/\[ REGENERATE \]/Regenerate/g' "$f"
  sed -i 's/\[ BUILD \]/Build/g' "$f"
  sed -i 's/\[ RUN ALL \]/Run All/g' "$f"
  sed -i 's/\[ RUN \]/Run/g' "$f"
  sed -i 's/\[ GENERATE CODE \]/Generate Code/g' "$f"
  sed -i 's/\[ GENERATE ALL WORK ORDERS \]/Generate All Work Orders/g' "$f"
  sed -i 's/\[ GENERATE WORK ORDERS \]/Generate Work Orders/g' "$f"
  sed -i "s/\[ DEPLOY > \]/Deploy/g" "$f"
  sed -i "s/\[ DEPLOY BLOCKED \]/Deploy Blocked/g" "$f"
  sed -i "s/\[ DEPLOYING... \]/Deploying.../g" "$f"
  sed -i 's/\[ ROLLBACK \]/Rollback/g' "$f"
  sed -i 's/\[ CANCEL \]/Cancel/g' "$f"
  sed -i 's/\[ CREATE \]/Create/g' "$f"
  sed -i "s/\[ CREATING... \]/Creating.../g" "$f"
  sed -i 's/\[ SUBMIT \]/Submit/g' "$f"
  sed -i "s/\[ + NEW FEEDBACK \]/+ New Feedback/g" "$f"
  sed -i 's/\[ RESOLVE \]/Resolve/g' "$f"
  sed -i 's/\[ REOPEN \]/Reopen/g' "$f"
  sed -i "s/\[ ITERATE → \]/Iterate →/g" "$f"
  sed -i "s/\[ ITERATING... \]/Iterating.../g" "$f"
  sed -i 's/\[ RUN TESTS \]/Run Tests/g' "$f"
  sed -i "s/\[ → RUN TESTS \]/→ Run Tests/g" "$f"
  sed -i "s/\[ GETTING FIXES... \]/Getting Fixes.../g" "$f"
  sed -i "s/\[ GET FIX SUGGESTIONS \]/Get Fix Suggestions/g" "$f"
  sed -i "s/\[ WONT FIX \]/Won't Fix/g" "$f"
  sed -i 's/\[ VERCEL \]/Vercel/g' "$f"
  sed -i 's/\[ GITHUB \]/GitHub/g' "$f"
  sed -i 's/\[ CUSTOM \]/Custom/g' "$f"
  sed -i "s/\[ GENERATE ALL ({missingCount}) \]/Generate All ({missingCount})/g" "$f"
  sed -i "s/\[ BUILD ALL ({eligibleCount}) \]/Build All ({eligibleCount})/g" "$f"
  sed -i "s/\[ GENERATE ALL ARCHITECTURE \]/Generate All Architecture/g" "$f"
  sed -i "s/\[ GENERATING... \]/Generating.../g" "$f"
  sed -i "s/\[ GENERATE FOUNDATION FIRST \]/Generate Foundation First/g" "$f"
  sed -i "s/\[ GENERATE SYSTEM DIAGRAMS \]/Generate System Diagrams/g" "$f"
  sed -i "s/\[ ANALYZE → GENERATE TICKETS ({openCount}) \]/Analyze \& Generate Tickets ({openCount})/g" "$f"
  sed -i "s/\[ VALIDATOR: Submit Feedback \]/Validator: Submit Feedback/g" "$f"

  # CTA buttons
  sed -i "s/\[ CONTINUE → FOUNDRY: Generate Blueprints \]/Continue to Foundry →/g" "$f"
  sed -i "s/\[ CONTINUE → BUILDER: Generate Code \]/Continue to Builder →/g" "$f"
  sed -i "s/\[ CONTINUE → INSPECTOR: Run Tests \]/Continue to Inspector →/g" "$f"
  sed -i "s/\[ CONTINUE → DEPLOYER: Ship It \]/Continue to Deployer →/g" "$f"
  sed -i "s/\[ CONTINUE → SYSTEM DIAGRAMS \]/Continue to System Diagrams →/g" "$f"
  sed -i "s/\[ CONTINUE → FEATURE BLUEPRINTS \]/Continue to Feature Blueprints →/g" "$f"
  sed -i "s/\[ VIEW GENERATED TICKETS IN PLANNER \]/View Generated Tickets in Planner/g" "$f"

  # Loading/status text
  sed -i 's/\[LOADING...\]/Loading.../g' "$f"
  sed -i 's/\[LOADING INSPECTOR...\]/Loading.../g' "$f"
  sed -i 's/\[PROCESSING...\]/Processing.../g' "$f"
  sed -i 's/\[GENERATING...\]/Generating.../g' "$f"
  sed -i 's/\[PLANNING...\]/Planning.../g' "$f"
  sed -i 's/\[RUNNING TESTS...\]/Running tests.../g' "$f"
  sed -i 's/\[ANALYZING FEEDBACK...\]/Analyzing feedback.../g' "$f"
  sed -i "s/\[UNTESTED\] No test/No test/g" "$f"

  # Status labels in objects
  sed -i "s/text: '\[CRITICAL\]'/text: 'Critical'/g" "$f"
  sed -i "s/text: '\[HIGH\]'/text: 'High'/g" "$f"
  sed -i "s/text: '\[MEDIUM\]'/text: 'Medium'/g" "$f"
  sed -i "s/text: '\[LOW\]'/text: 'Low'/g" "$f"
  sed -i "s/text: '\[NICE\]'/text: 'Nice'/g" "$f"
  sed -i "s/text: '\[DRAFT\]'/text: 'Draft'/g" "$f"
  sed -i "s/text: '\[READY\]'/text: 'Ready'/g" "$f"
  sed -i "s/text: '\[IN-PROGRESS\]'/text: 'In Progress'/g" "$f"
  sed -i "s/text: '\[DONE\]'/text: 'Done'/g" "$f"
  sed -i "s/text: '\[PENDING\]'/text: 'Pending'/g" "$f"
  sed -i "s/text: '\[GENERATING...\]'/text: 'Generating'/g" "$f"
  sed -i "s/text: '\[REVIEW\]'/text: 'Review'/g" "$f"
  sed -i "s/text: '\[FAILED\]'/text: 'Failed'/g" "$f"
  sed -i "s/label: '\[UNTESTED\]'/label: 'Untested'/g" "$f"
  sed -i "s/label: '\[RUNNING...\]'/label: 'Running'/g" "$f"
  sed -i "s/label: '\[PASS\]'/label: 'Pass'/g" "$f"
  sed -i "s/label: '\[FAIL\]'/label: 'Fail'/g" "$f"
  sed -i "s/label: '\[WARN\]'/label: 'Warning'/g" "$f"
  sed -i "s/label: 'PENDING'/label: 'Pending'/g" "$f"
  sed -i "s/label: 'IN PROGRESS'/label: 'In Progress'/g" "$f"
  sed -i "s/label: 'DONE'/label: 'Done'/g" "$f"
  sed -i "s/label: 'BLOCKED'/label: 'Blocked'/g" "$f"
  sed -i "s/label: '\[BUG\]'/label: 'Bug'/g" "$f"
  sed -i "s/label: '\[IMPROVE\]'/label: 'Improve'/g" "$f"
  sed -i "s/label: '\[Q\]'/label: 'Question'/g" "$f"
  sed -i "s/label: '\[OK\]'/label: 'Approved'/g" "$f"

  # Terminal decorators
  sed -i "s/+--- PROJECT STATUS ---+/Project Status/g" "$f"
  sed -i "s/+----------------------+//g" "$f"
  sed -i "s/+--- DEPLOY CONSOLE ---+/Deploy Console/g" "$f"
  sed -i "s/+--- DEPLOYMENT HISTORY ---+/Deployment History/g" "$f"
  sed -i "s/+--------------------------+//g" "$f"
  sed -i "s/+--- DESCRIBE YOUR CHANGES ---+/Describe Your Changes/g" "$f"
  sed -i "s/+--- ITERATION HISTORY ---+/Iteration History/g" "$f"

  # Status bracket text in dynamic code
  sed -i "s/\[OK\] Blueprint/✓ Blueprint/g" "$f"
  sed -i "s/\[NONE\] No blueprint/No blueprint/g" "$f"
  sed -i "s/\[NO BUILD\]/No build/g" "$f"
  sed -i "s/\[AUTH\]/Auth/g" "$f"
  sed -i "s/\[WARN\] /⚠ /g" "$f"
  sed -i "s/\[ERROR\] /Error: /g" "$f"
  sed -i "s/\[FATAL\] /Fatal: /g" "$f"
  sed -i "s/\[DONE\]/✓ Done/g" "$f"
  sed -i "s/\[PASS\]/Passed/g" "$f"
  sed -i "s/\[BLOCK\]/Blocked/g" "$f"
  sed -i "s/\[PARTIAL\]/Partial/g" "$f"

  # List markers
  sed -i "s/{'>'}/•/g" "$f"

  # Selection indicators
  sed -i "s/{selectedFeature?.id === f.id ? '> ' : '  '}/{/g" "$f"
  sed -i "s/{isSelected ? '> ' : '  '}/{/g" "$f"

done
echo "Done!"
