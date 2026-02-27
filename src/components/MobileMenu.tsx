import { useEffect } from 'react'
// Placeholder: NavigationLink (auto-inlined)
// Placeholder: CTAButton (auto-inlined)

interface NavigationItem {
  href: string
  label: string
}

interface CTAButtonConfig {
  href: string
  label: string
  variant: 'primary' | 'secondary'
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavigationItem[]
  ctaButtons: CTAButtonConfig[]
  currentPath: string
  onItemClick: (target: string) => void
}

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  navigationItems, 
  ctaButtons, 
  currentPath, 
  onItemClick 
}: MobileMenuProps) {
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
    <div className="fixed inset-0 z-40 md:hidden">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      <div className="fixed top-16 left-0 right-0 bottom-0 bg-md-background p-6">
        <div className="flex flex-col space-y-6">
          <div className="space-y-4">
            {navigationItems.map((item) => (
              <NavigationLink 
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={currentPath === item.href}
                onClick={() => onItemClick(item.label)}
                className="block text-lg py-2"
              />
            ))}
          </div>
          
          <div className="pt-6 border-t border-md-outline/20 space-y-3">
            {ctaButtons.map((button) => (
              <CTAButton 
                key={button.href}
                href={button.href}
                label={button.label}
                variant={button.variant}
                className="w-full justify-center"
                onClick={() => onItemClick(button.label)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
function NavigationLink(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationLink]</div>; }

function CTAButton(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[CTAButton]</div>; }
