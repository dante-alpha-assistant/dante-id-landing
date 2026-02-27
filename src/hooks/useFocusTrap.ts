import { useEffect, useRef, useCallback } from 'react';
import { getKeyboardFocusableElements, trapFocus } from '../utils/accessibility';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

export const useFocusTrap = ({
  isActive,
  onEscape,
  restoreFocus = true,
  autoFocus = true
}: UseFocusTrapOptions) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current || !isActive) return;

    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key === 'Tab') {
      trapFocus(containerRef.current, event);
    }
  }, [isActive, onEscape]);

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Auto-focus first element if enabled
    if (autoFocus && containerRef.current) {
      const focusableElements = getKeyboardFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      
      // Restore focus when trap is deactivated
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isActive, handleKeyDown, restoreFocus, autoFocus]);

  // Function to manually focus the first element
  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      const focusableElements = getKeyboardFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, []);

  // Function to manually focus the last element
  const focusLast = useCallback(() => {
    if (containerRef.current) {
      const focusableElements = getKeyboardFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
      }
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast
  };
};