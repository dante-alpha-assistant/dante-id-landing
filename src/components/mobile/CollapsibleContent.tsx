import React, { useState, useRef, useEffect } from 'react';
import { useMobilePreferences } from '../../hooks/useMobilePreferences';

interface CollapsibleContentProps {
  isExpanded: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleContent({ 
  isExpanded, 
  children, 
  className = '' 
}: CollapsibleContentProps) {
  const [height, setHeight] = useState('0px');
  const contentRef = useRef<HTMLDivElement>(null);
  const { preferences } = useMobilePreferences();

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? `${contentRef.current.scrollHeight}px` : '0px');
    }
  }, [isExpanded]);

  const animationClass = preferences?.animation_enabled 
    ? 'transition-all duration-300 ease-in-out' 
    : '';

  return (
    <div
      className={`overflow-hidden ${animationClass} ${className}`}
      style={{ height }}
    >
      <div ref={contentRef} className="pb-4">
        {children}
      </div>
    </div>
  );
}