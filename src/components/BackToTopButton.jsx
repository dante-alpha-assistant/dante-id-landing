import React, { useState, useEffect, useRef } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { smoothScrollToTop, getScrollProgress } from '../utils/scrollUtils';
// Placeholder: ScrollProgressIndicator (auto-inlined);

/**
 * Back to Top Button with smooth scroll and accessibility features
 * Follows terminal/CLI design aesthetic with bracket styling
 */
function BackToTopButton({
  threshold = 300,
  animationDuration = 600,
  position = 'bottom-right',
  className = '',
  onScroll = null,
  respectReducedMotion = true,
  showProgress = true
}) {
  const { scrollY, isNearTop } = useScrollPosition();
  const prefersReducedMotion = useReducedMotion();
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const cancelScrollRef = useRef(null);
  const buttonRef = useRef(null);

  const isVisible = scrollY > threshold && !isNearTop;

  // Update scroll progress
  useEffect(() => {
    if (showProgress) {
      setScrollProgress(getScrollProgress());
    }
  }, [scrollY, showProgress]);

  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (cancelScrollRef.current) {
        cancelScrollRef.current();
      }
    };
  }, []);

  const handleScrollToTop = async () => {
    try {
      // Track analytics event
      if (onScroll) {
        onScroll({
          eventType: 'back_to_top_click',
          scrollPosition: scrollY,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }

      setIsScrolling(true);
      
      // Cancel any existing scroll animation
      if (cancelScrollRef.current) {
        cancelScrollRef.current();
      }

      // Start smooth scroll
      const cancelFn = smoothScrollToTop({
        duration: respectReducedMotion && prefersReducedMotion ? 0 : animationDuration,
        respectReducedMotion,
        onComplete: () => {
          setIsScrolling(false);
          cancelScrollRef.current = null;
          // Focus management for accessibility
          if (buttonRef.current) {
            buttonRef.current.blur();
          }
        }
      });

      cancelScrollRef.current = cancelFn;
    } catch (error) {
      console.warn('Back to top scroll failed:', error);
      setIsScrolling(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleScrollToTop();
    }
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  // Animation classes based on reduced motion preference
  const animationClasses = prefersReducedMotion 
    ? 'opacity-100' 
    : 'transition-all duration-300 ease-out transform';

  const visibilityClasses = isVisible 
    ? (prefersReducedMotion ? 'opacity-100' : 'opacity-100 translate-y-0')
    : (prefersReducedMotion ? 'opacity-0 pointer-events-none' : 'opacity-0 translate-y-2 pointer-events-none');

  return (
    <button
      ref={buttonRef}
      onClick={handleScrollToTop}
      onKeyDown={handleKeyPress}
      className={`
        fixed z-50 ${positionClasses[position]}
        w-12 h-12 bg-zinc-900 border border-zinc-700
        hover:border-green-400 hover:bg-zinc-800
        focus:outline-none focus:ring-2 focus:ring-green-400
        font-mono text-green-400
        flex items-center justify-center
        ${animationClasses} ${visibilityClasses}
        ${isScrolling ? 'cursor-wait' : 'cursor-pointer'}
        ${className}
      `}
      aria-label="Back to top"
      aria-describedby="back-to-top-description"
      disabled={isScrolling}
      title={`Scroll to top (${Math.round(scrollProgress)}% scrolled)`}
    >
      {/* Progress indicator */}
      {showProgress && (
        <ScrollProgressIndicator
          visible={isVisible}
          progress={scrollProgress}
          size={48}
          strokeWidth={2}
        />
      )}
      
      {/* Arrow icon with terminal aesthetic */}
      <div className="relative z-10 text-sm font-bold">
        {isScrolling ? (
          <div className="animate-pulse">[...]</div>
        ) : (
          <div>[↑]</div>
        )}
      </div>
      
      {/* Hidden description for screen readers */}
      <span id="back-to-top-description" className="sr-only">
        Scroll to the top of the page. Currently at {Math.round(scrollProgress)}% of page length.
      </span>
    </button>
  );
}

export default BackToTopButton;
function ScrollProgressIndicator(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ScrollProgressIndicator]</div>; }
