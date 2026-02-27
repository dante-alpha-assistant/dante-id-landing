export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
} as const;

export const isActionKey = (key: string): boolean => {
  return key === KEYBOARD_KEYS.ENTER || key === KEYBOARD_KEYS.SPACE;
};

export const isNavigationKey = (key: string): boolean => {
  return [
    KEYBOARD_KEYS.TAB,
    KEYBOARD_KEYS.ARROW_UP,
    KEYBOARD_KEYS.ARROW_DOWN,
    KEYBOARD_KEYS.ARROW_LEFT,
    KEYBOARD_KEYS.ARROW_RIGHT,
    KEYBOARD_KEYS.HOME,
    KEYBOARD_KEYS.END
  ].includes(key as any);
};

export const handleActivation = (
  event: KeyboardEvent | React.KeyboardEvent,
  callback: () => void
) => {
  if (isActionKey(event.key)) {
    event.preventDefault();
    callback();
  }
};

export const createKeyboardHandler = (
  handlers: Record<string, (event: KeyboardEvent | React.KeyboardEvent) => void>
) => {
  return (event: KeyboardEvent | React.KeyboardEvent) => {
    const handler = handlers[event.key];
    if (handler) {
      handler(event);
    }
  };
};

export const preventDefaultForKeys = (
  keys: string[],
  event: KeyboardEvent | React.KeyboardEvent
) => {
  if (keys.includes(event.key)) {
    event.preventDefault();
  }
};

export const handleMenuNavigation = (
  event: KeyboardEvent | React.KeyboardEvent,
  menuItems: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void,
  onClose?: () => void
) => {
  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_DOWN:
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % menuItems.length;
      onIndexChange(nextIndex);
      menuItems[nextIndex]?.focus();
      break;
      
    case KEYBOARD_KEYS.ARROW_UP:
      event.preventDefault();
      const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
      onIndexChange(prevIndex);
      menuItems[prevIndex]?.focus();
      break;
      
    case KEYBOARD_KEYS.HOME:
      event.preventDefault();
      onIndexChange(0);
      menuItems[0]?.focus();
      break;
      
    case KEYBOARD_KEYS.END:
      event.preventDefault();
      const lastIndex = menuItems.length - 1;
      onIndexChange(lastIndex);
      menuItems[lastIndex]?.focus();
      break;
      
    case KEYBOARD_KEYS.ESCAPE:
      event.preventDefault();
      onClose?.();
      break;
  }
};

// Accessibility-focused click handler that works with keyboard
export const createAccessibleClickHandler = (onClick: () => void) => {
  return {
    onClick,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (isActionKey(event.key)) {
        event.preventDefault();
        onClick();
      }
    }
  };
};