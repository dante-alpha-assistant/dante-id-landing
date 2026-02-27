import React from 'react';
import { Link } from 'react-router-dom';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
// Placeholder: BreadcrumbSeparator (auto-inlined);

/**
 * Main breadcrumb navigation component
 * @param {Object} props - Component props
 */
function BreadcrumbNavigation({ 
  maxDepth = 5,
  homeRoute = '/',
  className = '',
  showHome = true,
  excludePatterns = []
}) {
  const { breadcrumbs, loading } = useBreadcrumbs({
    maxDepth,
    homeRoute,
    excludePatterns
  });
  
  if (loading) {
    return (
      <nav className={`flex items-center space-x-1 ${className}`} aria-label="Breadcrumb">
        <div className="h-4 w-16 bg-zinc-700 animate-pulse rounded" />
      </nav>
    );
  }
  
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  // Filter out home if not showing home
  const visibleBreadcrumbs = showHome ? breadcrumbs : breadcrumbs.filter(item => !item.isHome);
  
  if (visibleBreadcrumbs.length === 0) {
    return null;
  }
  
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm font-mono ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {visibleBreadcrumbs.map((item, index) => (
          <li key={item.path} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            
            {item.isClickable ? (
              <Link
                to={item.path}
                className="text-zinc-400 hover:text-zinc-200 transition-colors px-1 py-0.5 rounded hover:bg-zinc-800/50"
                aria-label={`Navigate to ${item.label}`}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className="text-zinc-200 font-medium px-1 py-0.5"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default BreadcrumbNavigation;
function BreadcrumbSeparator(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbSeparator]</div>; }
