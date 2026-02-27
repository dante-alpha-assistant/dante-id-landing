import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for tracking analytics events
 * @returns {Object} { trackEvent, isTracking, error }
 */
export function useAnalytics() {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const trackEvent = useCallback(async (eventData) => {
    if (!user) return;
    
    try {
      setIsTracking(true);
      setError(null);

      const response = await fetch('/api/analytics/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_url: window.location.href,
          timestamp: eventData.timestamp || new Date().toISOString(),
          event_type: eventData.eventType,
          user_agent: eventData.userAgent || navigator.userAgent,
          scroll_position: eventData.scrollPosition || 0,
          properties: eventData.properties || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics tracking failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      console.warn('Analytics tracking failed:', err);
    } finally {
      setIsTracking(false);
    }
  }, [user]);

  return {
    trackEvent,
    isTracking,
    error
  };
}