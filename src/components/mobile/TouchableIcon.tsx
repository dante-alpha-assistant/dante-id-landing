import React from 'react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useMobilePreferences } from '../../hooks/useMobilePreferences';

interface TouchableIconProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

export function TouchableIcon({ 
  icon, 
  size = 'md', 
  onClick, 
  accessibilityLabel,
  className = '' 
}: TouchableIconProps) {
  const { lightImpact } = useHapticFeedback();
  const { preferences } = useMobilePreferences();

  const sizeClasses = {
    sm: 'w-8 h-8 min-w-[32px] min-h-[32px]',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px]', // 44px minimum touch target
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px]'
  };

  const handleTouch = () => {
    lightImpact();
    onClick?.();
  };

  return (
    <button
      onClick={handleTouch}
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center 
        bg-gray-100 hover:bg-gray-200 active:bg-gray-300 
        transition-colors duration-150 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}`}
      aria-label={accessibilityLabel}
      style={{
        minWidth: preferences?.touch_target_size || 44,
        minHeight: preferences?.touch_target_size || 44
      }}
    >
      {icon}
    </button>
  );
}