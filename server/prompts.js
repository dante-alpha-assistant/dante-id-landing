/**
 * Dante.id AI Deliverables - Prompt Templates v2
 * Adapted from Beta's improved prompts with system/user split for generate.js
 */

const BRAND_IDENTITY_SCHEMA = `{
  "name_suggestions": [{"name": "string", "rationale": "string"}],
  "color_palette": {
    "primary": {"hex": "#HEX", "emotion": "string"},
    "secondary": {"hex": "#HEX", "emotion": "string"},
    "accent": {"hex": "#HEX", "emotion": "string"},
    "background": {"hex": "#HEX", "emotion": "string"},
    "text": {"hex": "#HEX", "emotion": "string"}
  },
  "typography": {
    "heading": {"font": "string", "rationale": "string"},
    "body": {"font": "string", "rationale": "string"},
    "fallback": "system-ui, -apple-system, sans-serif"
  },
  "taglines": [{"type": "emotional|descriptive|provocative", "text": "string"}],
  "brand_voice": {
    "adjectives": ["string"],
    "speaks_like": "string",
    "examples": ["string"]
  }
}`;

const LANDING_PAGE_SCHEMA = `{
  "meta": {"title": "string", "description": "string"},
  "navbar": {"logo_text": "string", "links": ["string"]},
  "hero": {"headline": "string", "subheadline": "string", "cta_text": "string", "cta_secondary": "string"},
  "social_proof_bar": {"text": "string", "logos": ["string"]},
  "problem": {"headline": "string", "subheadline": "string", "pain_points": [{"icon": "emoji", "title": "string", "description": "string"}]},
  "solution": {"headline": "string", "description": "string"},
  "features": [{"headline": "string", "description": "string", "icon": "emoji"}],
  "how_it_works": {"headline": "string", "steps": [{"step": "number", "title": "string", "description": "string"}]},
  "pricing": {"headline": "string", "subheadline": "string", "plans": [{"name": "string", "price": "string", "period": "string", "description": "string", "features": ["string"], "cta": "string", "highlighted": "boolean"}]},
  "testimonials": [{"quote": "string", "author": "string", "role": "string", "metric": "string"}],
  "faq": [{"question": "string", "answer": "string"}],
  "final_cta": {"headline": "string", "subheadline": "string", "cta_text": "string"}
}`;

const BUSINESS_PLAN_SCHEMA = `{
  "executive_summary": "string",
  "problem": {"description": "string", "affected": "string", "quantified_pain": "string", "current_solutions": ["string"], "root_cause": "string"},
  "solution": {"core_value_prop": "string", "key_capabilities": ["string"], "differentiation": "string", "insight": "string"},
  "target_market": {"primary": {"persona": "string", "characteristics": ["string"], "market_size": "string"}, "secondary": ["string"], "early_adopters": {"description": "string", "where_to_find": "string"}},
  "revenue_model": {"primary_stream": {"model": "string", "pricing": "string", "rationale": "string", "estimated_ltv": "string"}, "unit_economics": {"estimated_cac": "string", "gross_margin": "string", "payback_period": "string"}},
  "competitive_landscape": {"direct_competitors": [{"name": "string", "does": "string", "weakness": "string"}], "indirect_competitors": ["string"], "differentiation": ["string"]},
  "go_to_market": {"channels": [{"channel": "string", "strategy": "string", "estimated_cost": "string"}], "launch_strategy": "string"},
  "milestones": {"q1": {"focus": "string", "goals": ["string"]}, "q2": {"focus": "string", "goals": ["string"]}, "q3": {"focus": "string", "goals": ["string"]}, "q4": {"focus": "string", "goals": ["string"]}},
  "success_metrics": {"north_star": "string", "leading_indicators": ["string"], "lagging_indicators": ["string"]}
}`;

const GROWTH_STRATEGY_SCHEMA = `{
  "channel_strategy": [{"channel": "string", "priority": 1, "why_it_fits": "string", "tactics": ["string"], "estimated_cac": "string", "time_investment": "string", "success_metric": "string", "red_flags": ["string"]}],
  "ninety_day_plan": {"week_1_2": {"focus": "string", "actions": [{"task": "string", "success": "string", "hours": 2}]}, "week_3_4": {"focus": "string", "actions": []}, "week_5_8": {"focus": "string", "actions": []}, "week_9_12": {"focus": "string", "actions": []}},
  "content_strategy": {"pillars": [{"theme": "string", "addresses": "string", "content_types": ["string"]}], "headline_examples": ["string"]},
  "metrics": {"north_star": {"metric": "string", "target_90_days": "string"}, "weekly": [{"metric": "string", "week_4_target": "string", "week_8_target": "string", "week_12_target": "string"}], "red_flags": ["string"]},
  "budget_allocation": {"500": {"breakdown": {}, "expected_outcome": "string"}, "1000": {"breakdown": {}, "expected_outcome": "string"}, "5000": {"breakdown": {}, "expected_outcome": "string"}},
  "quick_wins": [{"action": "string", "time": "string", "impact": "string"}],
  "launch_tactics": {"soft_launch": {"who": "string", "how": "string"}, "public_launch": {"platforms": ["string"], "timing": "string"}, "growth_loops": ["string"]}
}`;

const PERSONAL_BRAND_SCHEMA = `{
  "twitter_thread": [{"tweet_number": 1, "content": "string", "type": "hook|story|insight|proof|cta"}],
  "linkedin_post": {"headline": "string", "body": "string", "hashtags": ["string"]},
  "product_hunt": {"tagline": "string", "description": "string", "maker_comment": "string", "topics": ["string"]},
  "founder_bio": {"short": "string", "long": "string"},
  "elevator_pitch": {"30_seconds": "string", "60_seconds": "string"}
}`;

const PITCH_DECK_SCHEMA = `{
  "slides": [
    {
      "number": 1,
      "type": "title|problem|solution|market|product|traction|business_model|competition|team|ask",
      "title": "string",
      "bullets": ["string"],
      "speaker_notes": "string",
      "visual_suggestion": "string"
    }
  ],
  "narrative_arc": "string"
}`;

const COMPETITOR_ANALYSIS_SCHEMA = `{
  "market_overview": {"size": "string", "growth_rate": "string", "key_trends": ["string"]},
  "competitors": [
    {
      "name": "string",
      "website": "string",
      "founded": "string",
      "funding": "string",
      "headquarters": "string",
      "target_audience": "string",
      "key_features": ["string"],
      "pricing": {"model": "string", "details": "string", "starting_price": "string"},
      "strengths": ["string"],
      "weaknesses": ["string"],
      "positioning": "string"
    }
  ],
  "comparison_matrix": {
    "features": ["string"],
    "rows": [{"competitor": "string", "cells": [{"feature": "string", "value": "string", "advantage": "boolean"}]}]
  },
  "gaps_opportunities": ["string"],
  "differentiation_strategy": "string"
}`;

function getPrompts(type, { idea, stage, needs, company_name, full_name }) {
  const context = `Company: ${company_name || '(to be determined)'}\nFounder: ${full_name || 'Unknown'}\nIdea: ${idea}\nStage: ${stage || 'idea'}\nNeeds: ${needs || 'general guidance'}`;

  const templates = {
    brand_identity: {
      system: `You are an elite brand strategist who creates distinctive, memorable brand identities. Every element MUST be specific to the startup's idea and market — no generic suggestions. Return ONLY valid JSON matching this schema: ${BRAND_IDENTITY_SCHEMA}`,
      user: `Create a complete brand identity for this startup:

${context}

Requirements:
- 3 evocative name suggestions (2-3 syllables, no generic suffixes like "-ly" or "-ify") with rationale for each
- 5-color palette with hex codes and emotional rationale (primary, secondary, accent, background, text)
- Typography: heading + body fonts with justification for why they match this brand
- 3 taglines: emotional (connects to aspiration), descriptive (clear value), provocative (challenges assumptions) — max 8 words each
- Brand voice: 3 specific adjectives, a "speaks like" comparison, and 2 example sentences

The name suggestions MUST reference "${idea}". The taglines MUST be about what "${company_name || 'this startup'}" actually does. No filler.`
    },

    landing_page: {
      system: `You are a world-class landing page copywriter and conversion expert. Return ONLY valid JSON — no markdown, no code fences, no explanation. Schema: ${LANDING_PAGE_SCHEMA}. All string values must be plain text. Keep descriptions concise (under 120 chars). Pricing plans must have realistic prices for the industry.`,
      user: `Create a COMPLETE, production-quality landing page for:

${context}

Generate ALL of these sections:

1. NAVBAR: company logo text + 5 navigation link labels (Features, Pricing, How It Works, FAQ, Get Started)
2. HERO: headline using "[Achieve outcome] without [pain]" formula referencing "${idea}". Subheadline with who+what+why. Primary CTA and secondary CTA text.
3. SOCIAL PROOF BAR: "Trusted by X+ founders/users" text + 3-4 placeholder company/brand names
4. PROBLEM: headline, subheadline, 3 pain points with emoji icons — each about a real frustration for "${idea}" customers
5. SOLUTION: headline + 2-3 sentence description of how "${company_name || 'this product'}" solves the problem
6. FEATURES: exactly 4 feature cards with emoji icon, headline, description (benefit-focused, not feature-focused)
7. HOW IT WORKS: headline + exactly 3 numbered steps explaining the user journey
8. PRICING: headline, subheadline, 3 plans (Starter/free, Pro, Enterprise) with realistic prices for this industry, 4-5 features each, CTA text. Mark the middle plan as highlighted.
9. TESTIMONIALS: 3 testimonial quotes with author name, role/company, and a specific metric
10. FAQ: 6 questions and answers that a potential customer of "${idea}" would actually ask
11. FINAL CTA: compelling headline + subheadline + CTA button text

Make every word specific to "${company_name || 'this startup'}" and "${idea}". No generic copy.`
    },

    business_plan: {
      system: `You are a startup advisor who creates lean, actionable business plans. Be specific: name real competitors, give realistic estimates, acknowledge risks. No fluff or generic advice. Return ONLY valid JSON matching this schema: ${BUSINESS_PLAN_SCHEMA}`,
      user: `Create a lean business plan for:

${context}

Requirements:
- Executive summary: 3-4 sentences (hook, solution, timing, stage)
- Problem: WHO has this problem, quantified pain (time/money), current solutions and why they fail
- Solution: Core value prop in one sentence, 3-4 capabilities, key insight
- Target market: Specific persona with market size, early adopters and where to find first 100 customers
- Revenue model: Pricing with rationale, estimated LTV, unit economics (CAC, gross margin, payback)
- Competitive landscape: Name 2-3 REAL competitors with specific weaknesses, your differentiation
- Go-to-market: 2-3 channels with WHY they work for "${idea}", cost per channel
- 12-month milestones: Quarterly goals with specific targets
- Metrics: North star + 3-4 leading indicators + 2-3 lagging indicators

Be realistic and honest. Conservative estimates over inflated projections. This is for "${company_name || 'this startup'}" building "${idea}".`
    },

    growth_strategy: {
      system: `You are a tactical growth strategist. Create week-by-week playbooks, not high-level strategies. Every tactic must be specific enough to execute TODAY. Anti-patterns to avoid: vague advice like "post on social media", ignoring CAC, no timelines. Return ONLY valid JSON matching this schema: ${GROWTH_STRATEGY_SCHEMA}`,
      user: `Create a 90-day tactical growth strategy for:

${context}

${stage === 'idea' ? 'STAGE FOCUS: Validation — goal is 10 conversations with potential customers, not growth.' : stage === 'prototype' || stage === 'mvp' ? 'STAGE FOCUS: First customers — goal is first $1,000 in revenue.' : 'STAGE FOCUS: Scalable growth — predictable acquisition channels.'}

Requirements:
- Top 3 growth channels: WHY each fits "${idea}", specific tactics (not "post on LinkedIn" but "daily posts at 8am targeting [persona] with [content type]"), estimated CAC, hours/week, success metric, red flags for when to quit
- 90-day week-by-week plan: Foundation (wk 1-2), Channel Test (wk 3-4), Scale or Pivot (wk 5-8), Systematize (wk 9-12) — each week needs 2-3 specific actions with time estimates
- Content strategy: 3-4 pillars, 5+ specific headline examples for "${idea}", publishing frequency
- Metrics dashboard: North star + 90-day target, weekly leading indicators with targets at week 4/8/12
- Budget allocation for 3 tiers: $500/mo (bootstrap), $1K/mo (growth), $5K/mo (scale) — specific tools and expected outcomes
- 5-10 quick wins: <2 hours each, $0 cost, immediate results
- Launch tactics: soft launch (who + how), public launch (platforms + timing), growth loops

Make every tactic specific to "${company_name || 'this startup'}" and "${idea}". No generic advice.`
    },

    personal_brand: {
      system: `You are a personal branding and launch copywriter. You write viral Twitter threads, compelling LinkedIn posts, and Product Hunt copy that converts. Your tone is authentic, building-in-public, founder-to-founder. Return ONLY valid JSON matching this schema: ${PERSONAL_BRAND_SCHEMA}. No markdown, no code fences.`,
      user: `Create a full personal branding launch kit for:

${context}

Generate ALL of these:

1. **TWITTER/X LAUNCH THREAD** (6 tweets):
   - Tweet 1: Hook — pattern-interrupt, make people stop scrolling. Reference "${idea}" directly.
   - Tweet 2: The problem — pain point in customer's language
   - Tweet 3: The "aha" moment — why "${full_name || 'the founder'}" decided to build this
   - Tweet 4: What makes "${company_name || 'this product'}" different (specific, not generic)
   - Tweet 5: Social proof or early traction (realistic for stage: ${stage || 'idea'})
   - Tweet 6: CTA — link to landing page, ask for feedback/signups

2. **LINKEDIN LAUNCH POST**: Professional storytelling. Start with a hook line, then the journey, what you built, what's next. Include 3-5 hashtags. 200-300 words.

3. **PRODUCT HUNT COPY**: Punchy tagline (under 60 chars), 2-paragraph description, maker's comment (personal, authentic). Include 3 topic tags.

4. **FOUNDER BIO**: Short version (1 sentence, for Twitter/socials) and long version (1 paragraph, for about pages).

5. **ELEVATOR PITCH**: 30-second and 60-second versions.

Every word must be about "${company_name || 'this startup'}" building "${idea}". No filler. Write like a founder who's excited but not cringey.`
    },

    pitch_deck: {
      system: `You are a venture capital advisor who creates compelling 10-slide pitch decks. You know what investors look for: clear problem, unique solution, big market, strong team, and a specific ask. Return ONLY valid JSON matching this schema: ${PITCH_DECK_SCHEMA}. Each slide should have 3-5 bullets max. Speaker notes should be conversational, not scripted.`,
      user: `Create a 10-slide pitch deck for:

${context}

Generate EXACTLY these 10 slides:

1. **TITLE**: Company name, one-line description, founder name, contact info placeholder
2. **PROBLEM**: What painful problem are you solving? Who has it? How big is the pain? 3-4 bullets, specific to "${idea}"
3. **SOLUTION**: Your product/service in 1-2 sentences. Key capabilities (3 bullets). Why now?
4. **MARKET**: TAM/SAM/SOM if known, or market size estimate. Growth trends. Why this market is attractive.
5. **PRODUCT**: How it works (3 steps). Demo/walkthrough suggestion. Key features (3-4 bullets).
6. **TRACTION**: Current status for stage ${stage || 'idea'}. Metrics if any, milestones achieved, what's next.
7. **BUSINESS MODEL**: How you make money. Pricing. Unit economics (CAC, LTV if known). Path to profitability.
8. **COMPETITION**: 2-3 real competitors. Your advantage. Why you'll win.
9. **TEAM**: Founder's background ("${full_name || 'Founder'}"). Key skills. Gaps you're filling.
10. **THE ASK**: What you're raising (if applicable). Use of funds (3-4 bullets). Next milestones. Contact CTA.

For each slide include:
- 3-5 punchy bullet points (not paragraphs)
- Speaker notes: what the founder should say (conversational, 2-3 sentences)
- Visual suggestion: what image/chart/graphic would work

Make it specific to "${company_name || 'this startup'}" and "${idea}". No generic fluff. Investors see 100s of decks — make this memorable.`
    },

    competitor_analysis: {
      system: `You are a market research analyst specializing in competitive intelligence. You find real companies, analyze their offerings honestly, and identify genuine opportunities. Be specific: name actual competitors, quote real pricing when possible, identify real weaknesses. Return ONLY valid JSON matching this schema: ${COMPETITOR_ANALYSIS_SCHEMA}.`,
      user: `Create a comprehensive competitor analysis for:

${context}

Research and analyze 3-5 REAL competitors for "${idea}". For each competitor, provide:

- Name and website
- Founded year, funding status (if known), headquarters
- Target audience (be specific)
- Key features (4-6 specific capabilities)
- Pricing model and starting price (be realistic for the industry)
- 3 strengths they have
- 3 weaknesses you can exploit
- Their positioning in the market (how they describe themselves)

Also include:
1. **MARKET OVERVIEW**: Market size estimate, growth rate, 3-5 key trends affecting this space
2. **COMPARISON MATRIX**: Create a feature comparison table with 6-8 key features across all competitors + your product
3. **GAPS & OPPORTUNITIES**: 4-5 specific gaps in the market you can exploit
4. **DIFFERENTIATION STRATEGY**: How "${company_name || 'this startup'}" should position against these competitors (2-3 paragraphs)

Name REAL companies, not made-up ones. If you're uncertain about specific details, note that they're estimates. Focus on accuracy over impressiveness.`
    }
  };

  return templates[type];
}

module.exports = { getPrompts };
