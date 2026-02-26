#!/bin/bash
cd /tmp/swarm/md3/wp-4/src/pages

FILES="Refinery.jsx Foundry.jsx Planner.jsx Builder.jsx Inspector.jsx Deployer.jsx Validator.jsx Iterate.jsx"

for f in $FILES; do
  echo "Processing $f..."
  
  # Remove textShadow style props entirely
  sed -i "s/ style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}//g" "$f"
  sed -i "s/ style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}//g" "$f"
  sed -i "s/style={{ caretColor: '#33ff00' }}//g" "$f"
  sed -i "s/const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }//g" "$f"
  sed -i "s/ style={glowStyle}//g" "$f"
  
  # Background colors
  sed -i "s/bg-\[#0a0a0a\]/bg-md-background/g" "$f"
  sed -i "s/bg-\[#0f0f0f\]/bg-md-surface-container/g" "$f"
  sed -i "s/bg-\[#0d0d0d\]/bg-md-surface-variant/g" "$f"
  sed -i "s/bg-\[#050505\]/bg-md-surface-variant/g" "$f"
  sed -i "s/bg-\[#111\]/bg-md-surface-container/g" "$f"
  sed -i "s/bg-black\/70/bg-black\/40/g" "$f"
  sed -i "s/bg-black\/80/bg-black\/40/g" "$f"
  
  # Text colors
  sed -i "s/text-\[#33ff00\]/text-md-primary/g" "$f"
  sed -i "s/text-\[#22aa00\]/text-md-on-surface-variant/g" "$f"
  sed -i "s/text-\[#1a6b1a\]/text-md-outline/g" "$f"
  sed -i "s/text-\[#0f3f0f\]/text-md-outline/g" "$f"
  sed -i "s/text-\[#ffb000\]/text-amber-500/g" "$f"
  sed -i "s/text-\[#ff3333\]/text-red-500/g" "$f"
  sed -i "s/text-\[#33aaff\]/text-blue-500/g" "$f"
  sed -i "s/text-\[#555\]/text-md-outline/g" "$f"
  sed -i "s/text-\[#888\]/text-md-outline/g" "$f"
  
  # Border colors
  sed -i "s/border-\[#1f521f\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#33ff00\]/border-md-primary/g" "$f"
  sed -i "s/border-\[#333\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#0a0a0a\]/border-md-outline-variant/g" "$f"
  sed -i "s/border-\[#0f0f0f\]/border-md-outline-variant/g" "$f"
  
  # Accent bg tints
  sed -i "s/bg-\[#33ff00\]\/10/bg-md-primary\/10/g" "$f"
  sed -i "s/bg-\[#33ff00\]\/5/bg-md-primary\/5/g" "$f"
  sed -i "s/bg-\[#ffb000\]\/10/bg-amber-500\/10/g" "$f"
  sed -i "s/bg-\[#ff3333\]\/10/bg-red-500\/10/g" "$f"
  sed -i "s/bg-\[#ff3333\]\/5/bg-red-500\/5/g" "$f"
  sed -i "s/bg-\[#33aaff\]\/10/bg-blue-500\/10/g" "$f"
  sed -i "s/bg-\[#1a6b1a\]\/10/bg-md-outline\/10/g" "$f"
  
  # Hover on green bg
  sed -i "s/hover:bg-\[#33ff00\]/hover:bg-md-primary/g" "$f"
  sed -i "s/hover:text-\[#0a0a0a\]/hover:text-md-on-primary/g" "$f"
  sed -i "s/hover:text-\[#33ff00\]/hover:text-md-primary/g" "$f"
  sed -i "s/hover:border-\[#33ff00\]/hover:border-md-primary/g" "$f"
  sed -i "s/hover:bg-\[#ffb000\]/hover:bg-amber-500/g" "$f"
  sed -i "s/hover:bg-\[#ff3333\]/hover:bg-red-500/g" "$f"
  sed -i "s/hover:border-\[#ff3333\]/hover:border-red-500/g" "$f"
  sed -i "s/hover:text-\[#ff3333\]/hover:text-red-500/g" "$f"
  
  # Active tab green bg with dark text  
  sed -i "s/bg-\[#33ff00\]/bg-md-primary/g" "$f"
  sed -i "s/text-\[#0a0a0a\]/text-md-on-primary/g" "$f"
  
  # Border accent colors
  sed -i "s/border-\[#ffb000\]/border-amber-500/g" "$f"
  sed -i "s/border-\[#ff3333\]/border-red-500/g" "$f"
  sed -i "s/border-red-400/border-red-500/g" "$f"
  sed -i "s/text-red-400/text-red-500/g" "$f"
  sed -i "s/text-yellow-400/text-amber-500/g" "$f"
  
  # Placeholder colors
  sed -i "s/placeholder-\[#1a6b1a\]/placeholder-md-outline/g" "$f"
  
  # Focus styles
  sed -i "s/focus:border-\[#33ff00\]/focus:border-md-primary/g" "$f"
  
  # Border left accent
  sed -i "s/border-l-\[#33ff00\]/border-l-md-primary/g" "$f"
  
  # Remove font-mono from top-level containers (but keep in code blocks)
  # We'll be more surgical about this
  sed -i 's/text-\[#33ff00\] font-mono terminal-blink/text-md-primary animate-pulse/g' "$f"
  sed -i 's/terminal-blink/animate-pulse/g' "$f"
  
  # Remove font-mono from the main page wrapper
  sed -i "s/min-h-screen bg-md-background text-md-primary font-mono/min-h-screen bg-md-background text-md-on-surface/g" "$f"
  
  # Remove bracket decorators from button text
  sed -i "s/\[ DASHBOARD \]/Dashboard/g" "$f"
  sed -i "s/\[ GENERATE PRD \]/Generate PRD/g" "$f"
  sed -i "s/\[ REFINE \]/Refine/g" "$f"
  sed -i "s/\[ EXPAND \]/Expand/g" "$f"
  sed -i "s/\[ CHALLENGE \]/Challenge/g" "$f"
  sed -i "s/\[ GO \]/Go/g" "$f"
  sed -i "s/\[ EXTRACT FEATURES \]/Extract Features/g" "$f"
  sed -i "s/\[ GENERATE BLUEPRINT \]/Generate Blueprint/g" "$f"
  sed -i "s/\[ REGENERATE \]/Regenerate/g" "$f"
  sed -i "s/\[ GENERATE ALL ({missingCount}) \]/Generate All ({missingCount})/g" "$f"
  sed -i "s/\[ BUILD ALL ({eligibleCount}) \]/Build All ({eligibleCount})/g" "$f"
  sed -i "s/\[ BUILD \]/Build/g" "$f"
  sed -i "s/\[ RUN ALL \]/Run All/g" "$f"
  sed -i "s/\[ RUN \]/Run/g" "$f"
  sed -i "s/\[ GENERATE CODE \]/Generate Code/g" "$f"
  sed -i "s/\[ GENERATE ALL WORK ORDERS \]/Generate All Work Orders/g" "$f"
  sed -i "s/\[ GENERATE WORK ORDERS \]/Generate Work Orders/g" "$f"
  sed -i "s/\[ DEPLOY > \]/Deploy/g" "$f"
  sed -i "s/\[ DEPLOY BLOCKED \]/Deploy Blocked/g" "$f"
  sed -i "s/\[ DEPLOYING... \]/Deploying.../g" "$f"
  sed -i "s/\[ ROLLBACK \]/Rollback/g" "$f"
  sed -i "s/\[ CANCEL \]/Cancel/g" "$f"
  sed -i "s/\[ CREATE \]/Create/g" "$f"
  sed -i "s/\[ CREATING... \]/Creating.../g" "$f"
  sed -i "s/\[ SUBMIT \]/Submit/g" "$f"
  sed -i "s/\[ + NEW FEEDBACK \]/+ New Feedback/g" "$f"
  sed -i "s/\[ RESOLVE \]/Resolve/g" "$f"
  sed -i "s/\[ REOPEN \]/Reopen/g" "$f"
  sed -i "s/\[ ITERATE → \]/Iterate →/g" "$f"
  sed -i "s/\[ ITERATING... \]/Iterating.../g" "$f"
  sed -i "s/\[ RUN TESTS \]/Run Tests/g" "$f"
  sed -i "s/\[ → RUN TESTS \]/→ Run Tests/g" "$f"
  sed -i "s/\[ GETTING FIXES... \]/Getting Fixes.../g" "$f"
  sed -i "s/\[ GET FIX SUGGESTIONS \]/Get Fix Suggestions/g" "$f"
  sed -i "s/\[ WONT FIX \]/Won't Fix/g" "$f"
  sed -i "s/\[LOADING...\]/Loading.../g" "$f"
  sed -i "s/\[LOADING INSPECTOR...\]/Loading.../g" "$f"
  sed -i "s/\[LOADING...\]/Loading.../g" "$f"
  sed -i "s/\[PROCESSING...\]/Processing.../g" "$f"
  sed -i "s/\[GENERATING...\]/Generating.../g" "$f"
  sed -i "s/\[PLANNING...\]/Planning.../g" "$f"
  sed -i "s/\[RUNNING TESTS...\]/Running tests.../g" "$f"
  sed -i "s/\[ANALYZING FEEDBACK...\]/Analyzing feedback.../g" "$f"
  sed -i "s/\[ LOADING... \]/Loading.../g" "$f"
  sed -i "s/\[UNTESTED\]/Untested/g" "$f"
  
  # Remove terminal decorators like +--- ... ---+
  sed -i "s/+--- PROJECT STATUS ---+/Project Status/g" "$f"
  sed -i "s/+----------------------+//g" "$f"
  sed -i "s/+--- DEPLOY CONSOLE ---+/Deploy Console/g" "$f"
  sed -i "s/+--- DEPLOYMENT HISTORY ---+/Deployment History/g" "$f"
  sed -i "s/+--------------------------+//g" "$f"
  sed -i "s/+--- DESCRIBE YOUR CHANGES ---+/Describe Your Changes/g" "$f"
  sed -i "s/+--- ITERATION HISTORY ---+/Iteration History/g" "$f"
  
  # Card styling: add rounded-md-lg where we have bg-md-surface-container
  # Buttons: make rounded-full with proper padding
  # These need more targeted fixes - we'll handle in the per-file pass
  
  # Remove '>' prefix decorators
  # sed -i "s/{'>'}/•/g" "$f"  # Can cause issues, skip for now
  
  echo "Done $f"
done

echo "All files processed!"
