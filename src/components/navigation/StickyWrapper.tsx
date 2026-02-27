import React from 'react'
import useScrollPosition from '../../hooks/useScrollPosition'
// Placeholder: ScrollShadow (auto-inlined)

interface StickyWrapperProps {
  children: React.ReactNode
  threshold?: number
}

function StickyWrapper({ children, threshold = 300 }: StickyWrapperProps) {
  const { scrollY, isScrolled } = useScrollPosition(threshold)

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${isScrolled ? 'bg-white/95 backdrop-blur-md' : 'bg-transparent'}`}>
      {children}
      <ScrollShadow isVisible={isScrolled} />
    </div>
  )
}

export default StickyWrapper
function ScrollShadow(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ScrollShadow]</div>; }
