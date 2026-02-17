const DELIVERABLE_SCHEMAS = {
  brand_identity: '{ "name_suggestions": ["string"], "color_palette": [{"name": "string", "hex": "string"}], "typography": {"heading": "string", "body": "string"}, "tagline_options": ["string"], "brand_voice": "string" }',
  landing_page: '{ "headline": "string", "subheadline": "string", "features": [{"title": "string", "desc": "string"}], "cta": "string", "html": "string" }',
  business_plan: '{ "executive_summary": "string", "problem": "string", "solution": "string", "target_market": "string", "revenue_model": "string", "competitive_landscape": "string", "milestones": ["string"] }',
  growth_strategy: '{ "channels": [{"name": "string", "description": "string"}], "first_90_days": ["string"], "key_metrics": ["string"], "budget_allocation": [{"category": "string", "percentage": "number"}] }'
};

function getPrompts(type, { idea, stage, needs, company_name, full_name }) {
  const context = `Company: ${company_name || 'Unnamed'}\nFounder: ${full_name || 'Unknown'}\nIdea: ${idea}\nStage: ${stage || 'idea'}\nNeeds: ${needs || 'general guidance'}`;

  const templates = {
    brand_identity: {
      system: `You are a brand strategist. Return ONLY valid JSON matching this schema: ${DELIVERABLE_SCHEMAS.brand_identity}`,
      user: `Create a complete brand identity for this startup:\n${context}\n\nProvide 3-5 name suggestions, a 5-color palette with hex codes, typography recommendations, 3-5 tagline options, and a brand voice description.`
    },
    landing_page: {
      system: `You are a landing page copywriter and designer. Return ONLY valid JSON matching this schema: ${DELIVERABLE_SCHEMAS.landing_page}`,
      user: `Create landing page content for this startup:\n${context}\n\nInclude a compelling headline, subheadline, 3-4 features, a CTA, and a complete HTML landing page with inline CSS.`
    },
    business_plan: {
      system: `You are a business plan consultant. Return ONLY valid JSON matching this schema: ${DELIVERABLE_SCHEMAS.business_plan}`,
      user: `Create a business plan for this startup:\n${context}\n\nProvide an executive summary, problem statement, solution, target market analysis, revenue model, competitive landscape, and 5-8 milestones.`
    },
    growth_strategy: {
      system: `You are a growth strategist. Return ONLY valid JSON matching this schema: ${DELIVERABLE_SCHEMAS.growth_strategy}`,
      user: `Create a growth strategy for this startup:\n${context}\n\nProvide 3-5 growth channels with descriptions, a first 90 days plan, key metrics to track, and budget allocation recommendations.`
    }
  };

  return templates[type];
}

module.exports = { getPrompts };
