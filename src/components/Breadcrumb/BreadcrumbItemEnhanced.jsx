import React from 'react';
import { Link } from 'react-router-dom';
// Placeholder: BreadcrumbIcon (auto-inlined);

export const BreadcrumbItem = ({
  href,
  label,
  isActive = false,
  onClick,
  ariaCurrent,
  showIcon = false,
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center space-x-1 
    text-sm font-medium transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-md-primary focus:ring-offset-1
    rounded-sm px-1 py-0.5
  `;

  const linkClasses = `
    ${baseClasses}
    text-md-primary hover:text-md-on-primary-container 
    hover:bg-md-primary-container
    cursor-pointer
    ${className}
  `;

  const activeClasses = `
    ${baseClasses}
    text-md-on-surface font-semibold
    cursor-default
    ${className}
  `;

  const content = (
    <>
      {showIcon && (
        <BreadcrumbIcon 
          type="home" 
          size={14} 
          ariaLabel="Home" 
          className="text-current"
        />
      )}
      <span className={isActive ? 'truncate max-w-32 md:max-w-none' : 'truncate max-w-24 md:max-w-none'}>
        {label}
      </span>
    </>
  );

  if (isActive || !href) {
    return (
      <span
        className={activeClasses}
        aria-current={ariaCurrent}
        {...props}
      >
        {content}
      </span>
    );
  }

  if (onClick) {
    return (
      <button
        className={linkClasses}
        onClick={onClick}
        type="button"
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={href}
      className={linkClasses}
      {...props}
    >
      {content}
    </Link>
  );
};

export default BreadcrumbItem;
function BreadcrumbIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BreadcrumbIcon]</div>; }
