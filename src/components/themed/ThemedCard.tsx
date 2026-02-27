import React from 'react';
import { cn } from '../../utils/cn';

interface ThemedCardProps {
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  elevation = 'md',
  padding = 'md',
  children,
  header,
  footer,
  className
}) => {
  const baseClasses = 'rounded-lg border transition-all duration-200';
  
  const elevationClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const themeClasses = 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700';
  
  return (
    <div className={cn(
      baseClasses,
      elevationClasses[elevation],
      themeClasses,
      className
    )}>
      {header && (
        <div className={cn(
          'border-b border-gray-200 dark:border-gray-700',
          padding !== 'none' ? 'p-4 pb-3' : ''
        )}>
          {header}
        </div>
      )}
      <div className={cn(paddingClasses[padding])}>
        {children}
      </div>
      {footer && (
        <div className={cn(
          'border-t border-gray-200 dark:border-gray-700',
          padding !== 'none' ? 'p-4 pt-3' : ''
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};