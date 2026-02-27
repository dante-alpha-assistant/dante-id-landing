import React from 'react';
import { Link } from 'react-router-dom';

const BreadcrumbLink = ({ to, children, onClick, ...props }) => {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.click();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="text-zinc-500 hover:text-md-primary transition-colors duration-150 px-2 py-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-md-primary focus:ring-opacity-50"
      tabIndex={0}
      {...props}
    >
      {children}
    </Link>
  );
};

export default BreadcrumbLink;