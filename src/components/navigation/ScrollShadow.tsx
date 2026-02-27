import React from 'react'

interface ScrollShadowProps {
  isVisible: boolean
}

function ScrollShadow({ isVisible }: ScrollShadowProps) {
  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        boxShadow: isVisible ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
      }}
    />
  )
}

export default ScrollShadow