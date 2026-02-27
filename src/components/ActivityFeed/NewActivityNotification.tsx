import { useState, useEffect } from 'react';

interface NewActivityNotificationProps {
  count: number;
  onShow: () => void;
  onDismiss: () => void;
}

export function NewActivityNotification({ count, onShow, onDismiss }: NewActivityNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleShow = () => {
    setIsVisible(false);
    setTimeout(onShow, 300); // Allow fade out animation
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow fade out animation
  };

  return (
    <div 
      className={`border-b bg-blue-50 border-blue-200 px-4 py-3 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-800">
            {count} new activit{count === 1 ? 'y' : 'ies'} available
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShow}
            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
          >
            Show New
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}