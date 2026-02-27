import { Children, cloneElement } from 'react'
import { useAccessibility } from '../contexts/AccessibilityContext'

export function FocusRing({ 
  children, 
  visible = true, 
  highContrast = false,
  className = ''
}) {
  const { preferences } = useAccessibility()
  
  if (!visible || !Children.only(children)) {
    return children
  }

  const child = Children.only(children)
  
  // Determine focus ring style based on preferences
  const focusRingClass = `
    focus:outline-none
    focus-visible:outline-none
    ${preferences.focusIndicatorStyle === 'high-contrast' || highContrast
      ? 'focus:ring-4 focus-visible:ring-4 focus:ring-white focus-visible:ring-white'
      : 'focus:ring-2 focus-visible:ring-2 focus:ring-md-primary focus-visible:ring-md-primary'
    }
    focus:ring-offset-2 focus-visible:ring-offset-2
    ${preferences.highContrast ? 'focus:ring-offset-black focus-visible:ring-offset-black' : 'focus:ring-offset-transparent focus-visible:ring-offset-transparent'}
    transition-all duration-150
    ${className}
  `

  return cloneElement(child, {
    ...child.props,
    className: `${child.props.className || ''} ${focusRingClass}`.trim()
  })
}