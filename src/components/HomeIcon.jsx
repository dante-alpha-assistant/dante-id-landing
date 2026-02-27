import React from 'react';

const HomeIcon = ({ size = 20, variant = 'filled', className = '' }) => {
  const sizeClass = {
    16: 'w-4 h-4',
    20: 'w-5 h-5',
    24: 'w-6 h-6',
    32: 'w-8 h-8'
  }[size];

  if (variant === 'outline') {
    return (
      <svg 
        className={`${sizeClass} ${className}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
        />
      </svg>
    );
  }

  return (
    <svg 
      className={`${sizeClass} ${className}`} 
      fill="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M11.47 3.84a.75.75 0 01.06 1.06L9.5 7.5h7.75c1.519 0 2.75 1.231 2.75 2.75v9a.75.75 0 01-1.5 0v-9c0-.69-.56-1.25-1.25-1.25H9.5l2.03 2.59a.75.75 0 01-1.06 1.06l-3.5-4.5a.75.75 0 01-.06-1.06l3.5-4.5a.75.75 0 011.06 0z" />
      <path d="M9.25 4A.75.75 0 018.5 3.25h-4a.75.75 0 000 1.5h4A.75.75 0 019.25 4z" />
    </svg>
  );
};

export default HomeIcon;