const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Default route configurations
const DEFAULT_ROUTES = {
  '/': { customLabel: 'Home', hidden: false },
  '/dashboard': { customLabel: null, hidden: false },
  '/editor': { customLabel: null, hidden: false },
  '/refinery': { customLabel: null, hidden: false },
  '/foundry': { customLabel: null, hidden: false },
  '/planner': { customLabel: null, hidden: false },
  '/builder': { customLabel: null, hidden: false },
  '/inspector': { customLabel: null, hidden: false },
  '/deployer': { customLabel: null, hidden: false },
  '/validator': { customLabel: null, hidden: false },
  '/iterate': { customLabel: null, hidden: false },
  '/usage': { customLabel: null, hidden: false },
  '/github': { customLabel: null, hidden: false },
  '/onboarding': { customLabel: null, hidden: false }
};

// Default abbreviations
const DEFAULT_ABBREVIATIONS = {
  'api': 'API',
  'ui': 'UI',
  'ux': 'UX',
  'db': 'Database',
  'auth': 'Authentication',
  'admin': 'Admin',
  'prd': 'PRD',
  'qa': 'QA',
  'github': 'GitHub'
};

/**
 * Get route metadata and configurations
 */
async function getRouteMetadata(req, res) {
  try {
    const { data: routeConfigs, error } = await supabase
      .from('route_configurations')
      .select('*');
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Merge default routes with database configurations
    const routes = { ...DEFAULT_ROUTES };
    
    if (routeConfigs) {
      routeConfigs.forEach(config => {
        routes[config.route_path] = {
          customLabel: config.custom_label,
          hidden: config.is_hidden
        };
      });
    }
    
    // Get label mappings
    const { data: labelMappings } = await supabase
      .from('label_mappings')
      .select('*');
    
    const abbreviations = { ...DEFAULT_ABBREVIATIONS };
    if (labelMappings) {
      labelMappings.forEach(mapping => {
        abbreviations[mapping.segment_key] = mapping.display_label;
      });
    }
    
    res.json({
      routes,
      abbreviations,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching route metadata:', error);
    res.status(500).json({
      error: 'Failed to fetch route metadata',
      success: false
    });
  }
}

/**
 * Update route configuration
 */
async function updateRouteMetadata(req, res) {
  try {
    const { routePath, customLabel, hidden } = req.body;
    
    if (!routePath) {
      return res.status(400).json({
        error: 'Route path is required',
        success: false
      });
    }
    
    // Upsert route configuration
    const { error } = await supabase
      .from('route_configurations')
      .upsert({
        route_path: routePath,
        custom_label: customLabel || null,
        is_hidden: Boolean(hidden),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'route_path'
      });
    
    if (error) {
      throw error;
    }
    
    res.json({
      message: 'Route configuration updated successfully',
      success: true
    });
    
  } catch (error) {
    console.error('Error updating route metadata:', error);
    res.status(500).json({
      error: 'Failed to update route metadata',
      success: false
    });
  }
}

module.exports = {
  getRouteMetadata,
  updateRouteMetadata
};