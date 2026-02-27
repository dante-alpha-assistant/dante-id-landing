import React, { useRef, useEffect, useState } from 'react';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  showFadeEdges?: boolean;
}

export function HorizontalScrollContainer({ 
  children, 
  className = '',
  showFadeEdges = true 
}: HorizontalScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollPosition();
    
    const observer = new ResizeObserver(checkScrollPosition);
    if (scrollRef.current) {
      observer.observe(scrollRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative ${className}`}>
      {showFadeEdges && canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      )}
      
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide scroll-smooth"
        onScroll={checkScrollPosition}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </div>
      
      {showFadeEdges && canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      )}
    </div>
  );
}