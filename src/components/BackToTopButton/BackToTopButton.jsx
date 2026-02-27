import { useCallback } from 'react';
import { useScrollDetection, smoothScrollToTop } from '../../hooks/useScrollDetection';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';

/**
 * Back to Top Button Component
 * Appears when user scrolls past threshold, smoothly scrolls to top on click
 * 
 * @param {Object} props
 * @param {number} props.threshold - Scroll threshold in pixels (default: 300)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Custom aria-label for accessibility
 * @param {Function} props.onScrollToTop - Callback fired when button is clicked
 */
export const BackToTopButton = ({
  threshold = 300,
  className = '',
  ariaLabel = 'Scroll to top of page',
  onScrollToTop
}) => {
  const isVisible = useScrollDetection(threshold);

  const handleClick = useCallback(() => {
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'back_to_top_click', {
        event_category: 'interaction',
        event_label: window.location.pathname,
        value: Math.round(window.scrollY || window.pageYOffset)
      });
    }

    // Custom callback
    if (onScrollToTop) {
      onScrollToTop();
    }

    // Smooth scroll to top
    smoothScrollToTop();
  }, [onScrollToTop]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14
        rounded-full
        bg-md-primary text-md-on-primary
        shadow-md hover:shadow-lg
        transition-all duration-200 ease-out
        hover:scale-105 hover:bg-opacity-90
        focus:outline-none focus:ring-2 focus:ring-md-primary focus:ring-offset-2
        active:scale-95
        flex items-center justify-center
        animate-fade-in
        ${className}
      `}
    >
      <ArrowUpIcon size={20} />
    </button>
  );
};

// Animation keyframes for fade-in effect
const fadeInStyles = `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('back-to-top-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'back-to-top-styles';
  styleSheet.textContent = fadeInStyles;
  document.head.appendChild(styleSheet);
}