import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for tracking scroll position with throttling
 * @param {number} throttleMs - Throttle delay in milliseconds (default: 16ms for 60fps)
 * @returns {Object} { scrollY, isScrollingUp, isNearTop }
 */
export function useScrollPosition(throttleMs = 16) {
  const [scrollY, setScrollY] = useState(0);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    setIsScrollingUp(currentScrollY < prevScrollY);
    setIsNearTop(currentScrollY < 100);
    setScrollY(currentScrollY);
    setPrevScrollY(currentScrollY);
  }, [prevScrollY]);

  useEffect(() => {
    let timeoutId = null;
    
    const throttledScrollHandler = () => {
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          handleScroll();
          timeoutId = null;
        }, throttleMs);
      }
    };

    window.addEventListener('scroll', throttledScrollHandler);
    
    // Initial call to set scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleScroll, throttleMs]);

  return {
    scrollY,
    isScrollingUp,
    isNearTop
  };
}