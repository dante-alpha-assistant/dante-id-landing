export const generateId = (prefix: string = 'nav') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createAriaLabel = (text: string, context?: string) => {
  return context ? `${text} - ${context}` : text;
};

export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const getKeyboardFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  const focusableElements = container.querySelectorAll(focusableElementsString);
  return Array.from(focusableElements) as HTMLElement[];
};

export const trapFocus = (container: HTMLElement, event: KeyboardEvent) => {
  const focusableElements = getKeyboardFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
};

export const handleEscapeKey = (event: KeyboardEvent, callback: () => void) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    callback();
  }
};

export const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
  element.setAttribute('aria-expanded', expanded.toString());
};

export const setAriaCurrent = (element: HTMLElement, current: string | null) => {
  if (current) {
    element.setAttribute('aria-current', current);
  } else {
    element.removeAttribute('aria-current');
  }
};