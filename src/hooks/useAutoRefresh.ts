import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshProps {
  onRefresh: () => void;
  interval: number;
  enabled: boolean;
}

export function useAutoRefresh({ onRefresh, interval, enabled }: UseAutoRefreshProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshRef = useRef(onRefresh);

  // Keep the refresh function reference current
  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      refreshRef.current();
    }, interval);
  }, [interval]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startTimer();
    } else {
      stopTimer();
    }

    return stopTimer;
  }, [enabled, startTimer, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return stopTimer;
  }, [stopTimer]);

  return { startTimer, stopTimer };
}