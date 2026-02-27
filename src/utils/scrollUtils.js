/**
 * Smooth scroll utilities with cross-browser support
 */

/**
 * Easing function for smooth scroll animation
 * @param {number} t - Time progress (0 to 1)
 * @returns {number} Eased value
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Smooth scroll to top with custom duration and easing
 * @param {Object} options - Scroll options
 * @param {number} options.duration - Animation duration in ms (default: 600)
 * @param {Function} options.onComplete - Callback when animation completes
 * @param {boolean} options.respectReducedMotion - Whether to respect prefers-reduced-motion
 */
export function smoothScrollToTop({
  duration = 600,
  onComplete = null,
  respectReducedMotion = true
} = {}) {
  const startScrollY = window.scrollY;
  
  // Instant scroll if reduced motion is preferred
  if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (onComplete) onComplete();
    return;
  }

  // If already at top, no need to scroll
  if (startScrollY === 0) {
    if (onComplete) onComplete();
    return;
  }

  const startTime = performance.now();
  let animationId = null;
  let isAnimating = true;

  function animate(currentTime) {
    if (!isAnimating) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    
    const currentScrollY = startScrollY - (startScrollY * easedProgress);
    
    window.scrollTo({ top: currentScrollY, behavior: 'auto' });

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      isAnimating = false;
      if (onComplete) onComplete();
    }
  }

  // Start animation
  animationId = requestAnimationFrame(animate);

  // Return cancel function to interrupt animation
  return () => {
    isAnimating = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * Calculate scroll progress as percentage
 * @returns {number} Scroll progress (0-100)
 */
export function getScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  
  if (docHeight <= 0) return 0;
  
  return Math.min((scrollTop / docHeight) * 100, 100);
}