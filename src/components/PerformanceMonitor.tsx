import React, { useEffect } from 'react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  onMetricsCapture?: (metrics: any) => void;
  trackingEnabled?: boolean;
  componentName?: string;
  children?: React.ReactNode;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetricsCapture,
  trackingEnabled = true,
  componentName = 'NavigationBar',
  children
}) => {
  const { metrics, isPerformant, getMetricsSummary } = usePerformanceMonitor({
    componentName,
    trackingEnabled,
    threshold: 100
  });

  useEffect(() => {
    if (metrics && onMetricsCapture) {
      onMetricsCapture(getMetricsSummary());
    }
  }, [metrics, onMetricsCapture, getMetricsSummary]);

  // In development, show performance warnings
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics && !isPerformant) {
      console.warn(`Performance warning: ${componentName} took ${metrics.loadTime}ms to load (threshold: 100ms)`);
    }
  }, [metrics, isPerformant, componentName]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && metrics && (
        <div 
          className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50"
          style={{ fontFamily: 'monospace' }}
        >
          <div>Component: {componentName}</div>
          <div>Load: {metrics.loadTime}ms</div>
          <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
          {metrics.interactionDelay && (
            <div>Interaction: {metrics.interactionDelay.toFixed(1)}ms</div>
          )}
          <div className={isPerformant ? 'text-green-400' : 'text-red-400'}>
            {isPerformant ? '✓ Performant' : '⚠ Slow'}
          </div>
        </div>
      )}
    </>
  );
};