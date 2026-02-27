import React from 'react';
import { MD3ButtonProps } from '../../types/theme';

const MD3Button: React.FC<MD3ButtonProps> = ({
  variant = 'filled',
  size = 'medium',
  disabled = false,
  icon,
  iconPosition = 'start',
  fullWidth = false,
  onClick,
  className = '',
  children
}) => {
  const baseClasses = 'md3-button-base md3-typography-label-large';
  
  const variantClasses = {
    elevated: 'bg-[var(--md3-sys-color-surface-container-low)] text-[var(--md3-sys-color-primary)] shadow-[var(--md3-sys-elevation-level1)] hover:shadow-[var(--md3-sys-elevation-level2)] before:bg-[var(--md3-sys-color-primary)]',
    filled: 'bg-[var(--md3-sys-color-primary)] text-[var(--md3-sys-color-on-primary)] before:bg-[var(--md3-sys-color-on-primary)]',
    'filled-tonal': 'bg-[var(--md3-sys-color-secondary-container)] text-[var(--md3-sys-color-on-secondary-container)] before:bg-[var(--md3-sys-color-on-secondary-container)]',
    outlined: 'bg-transparent text-[var(--md3-sys-color-primary)] border border-[var(--md3-sys-color-outline)] before:bg-[var(--md3-sys-color-primary)]',
    text: 'bg-transparent text-[var(--md3-sys-color-primary)] before:bg-[var(--md3-sys-color-primary)]'
  };

  const sizeClasses = {
    small: 'h-8 px-3 text-sm',
    medium: 'h-10 px-6',
    large: 'h-12 px-8 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className
  ].join(' ');

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
    >
      {icon && iconPosition === 'start' && (
        <span className="flex items-center justify-center w-5 h-5">
          {icon}
        </span>
      )}
      <span className="flex items-center">{children}</span>
      {icon && iconPosition === 'end' && (
        <span className="flex items-center justify-center w-5 h-5">
          {icon}
        </span>
      )}
    </button>
  );
};

export default MD3Button;