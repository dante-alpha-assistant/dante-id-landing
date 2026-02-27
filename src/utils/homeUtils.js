import HomeIcon from '../components/HomeIcon';

/**
 * Generate home breadcrumb item configuration
 */
export const generateHomeItem = (config = {}) => {
  const {
    home_route = '/dashboard',
    home_label = 'Dashboard',
    home_icon = 'home',
    show_icons = true
  } = config;

  return {
    label: home_label,
    href: home_route,
    icon: show_icons ? home_icon : null,
    isHome: true,
    isActive: false
  };
};

/**
 * Validate home route path
 */
export const validateHomeRoute = (route) => {
  if (!route || typeof route !== 'string') {
    return false;
  }
  
  // Must start with /
  if (!route.startsWith('/')) {
    return false;
  }
  
  // Basic path validation (letters, numbers, hyphens, underscores, slashes)
  const pathRegex = /^[a-zA-Z0-9\/_-]+$/;
  return pathRegex.test(route);
};

/**
 * Get default home configuration
 */
export const getDefaultHomeConfig = () => {
  return {
    home_route: '/dashboard',
    home_label: 'Dashboard',
    home_icon: 'home',
    show_icons: true
  };
};

/**
 * Check if current route is the home route
 */
export const isHomeRoute = (currentPath, homeRoute) => {
  if (!currentPath || !homeRoute) return false;
  
  // Normalize paths (remove trailing slash)
  const normalizePath = (path) => path === '/' ? '/' : path.replace(/\/$/, '');
  
  return normalizePath(currentPath) === normalizePath(homeRoute);
};

/**
 * Generate breadcrumb items with home link always first
 */
export const generateBreadcrumbsWithHome = (routeSegments, config, currentPath) => {
  const homeItem = generateHomeItem(config);
  
  // If we're on the home page, just return the home item as non-clickable
  if (isHomeRoute(currentPath, config.home_route)) {
    return [{ ...homeItem, isActive: true, href: null }];
  }
  
  // Generate other breadcrumb items from route segments
  const otherItems = routeSegments.map((segment, index) => {
    const isLast = index === routeSegments.length - 1;
    return {
      label: segment.label,
      href: isLast ? null : segment.href,
      isActive: isLast,
      isHome: false
    };
  });
  
  return [homeItem, ...otherItems];
};