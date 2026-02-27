import React from 'react';
import { useLocation } from 'react-router-dom';
import { useBreadcrumbConfig } from '../hooks/useBreadcrumbConfig';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
import { generateBreadcrumbsWithHome } from '../utils/homeUtils';
// Placeholder: BreadcrumbNavigation (auto-inlined);

const BreadcrumbWithHome = ({ 
  customHomeRoute, 
  maxDepth, 
  showIcons, 
  separator = 'chevron',
  className = '' 
}) => {
  const location = useLocation();
  const { config, isLoading } = useBreadcrumbConfig();
  const { segments } = useBreadcrumbs();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-md-surface-variant rounded w-48"></div>
      </div>
    );
  }

  // Merge custom props with config
  const effectiveConfig = {
    ...config,
    ...(customHomeRoute && { home_route: customHomeRoute }),
    ...(maxDepth && { max_depth: maxDepth }),
    ...(showIcons !== undefined && { show_icons: showIcons }),
    separator_type: separator
  };

  // Generate breadcrumb items with home link first
  const breadcrumbItems = generateBreadcrumbsWithHome(
    segments.slice(0, effectiveConfig.max_depth), 
    effectiveConfig,
    location.pathname
  );

  return (
    <BreadcrumbNavigation 
      items={breadcrumbItems}
      separatorType={effectiveConfig.separator_type}
      showIcons={effectiveConfig.show_icons}
      className={className}
    />
  );
};

export default BreadcrumbWithHome;
function BreadcrumbNavigation(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbNavigation]</div>; }
