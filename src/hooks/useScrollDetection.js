import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for scroll position detection with throttled events
 * @param {number} threshold - Scroll position threshold in pixels
 * @returns {boolean} isVisible - Whether scroll position exceeds threshold
 */
export const useScrollDetection = (threshold = 300) => {
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef(null);
  const isThrottled = useRef(false);

  const handleScroll = useCallback(() => {
    if (isThrottled.current) return;
    
    isThrottled.current = true;
    rafRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY || window.pageYOffset;
      const shouldShow = scrollY > threshold;
      
      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow);
      }
      
      isThrottled.current = false;
    });
  }, [threshold, isVisible]);

  useEffect(() => {
    // Check initial scroll position
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return isVisible;
};

/**
 * Smooth scroll utility with easing and reduced motion support
 * @param {Object} options - Scroll configuration
 */
export const smoothScrollToTop = ({
  duration = 600,
  easing = 'easeInOutCubic'
} = {}) => {
  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }

  const startPosition = window.scrollY || window.pageYOffset;
  const startTime = performance.now();

  // Easing functions
  const easings = {
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutQuad: (t) => t * (2 - t)
  };

  const ease = easings[easing] || easings.easeInOutCubic;

  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = ease(progress);
    
    const newPosition = startPosition - (startPosition * easedProgress);
    window.scrollTo(0, Math.max(0, newPosition));

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};