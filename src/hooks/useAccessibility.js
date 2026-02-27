import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Core accessibility hook for managing ARIA states and screen reader support
 */
export function useAccessibility(options = {}) {
  const {
    announcements = true,
    reducedMotion = false,
    highContrast = false,
    announceDelay = 500
  } = options;

  const [ariaLive, setAriaLive] = useState('polite');
  const [announcement, setAnnouncement] = useState('');
  const announceTimeoutRef = useRef(null);

  // Check for user's motion preferences
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Check for high contrast preference
  const [prefersHighContrast, setPrefersHighContrast] = useState(
    window.matchMedia('(prefers-contrast: high)').matches
  );

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    const handleContrastChange = (e) => setPrefersHighContrast(e.matches);

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const announce = useCallback((message, politeness = 'polite') => {
    if (!announcements || !message) return;

    // Clear previous timeout
    if (announceTimeoutRef.current) {
      clearTimeout(announceTimeoutRef.current);
    }

    setAriaLive(politeness);
    
    // Delay announcement slightly to ensure screen readers pick it up
    announceTimeoutRef.current = setTimeout(() => {
      setAnnouncement(message);
      
      // Clear announcement after delay
      setTimeout(() => {
        setAnnouncement('');
      }, announceDelay);
    }, 100);
  }, [announcements, announceDelay]);

  const generateAriaLabel = useCallback((text, context) => {
    if (!text) return '';
    return context ? `${text}, ${context}` : text;
  }, []);

  const getAriaDescribedBy = useCallback((ids = []) => {
    return ids.filter(Boolean).join(' ') || undefined;
  }, []);

  const getFocusableSelector = useCallback(() => {
    return 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
      }
    };
  }, []);

  return {
    announce,
    announcement,
    ariaLive,
    generateAriaLabel,
    getAriaDescribedBy,
    getFocusableSelector,
    prefersReducedMotion: prefersReducedMotion || reducedMotion,
    prefersHighContrast: prefersHighContrast || highContrast,
    isAnnouncementsEnabled: announcements
  };
}