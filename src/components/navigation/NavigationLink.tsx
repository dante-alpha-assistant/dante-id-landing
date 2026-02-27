import React from 'react';
import { Link } from 'react-router-dom';

interface NavigationLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  variant?: 'desktop' | 'mobile';
  onClick?: () => void;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  href,
  label,
  isActive,
  variant = 'desktop',
  onClick
}) => {
  const baseClasses = 'font-medium transition-colors duration-200';
  const desktopClasses = isActive
    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
    : 'text-gray-700 hover:text-blue-600';
  const mobileClasses = isActive
    ? 'text-blue-600 bg-blue-50 px-4 py-3 rounded-lg'
    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-3 rounded-lg';

  const classes = variant === 'desktop'
    ? `${baseClasses} ${desktopClasses}`
    : `${baseClasses} ${mobileClasses} block w-full text-left`;

  return (
    <Link
      to={href}
      className={classes}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
};