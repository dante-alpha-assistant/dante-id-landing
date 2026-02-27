import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionDelay?: number;
  componentName: string;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  trackingEnabled?: boolean;
  threshold?: number; // Alert if load time exceeds this (ms)
}

export const usePerformanceMonitor = ({
  componentName,
  trackingEnabled = true,
  threshold = 100
}: UsePerformanceMonitorOptions) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isPerformant, setIsPerformant] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!trackingEnabled) return;

    renderStartRef.current = Date.now();
    startTimeRef.current = performance.now();

    // Track component mount time
    const loadTime = Date.now() - renderStartRef.current;
    
    // Use requestAnimationFrame to measure render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTimeRef.current;
      
      const performanceData: PerformanceMetrics = {
        loadTime,
        renderTime,
        componentName
      };

      setMetrics(performanceData);
      setIsPerformant(loadTime <= threshold);

      // Store metrics in Supabase
      if (process.env.NODE_ENV === 'production') {
        supabase
          .from('performance_metrics')
          .insert({
            component_name: componentName,
            load_time_ms: loadTime,
            render_time_ms: renderTime,
            device_info: {
              userAgent: navigator.userAgent,
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight
              },
              connection: (navigator as any).connection?.effectiveType
            }
          })
          .then(() => {
            console.debug(`Performance metrics logged for ${componentName}`);
          })
          .catch((error) => {
            console.warn('Failed to log performance metrics:', error);
          });
      }
    });
  }, [componentName, trackingEnabled, threshold]);

  const trackInteraction = (interactionType: string) => {
    const interactionStart = performance.now();
    
    return () => {
      const interactionDelay = performance.now() - interactionStart;
      
      if (metrics) {
        const updatedMetrics = {
          ...metrics,
          interactionDelay
        };
        setMetrics(updatedMetrics);
      }

      // Track interaction analytics
      if (process.env.NODE_ENV === 'production') {
        supabase
          .from('navigation_analytics')
          .insert({
            event_type: interactionType,
            element_id: componentName,
            page_path: window.location.pathname,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
            user_agent: navigator.userAgent,
            session_id: sessionStorage.getItem('session_id') || 'anonymous'
          })
          .catch((error) => {
            console.warn('Failed to log interaction analytics:', error);
          });
      }
    };
  };

  const getMetricsSummary = () => {
    if (!metrics) return null;
    
    return {
      ...metrics,
      isPerformant,
      grade: metrics.loadTime <= 50 ? 'A' : 
              metrics.loadTime <= 100 ? 'B' : 
              metrics.loadTime <= 200 ? 'C' : 'D'
    };
  };

  return {
    metrics,
    isPerformant,
    trackInteraction,
    getMetricsSummary
  };
};