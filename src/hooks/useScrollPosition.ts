import { useState, useEffect } from 'react'
import { throttle } from '../utils/scrollThrottle'

function useScrollPosition(threshold: number = 300) {
  const [scrollY, setScrollY] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = throttle(() => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsScrolled(currentScrollY > threshold)
    }, 16) // 60fps

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return { scrollY, isScrolled }
}

export default useScrollPosition