import { useState, useEffect } from 'react'
import { useAccessibility } from '../contexts/AccessibilityContext'

export function useBackToTop(threshold = 300) {
  const [isVisible, setIsVisible] = useState(false)
  const { preferences, trackInteraction } = useAccessibility()

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsVisible(scrollTop > threshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const scrollToTop = (inputMethod = 'unknown') => {
    const scrollOptions = {
      top: 0,
      left: 0
    }

    // Respect motion preferences
    if (!preferences.reduceMotion) {
      scrollOptions.behavior = 'smooth'
    }

    window.scrollTo(scrollOptions)
    
    // Track the interaction
    trackInteraction('back-to-top-button', 'scroll-to-top', inputMethod)

    // Focus management - move to main content or skip link
    setTimeout(() => {
      const main = document.querySelector('main')
      const skipLink = document.querySelector('[data-skip-link]')
      const target = skipLink || main
      
      if (target) {
        target.focus()
      }
    }, preferences.reduceMotion ? 0 : 100)
  }

  return { isVisible, scrollToTop }
}