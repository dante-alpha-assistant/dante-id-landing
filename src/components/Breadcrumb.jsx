import React from 'react';
import { useLocation } from 'react-router-dom';
import { useBreadcrumb } from '../hooks/useBreadcrumb';
// Placeholder: BreadcrumbItem (auto-inlined);
// Placeholder: BreadcrumbSeparator (auto-inlined);

const Breadcrumb = ({
  homeRoute = '/',
  maxDepth = 5,
  className = '',
  separator = 'chevron',
  customLabels = {}
}) => {
  const location = useLocation();
  const breadcrumbItems = useBreadcrumb({
    pathname: location.pathname,
    homeRoute,
    maxDepth,
    customLabels
  });

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb for home page only
  }

  return (
    <nav
      className={`font-mono text-sm ${className}`}
      role="navigation"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1 text-zinc-400">
        {breadcrumbItems.map((item, index) => (
          <li key={item.path} className="flex items-center">
            <BreadcrumbItem
              label={item.label}
              path={item.path}
              isActive={index === breadcrumbItems.length - 1}
            />
            {index < breadcrumbItems.length - 1 && (
              <BreadcrumbSeparator icon={separator} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
function BreadcrumbItem(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbItem]</div>; }

function BreadcrumbSeparator(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbSeparator]</div>; }
