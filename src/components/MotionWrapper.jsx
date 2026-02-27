import { useAccessibility } from '../contexts/AccessibilityContext'

export function MotionWrapper({ 
  children, 
  animationType = 'fade',
  duration = 200,
  className = ''
}) {
  const { preferences } = useAccessibility()
  
  // Define animation classes based on type
  const getAnimationClasses = () => {
    if (preferences.reduceMotion) {
      return 'transition-none'
    }

    const baseTransition = `transition-all duration-${duration}`
    
    switch (animationType) {
      case 'fade':
        return `${baseTransition} ease-in-out`
      case 'scale':
        return `${baseTransition} ease-out transform`
      case 'slide':
        return `${baseTransition} ease-in-out transform`
      default:
        return baseTransition
    }
  }

  const animationClasses = getAnimationClasses()
  
  return (
    <div className={`${animationClasses} ${className}`.trim()}>
      {children}
    </div>
  )
}