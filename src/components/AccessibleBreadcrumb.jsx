import React, { useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAccessibility } from '../hooks/useAccessibility';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
// Placeholder: ScreenReaderAnnouncer (auto-inlined);
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';

/**
 * Accessible breadcrumb component with ARIA support and keyboard navigation
 */
export function AccessibleBreadcrumb({
  homeRoute = '/',
  customLabels = {},
  separator = '/',
  ariaLabel = 'Breadcrumb navigation',
  announceNavigation = true,
  maxDepth = 5,
  className = ''
}) {
  const location = useLocation();
  const containerRef = useRef(null);
  
  const { announce, generateAriaLabel, prefersReducedMotion } = useAccessibility({
    announcements: announceNavigation
  });

  // Get breadcrumb items
  const { breadcrumbs } = useBreadcrumbs({
    customLabels,
    maxDepth,
    includeHome: true,
    homeRoute
  });

  // Prepare navigation items for keyboard handling
  const navigationItems = useMemo(() => {
    return breadcrumbs.map((breadcrumb, index) => ({
      ...breadcrumb,
      index,
      isActive: index === breadcrumbs.length - 1
    }));
  }, [breadcrumbs]);

  const { setItemRef, handleKeyDown, handleFocus } = useKeyboardNavigation({
    items: navigationItems,
    onNavigate: (item) => {
      if (!item.isActive && announceNavigation) {
        announce(`Navigating to ${item.label}`);
      }
    },
    containerRef
  });

  // Announce location changes
  React.useEffect(() => {
    if (announceNavigation && breadcrumbs.length > 0) {
      const currentPage = breadcrumbs[breadcrumbs.length - 1];
      announce(`Current location: ${currentPage.label}`, 'polite');
    }
  }, [location.pathname, announce, announceNavigation, breadcrumbs]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <>
      <nav
        ref={containerRef}
        role="navigation"
        aria-label={ariaLabel}
        className={`bg-md-surface-container rounded-md-lg p-4 ${className}`}
      >
        <ol
          className="flex items-center space-x-2 text-sm font-sans"
          role="list"
        >
          {navigationItems.map((item, index) => (
            <li key={item.path || index} role="listitem">
              <div className="flex items-center space-x-2">
                {index > 0 && (
                  <BreadcrumbSeparator
                    separator={separator}
                    className="text-md-on-surface-variant"
                  />
                )}
                <BreadcrumbItem
                  ref={(ref) => setItemRef(index, ref)}
                  href={item.path}
                  label={item.label}
                  isActive={item.isActive}
                  ariaCurrent={item.isActive ? 'page' : undefined}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => handleFocus(index)}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </div>
            </li>
          ))}
        </ol>
      </nav>
      
      {announceNavigation && (
        <ScreenReaderAnnouncer
          message=""
          politeness="polite"
        />
      )}
    </>
  );
}

/**
 * Individual breadcrumb item with accessibility features
 */
const BreadcrumbItem = React.forwardRef(({
  href,
  label,
  isActive,
  ariaCurrent,
  onKeyDown,
  onFocus,
  prefersReducedMotion,
  className = ''
}, ref) => {
  const baseClasses = 'focus:outline-none focus:ring-2 focus:ring-md-primary focus:ring-offset-2 rounded-sm px-2 py-1';
  const activeClasses = 'text-md-on-surface font-medium';
  const inactiveClasses = 'text-md-primary hover:text-md-on-primary-container hover:bg-md-primary-container transition-colors';
  
  // Disable transitions if user prefers reduced motion
  const motionClasses = prefersReducedMotion ? '' : 'transition-colors duration-200';
  
  const itemClasses = `${baseClasses} ${isActive ? activeClasses : `${inactiveClasses} ${motionClasses}`} ${className}`;

  if (isActive) {
    return (
      <span
        ref={ref}
        className={itemClasses}
        aria-current={ariaCurrent}
        onFocus={onFocus}
        tabIndex={0}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      ref={ref}
      to={href}
      className={itemClasses}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      aria-label={`Navigate to ${label}`}
    >
      {label}
    </Link>
  );
});

BreadcrumbItem.displayName = 'BreadcrumbItem';

/**
 * Accessible breadcrumb separator
 */
function BreadcrumbSeparator({ separator, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`select-none ${className}`}
      role="presentation"
    >
      {separator}
    </span>
  );
}
function ScreenReaderAnnouncer(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ScreenReaderAnnouncer]</div>; }
