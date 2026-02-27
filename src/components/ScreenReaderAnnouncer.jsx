import { useEffect, useRef } from 'react';

/**
 * Live region component for screen reader announcements
 * Provides accessible way to announce dynamic content changes
 */
export function ScreenReaderAnnouncer({ 
  message, 
  politeness = 'polite',
  clearTimeout = 3000,
  className = ''
}) {
  const timeoutRef = useRef(null);
  const messageRef = useRef('');

  useEffect(() => {
    if (message && message !== messageRef.current) {
      messageRef.current = message;
      
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to clear message
      if (clearTimeout > 0) {
        timeoutRef.current = setTimeout(() => {
          messageRef.current = '';
        }, clearTimeout);
      }
    }
  }, [message, clearTimeout]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    >
      {message}
    </div>
  );
}

/**
 * Higher-order component that adds screen reader announcements
 */
export function withScreenReaderAnnouncements(WrappedComponent) {
  return function ScreenReaderEnhancedComponent(props) {
    const { announcements = [], ...otherProps } = props;

    return (
      <>
        <WrappedComponent {...otherProps} />
        {announcements.map((announcement, index) => (
          <ScreenReaderAnnouncer
            key={`${announcement.message}-${index}`}
            message={announcement.message}
            politeness={announcement.politeness}
            clearTimeout={announcement.clearTimeout}
          />
        ))}
      </>
    );
  };
}