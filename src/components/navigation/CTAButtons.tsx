import React from 'react';
import { Link } from 'react-router-dom';
import { CTAButton } from '../../data/navigationConfig';

interface CTAButtonsProps {
  buttons: CTAButton[];
  variant?: 'desktop' | 'mobile';
}

export const CTAButtons: React.FC<CTAButtonsProps> = ({ buttons, variant = 'desktop' }) => {
  const containerClasses = variant === 'desktop'
    ? 'hidden md:flex items-center space-x-4'
    : 'flex flex-col space-y-3';

  const getButtonClasses = (buttonVariant: string) => {
    const baseClasses = 'font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500';
    const sizeClasses = variant === 'desktop' ? 'px-4 py-2 rounded-full' : 'w-full px-6 py-3 rounded-lg';
    
    if (buttonVariant === 'primary') {
      return `${baseClasses} ${sizeClasses} bg-blue-600 text-white hover:bg-blue-700`;
    } else {
      return `${baseClasses} ${sizeClasses} text-gray-700 hover:text-blue-600 border border-gray-300 hover:border-blue-600`;
    }
  };

  return (
    <div className={containerClasses}>
      {buttons.map((button) => (
        <Link
          key={button.href}
          to={button.href}
          className={getButtonClasses(button.variant)}
        >
          {button.label}
        </Link>
      ))}
    </div>
  );
};