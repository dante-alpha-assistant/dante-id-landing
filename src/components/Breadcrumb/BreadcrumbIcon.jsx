import React from 'react';

export const BreadcrumbIcon = ({ 
  type = 'home', 
  size = 16, 
  ariaLabel = 'Home',
  className = '',
  ...props 
}) => {
  const iconPaths = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    chevron: 'M9 5l7 7-7 7',
    slash: 'M12 2L22 12L12 22'
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ${className}`}
      aria-label={ariaLabel}
      role="img"
      {...props}
    >
      <path d={iconPaths[type] || iconPaths.home} />
    </svg>
  );
};

export default BreadcrumbIcon;