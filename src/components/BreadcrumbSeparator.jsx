import React from 'react';

/**
 * Visual separator between breadcrumb items
 * @param {Object} props - Component props
 */
function BreadcrumbSeparator({ 
  icon = '/',
  className = '',
  ariaHidden = true 
}) {
  return (
    <span 
      className={`text-zinc-500 mx-1 select-none ${className}`}
      aria-hidden={ariaHidden}
    >
      {icon}
    </span>
  );
}

export default BreadcrumbSeparator;