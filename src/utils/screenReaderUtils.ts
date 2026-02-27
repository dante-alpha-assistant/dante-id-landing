export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  timeout?: number;
}

export const announceToScreenReader = ({ 
  message, 
  priority = 'polite', 
  timeout = 1000 
}: ScreenReaderAnnouncement) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, timeout);
};

export const createLiveRegion = (id: string, priority: 'polite' | 'assertive' = 'polite') => {
  let region = document.getElementById(id);
  
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }
  
  return region;
};

export const updateLiveRegion = (id: string, message: string) => {
  const region = document.getElementById(id);
  if (region) {
    region.textContent = message;
  }
};

export const announcePageChange = (pageName: string) => {
  announceToScreenReader({
    message: `Navigated to ${pageName} page`,
    priority: 'polite',
    timeout: 1500
  });
};

export const announceMenuToggle = (isOpen: boolean, menuName: string = 'navigation menu') => {
  announceToScreenReader({
    message: `${menuName} ${isOpen ? 'opened' : 'closed'}`,
    priority: 'polite'
  });
};

export const announceLoadingState = (isLoading: boolean, context: string = 'content') => {
  if (isLoading) {
    announceToScreenReader({
      message: `Loading ${context}`,
      priority: 'polite'
    });
  } else {
    announceToScreenReader({
      message: `${context} loaded`,
      priority: 'polite'
    });
  }
};

export const createAccessibleDescription = (baseId: string, description: string): string => {
  const descriptionId = `${baseId}-description`;
  
  // Create or update description element
  let descElement = document.getElementById(descriptionId);
  if (!descElement) {
    descElement = document.createElement('div');
    descElement.id = descriptionId;
    descElement.className = 'sr-only';
    document.body.appendChild(descElement);
  }
  
  descElement.textContent = description;
  return descriptionId;
};

export const generateAriaLabel = (text: string, context?: string, state?: string): string => {
  let label = text;
  
  if (context) {
    label += `, ${context}`;
  }
  
  if (state) {
    label += `, ${state}`;
  }
  
  return label;
};

export const createScreenReaderOnlyText = (text: string): HTMLSpanElement => {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  return span;
};

// Hook-like function for managing screen reader state announcements
export const createAccessibilityAnnouncer = () => {
  const liveRegionId = 'accessibility-announcements';
  
  // Initialize live region
  createLiveRegion(liveRegionId, 'polite');
  
  return {
    announce: (message: string) => updateLiveRegion(liveRegionId, message),
    announceImportant: (message: string) => {
      announceToScreenReader({ message, priority: 'assertive' });
    },
    announcePageChange,
    announceMenuToggle,
    announceLoadingState
  };
};