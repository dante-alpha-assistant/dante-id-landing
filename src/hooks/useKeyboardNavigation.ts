import { useCallback, useEffect, useRef } from 'react';
import { trapFocus, handleEscapeKey } from '../utils/accessibility';

interface UseKeyboardNavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
  containerRef?: React.RefObject<HTMLElement>;
  enableFocusTrap?: boolean;
}

export const useKeyboardNavigation = ({
  isOpen = false,
  onClose,
  containerRef,
  enableFocusTrap = false
}: UseKeyboardNavigationProps) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (onClose) {
      handleEscapeKey(event, onClose);
    }

    if (enableFocusTrap && containerRef?.current && isOpen) {
      trapFocus(containerRef.current, event);
    }
  }, [isOpen, onClose, containerRef, enableFocusTrap]);

  useEffect(() => {
    if (isOpen && enableFocusTrap) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first focusable element
      setTimeout(() => {
        if (containerRef?.current) {
          const firstFocusable = containerRef.current.querySelector('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
          firstFocusable?.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isOpen, enableFocusTrap, handleKeyDown, containerRef]);

  const navigateToNext = useCallback(() => {
    const currentElement = document.activeElement as HTMLElement;
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
    
    if (nextElement) {
      nextElement.focus();
    }
  }, []);

  const navigateToPrevious = useCallback(() => {
    const currentElement = document.activeElement as HTMLElement;
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    const previousElement = focusableElements[currentIndex - 1] as HTMLElement;
    
    if (previousElement) {
      previousElement.focus();
    }
  }, []);

  return {
    navigateToNext,
    navigateToPrevious,
    handleKeyDown
  };
};