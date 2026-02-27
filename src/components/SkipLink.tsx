import React from 'react';

interface SkipLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  label = 'Skip to main content', 
  className = '' 
}) => {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
        bg-blue-600 text-white px-4 py-2 rounded-md
        font-medium text-sm
        transition-all duration-200
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      role="navigation"
      aria-label={label}
    >
      {label}
    </a>
  );
};