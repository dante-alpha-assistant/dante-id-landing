import React from 'react';
// Placeholder: BreadcrumbIcon (auto-inlined);

export const BreadcrumbSeparator = ({ 
  variant = 'chevron',
  className = '',
  ...props 
}) => {
  const baseClasses = `
    text-md-on-surface-variant
    select-none pointer-events-none
    flex items-center
  `;

  if (variant === 'slash') {
    return (
      <span 
        className={`${baseClasses} ${className}`}
        aria-hidden="true"
        {...props}
      >
        /
      </span>
    );
  }

  if (variant === 'dot') {
    return (
      <span 
        className={`${baseClasses} ${className}`}
        aria-hidden="true"
        {...props}
      >
        •
      </span>
    );
  }

  // Default chevron
  return (
    <BreadcrumbIcon
      type="chevron"
      size={12}
      className={`${baseClasses} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

export default BreadcrumbSeparator;
function BreadcrumbIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbIcon]</div>; }
