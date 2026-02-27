/**
 * Parse URL pathname into breadcrumb segments
 * @param {string} pathname - Current URL pathname
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of route segments with paths
 */
export function parseRoutePath(pathname, options = {}) {
  const {
    excludePatterns = [],
    maxDepth = 10,
    homeRoute = '/'
  } = options;
  
  // Remove leading/trailing slashes and split
  const segments = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(segment => segment.length > 0);
  
  // Build breadcrumb items with cumulative paths
  const breadcrumbs = [];
  
  // Add home route if not at root
  if (pathname !== homeRoute && segments.length > 0) {
    breadcrumbs.push({
      segment: 'home',
      path: homeRoute,
      isHome: true
    });
  }
  
  // Build cumulative paths
  let currentPath = '';
  for (let i = 0; i < Math.min(segments.length, maxDepth); i++) {
    const segment = segments[i];
    currentPath += '/' + segment;
    
    // Check exclude patterns
    const shouldExclude = excludePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return segment === pattern;
      }
      if (pattern instanceof RegExp) {
        return pattern.test(segment);
      }
      return false;
    });
    
    if (!shouldExclude) {
      breadcrumbs.push({
        segment,
        path: currentPath,
        isHome: false
      });
    }
  }
  
  return breadcrumbs;
}

/**
 * Get route metadata for breadcrumb generation
 * @param {string} pathname - Current pathname
 * @returns {Object} - Route metadata
 */
export function getRouteMetadata(pathname) {
  // Map common routes to their metadata
  const routeMap = {
    '/dashboard': { label: 'Dashboard', icon: 'dashboard' },
    '/editor': { label: 'Editor', icon: 'edit' },
    '/refinery': { label: 'Refinery', icon: 'factory' },
    '/foundry': { label: 'Foundry', icon: 'build' },
    '/planner': { label: 'Planner', icon: 'planning' },
    '/builder': { label: 'Builder', icon: 'construction' },
    '/inspector': { label: 'Inspector', icon: 'bug_report' },
    '/deployer': { label: 'Deployer', icon: 'rocket_launch' },
    '/validator': { label: 'Validator', icon: 'verified' },
    '/iterate': { label: 'Iterate', icon: 'refresh' },
    '/usage': { label: 'Usage', icon: 'analytics' },
    '/github': { label: 'GitHub', icon: 'code' },
    '/onboarding': { label: 'Onboarding', icon: 'start' }
  };
  
  // Find exact match first
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }
  
  // Check for partial matches (e.g., /dashboard/project-id)
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const basePath = '/' + pathSegments[0];
    if (routeMap[basePath]) {
      return routeMap[basePath];
    }
  }
  
  return { label: null, icon: null };
}