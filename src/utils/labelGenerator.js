// Common abbreviations and acronyms with their full forms
const ABBREVIATIONS = {
  'api': 'API',
  'ui': 'UI',
  'ux': 'UX',
  'db': 'Database',
  'auth': 'Authentication',
  'admin': 'Admin',
  'url': 'URL',
  'http': 'HTTP',
  'https': 'HTTPS',
  'json': 'JSON',
  'xml': 'XML',
  'css': 'CSS',
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'html': 'HTML',
  'sql': 'SQL',
  'id': 'ID',
  'uuid': 'UUID',
  'oauth': 'OAuth',
  'jwt': 'JWT',
  'prd': 'PRD',
  'qa': 'QA',
  'ci': 'CI',
  'cd': 'CD',
  'aws': 'AWS',
  'gcp': 'GCP',
  'github': 'GitHub',
  'vercel': 'Vercel'
};

// UUID and numeric ID patterns to filter out
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Convert a URL segment to human-readable label
 * @param {string} segment - URL segment (kebab-case, snake_case, etc.)
 * @param {Object} customMappings - Custom label mappings
 * @returns {string} - Human-readable label
 */
export function generateLabel(segment, customMappings = {}) {
  if (!segment) return '';
  
  // Check custom mappings first
  if (customMappings[segment]) {
    return customMappings[segment];
  }
  
  // Filter out UUIDs and numeric IDs
  if (UUID_PATTERN.test(segment) || NUMERIC_ID_PATTERN.test(segment)) {
    return null;
  }
  
  // Convert kebab-case and snake_case to words
  const words = segment
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0);
  
  // Apply abbreviation mappings and capitalize
  const capitalizedWords = words.map(word => {
    if (ABBREVIATIONS[word]) {
      return ABBREVIATIONS[word];
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  
  return capitalizedWords.join(' ');
}

/**
 * Check if a segment should be hidden from breadcrumbs
 * @param {string} segment - URL segment
 * @returns {boolean} - True if segment should be hidden
 */
export function shouldHideSegment(segment) {
  if (!segment) return true;
  
  // Hide UUIDs and numeric IDs
  if (UUID_PATTERN.test(segment) || NUMERIC_ID_PATTERN.test(segment)) {
    return true;
  }
  
  // Hide common system segments
  const systemSegments = ['api', 'v1', 'v2', 'admin', 'auth'];
  if (systemSegments.includes(segment.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Get abbreviations map for admin configuration
 * @returns {Object} - Abbreviations object
 */
export function getAbbreviations() {
  return { ...ABBREVIATIONS };
}