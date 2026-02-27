/**
 * Transform a URL segment into a human-readable label
 * @param {string} segment - URL segment to transform
 * @returns {string} - Human-readable label
 */
export function transformPathSegment(segment) {
  return segment
    .replace(/[-_]/g, ' ')           // Replace hyphens and underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space before capitals
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate a full path from an array of segments
 * @param {string[]} segments - Array of path segments
 * @returns {string} - Complete path
 */
export function generateBreadcrumbPath(segments) {
  return '/' + segments.join('/');
}

/**
 * Check if a segment represents a dynamic route parameter
 * @param {string} segment - URL segment to check
 * @returns {boolean} - True if segment is dynamic
 */
export function isDynamicSegment(segment) {
  // Check for UUID pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(segment)) {
    return true;
  }
  
  // Check for pure numbers
  if (/^\d+$/.test(segment)) {
    return true;
  }
  
  return false;
}

/**
 * Generate breadcrumb items with proper navigation paths
 * @param {string} pathname - Current pathname
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of breadcrumb items
 */
export function generateBreadcrumbItems(pathname, options = {}) {
  const {
    homeRoute = '/',
    homeLabel = 'Home',
    maxDepth = 5,
    customLabels = {},
    excludeDynamic = true
  } = options;

  const segments = pathname.split('/').filter(Boolean);
  const items = [];

  // Add home item
  items.push({
    label: homeLabel,
    path: homeRoute,
    isHome: true
  });

  // Process each segment
  let pathBuilder = '';
  for (let i = 0; i < Math.min(segments.length, maxDepth - 1); i++) {
    const segment = segments[i];
    pathBuilder += `/${segment}`;

    // Skip dynamic segments if configured
    if (excludeDynamic && isDynamicSegment(segment)) {
      continue;
    }

    // Use custom label if available, otherwise transform segment
    const label = customLabels[pathBuilder] || 
                  customLabels[segment] || 
                  transformPathSegment(segment);

    items.push({
      label,
      path: pathBuilder,
      segment,
      isHome: false
    });
  }

  return items;
}