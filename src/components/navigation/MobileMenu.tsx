import React, { useEffect } from 'react'
// Placeholder: NavigationLinks (auto-inlined)
// Placeholder: CTAButtons (auto-inlined)

interface NavigationItem {
  href: string
  label: string
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavigationItem[]
}

function MobileMenu({ isOpen, onClose, navigationItems }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold text-primary-600">
            Navigation Bar
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <NavigationLinks 
              items={navigationItems}
              currentPage={window.location.pathname}
              onClick={onClose}
            />
          </div>
          
          <div className="pt-4 border-t">
            <CTAButtons />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
function NavigationLinks(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationLinks]</div>; }

function CTAButtons(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[CTAButtons]</div>; }
