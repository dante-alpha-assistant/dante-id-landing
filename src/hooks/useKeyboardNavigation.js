import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing keyboard navigation through breadcrumb items
 */
export function useKeyboardNavigation({
  items = [],
  onNavigate,
  containerRef,
  autoFocus = false
}) {
  const currentIndexRef = useRef(-1);
  const itemRefs = useRef(new Map());

  // Store ref for each item
  const setItemRef = useCallback((index, ref) => {
    if (ref) {
      itemRefs.current.set(index, ref);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  // Focus specific item by index
  const focusItem = useCallback((index) => {
    const item = itemRefs.current.get(index);
    if (item) {
      item.focus();
      currentIndexRef.current = index;
    }
  }, []);

  // Move focus to next/previous item
  const moveFocus = useCallback((direction) => {
    const currentIndex = currentIndexRef.current;
    const itemCount = items.length;
    
    if (itemCount === 0) return;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
    }

    focusItem(nextIndex);
  }, [items.length, focusItem]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event, index) => {
    const { key } = event;

    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveFocus('next');
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveFocus('previous');
        break;
      
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      
      case 'End':
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        const item = items[index];
        if (item && onNavigate) {
          onNavigate(item);
        }
        break;
      
      default:
        // Don't prevent default for other keys
        break;
    }
  }, [items, moveFocus, focusItem, onNavigate]);

  // Handle focus events to track current index
  const handleFocus = useCallback((index) => {
    currentIndexRef.current = index;
  }, []);

  // Auto-focus first item if requested
  useEffect(() => {
    if (autoFocus && items.length > 0) {
      focusItem(0);
    }
  }, [autoFocus, items.length, focusItem]);

  // Reset refs when items change
  useEffect(() => {
    const currentItemCount = itemRefs.current.size;
    const newItemCount = items.length;
    
    // Clear refs if item count decreased
    if (currentItemCount > newItemCount) {
      const keysToDelete = [];
      for (const [index] of itemRefs.current) {
        if (index >= newItemCount) {
          keysToDelete.push(index);
        }
      }
      keysToDelete.forEach(key => itemRefs.current.delete(key));
    }

    // Reset current index if it's out of bounds
    if (currentIndexRef.current >= newItemCount) {
      currentIndexRef.current = -1;
    }
  }, [items.length]);

  return {
    setItemRef,
    handleKeyDown,
    handleFocus,
    focusItem,
    currentIndex: currentIndexRef.current
  };
}