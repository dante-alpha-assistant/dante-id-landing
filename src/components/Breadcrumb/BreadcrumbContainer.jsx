import React from 'react';
import { useLocation } from 'react-router-dom';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
// Placeholder: BreadcrumbItem (auto-inlined);
// Placeholder: BreadcrumbSeparator (auto-inlined);
// Placeholder: BreadcrumbIcon (auto-inlined);

export const BreadcrumbContainer = ({
  className = '',
  homeRoute = '/dashboard',
  maxDepth = 5,
  customLabels = {},
  showHomeIcon = true,
  ...props
}) => {
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs({
    currentPath: location.pathname,
    homeRoute,
    maxDepth,
    customLabels
  });

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      role="navigation"
      aria-label="Breadcrumb"
      className={`
        flex items-center space-x-2 px-4 py-3 
        bg-md-surface-container rounded-md-lg
        text-sm font-sans
        ${className}
      `}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          
          return (
            <li key={crumb.path || index} className="flex items-center space-x-2">
              <BreadcrumbItem
                href={crumb.path}
                label={crumb.label}
                isActive={isLast}
                ariaCurrent={isLast ? 'page' : undefined}
                showIcon={isFirst && showHomeIcon}
              />
              {!isLast && <BreadcrumbSeparator />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbContainer;
function BreadcrumbItem(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbItem]</div>; }

function BreadcrumbSeparator(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbSeparator]</div>; }

function BreadcrumbIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbIcon]</div>; }
