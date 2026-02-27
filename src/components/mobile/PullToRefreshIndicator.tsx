import React, { useState, useRef, useEffect } from 'react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface PullToRefreshIndicatorProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefreshIndicator({ 
  onRefresh, 
  children, 
  threshold = 80,
  disabled = false
}: PullToRefreshIndicatorProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const { mediumImpact, heavyImpact } = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFeedbackTriggered = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    setStartY(e.touches[0].clientY);
    hasFeedbackTriggered.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || startY === 0) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
      
      // Haptic feedback when threshold is reached
      if (distance > threshold && !hasFeedbackTriggered.current) {
        mediumImpact();
        hasFeedbackTriggered.current = true;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || pullDistance === 0) {
      setPullDistance(0);
      setStartY(0);
      return;
    }
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      heavyImpact();
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setStartY(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance, threshold, disabled, isRefreshing]);

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 180;

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 z-10"
        style={{ 
          height: Math.max(0, pullDistance),
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`,
          opacity: indicatorOpacity
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-blue-600">
            <svg 
              className="w-4 h-4" 
              style={{ transform: `rotate(${rotation}deg)` }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0l-7 7m7-7v18" />
            </svg>
            <span className="text-sm font-medium">
              {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}