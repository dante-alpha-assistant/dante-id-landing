import { useRef, useCallback } from 'react';

export function useScrollPreservation() {
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const savedScrollTop = useRef<number>(0);
  const savedScrollHeight = useRef<number>(0);

  const preserveScroll = useCallback(() => {
    const element = scrollElementRef.current;
    if (!element) return;
    
    savedScrollTop.current = element.scrollTop;
    savedScrollHeight.current = element.scrollHeight;
  }, []);

  const restoreScroll = useCallback(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const heightDifference = element.scrollHeight - savedScrollHeight.current;
    
    // If new content was added at the top, adjust scroll position
    if (heightDifference > 0 && savedScrollTop.current > 0) {
      element.scrollTop = savedScrollTop.current + heightDifference;
    }
  }, []);

  const setScrollElement = useCallback((element: HTMLElement | null) => {
    scrollElementRef.current = element;
  }, []);

  return {
    setScrollElement,
    preserveScroll,
    restoreScroll
  };
}