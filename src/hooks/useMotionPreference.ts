import { useState, useEffect } from 'react';

export const useMotionPreference = (fallbackValue: boolean = false) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(fallbackValue);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};