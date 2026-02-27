import { useEffect, useRef } from 'react'
import { useBackToTop } from '../hooks/useBackToTop'
import { useAccessibility } from '../contexts/AccessibilityContext'

export function AccessibleBackToTopButton({ 
  className = '',
  ariaLabel = 'Back to top',
  testId = 'back-to-top-button'
}) {
  const { isVisible, scrollToTop } = useBackToTop()
  const { preferences } = useAccessibility()
  const buttonRef = useRef(null)
  const previousVisibility = useRef(false)

  // Announce to screen readers when button becomes visible
  useEffect(() => {
    if (isVisible && !previousVisibility.current && preferences.screenReader) {
      // Create a live region announcement
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.style.position = 'absolute'
      announcement.style.left = '-10000px'
      announcement.style.width = '1px'
      announcement.style.height = '1px'
      announcement.style.overflow = 'hidden'
      announcement.textContent = 'Back to top button is now available'
      
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }
    previousVisibility.current = isVisible
  }, [isVisible, preferences.screenReader])

  const handleClick = () => {
    scrollToTop('mouse')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      scrollToTop('keyboard')
    }
  }

  if (!isVisible) return null

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      data-testid={testId}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 rounded-full
        bg-md-primary text-md-on-primary
        shadow-lg hover:shadow-xl
        transition-all duration-200
        focus:outline-none
        ${preferences.highContrast ? 'ring-2 ring-white' : ''}
        ${preferences.reduceMotion ? '' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
      style={{
        // WCAG 2.1 AA compliant focus ring
        '--focus-ring-color': preferences.highContrast ? '#ffffff' : '#6750A4',
        boxShadow: `
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06)
        `
      }}
    >
      <BackToTopIcon 
        size={20}
        ariaHidden={true}
        className="mx-auto"
      />
      
      {/* Enhanced focus ring for keyboard navigation */}
      <div 
        className={`
          absolute inset-0 rounded-full
          ${preferences.focusIndicatorStyle === 'high-contrast' ? 'ring-4' : 'ring-2'}
          ring-transparent
          transition-all duration-150
        `}
        style={{
          ringColor: 'var(--focus-ring-color)',
          opacity: 0
        }}
      />
      
      <style jsx>{`
        button:focus + div,
        button:focus-visible + div {
          opacity: 1;
          ring-color: var(--focus-ring-color);
        }
      `}</style>
    </button>
  )
}

function BackToTopIcon({ size = 20, ariaHidden = true, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      role="img"
    >
      <title>Arrow pointing upward</title>
      <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    </svg>
  )
}