import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Placeholder: BrandLogo (auto-inlined)
// Placeholder: DesktopNavigation (auto-inlined)
// Placeholder: MobileMenuToggle (auto-inlined)
// Placeholder: MobileMenu (auto-inlined)
// Placeholder: CTAButtons (auto-inlined)
import { supabase } from '../lib/supabase'

const navigationItems = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' }
]

const ctaButtons = [
  { href: '/login', label: 'Login', variant: 'secondary' as const },
  { href: '/signup', label: 'Sign Up', variant: 'primary' as const }
]

export default function NavigationBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const trackNavInteraction = async (eventType: string, target: string) => {
    try {
      await supabase.from('navigation_analytics').insert({
        id: crypto.randomUUID(),
        event_type: eventType,
        target: target,
        device_type: isMobile ? 'mobile' : 'desktop',
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID()
      })
    } catch (error) {
      console.log('Analytics tracking failed:', error)
    }
  }

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 bg-md-background border-b border-md-outline/20 transition-all duration-300 ${
        isScrolled ? 'nav-shadow' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BrandLogo onClick={() => trackNavInteraction('click', 'logo')} />
            
            {!isMobile && (
              <DesktopNavigation 
                items={navigationItems} 
                currentPath={location.pathname}
                onItemClick={(target) => trackNavInteraction('click', target)}
              />
            )}
            
            <div className="flex items-center space-x-4">
              {!isMobile && <CTAButtons buttons={ctaButtons} onButtonClick={(target) => trackNavInteraction('click', target)} />}
              {isMobile && (
                <MobileMenuToggle 
                  isOpen={isMobileMenuOpen} 
                  onToggle={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen)
                    trackNavInteraction(isMobileMenuOpen ? 'menu_close' : 'menu_open', 'mobile_menu')
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {isMobile && (
        <MobileMenu 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navigationItems={navigationItems}
          ctaButtons={ctaButtons}
          currentPath={location.pathname}
          onItemClick={(target) => {
            trackNavInteraction('click', target)
            setIsMobileMenuOpen(false)
          }}
        />
      )}
    </>
  )
}
function BrandLogo(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[BrandLogo]</div>; }

function DesktopNavigation(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[DesktopNavigation]</div>; }

function MobileMenuToggle(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileMenuToggle]</div>; }

function MobileMenu(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileMenu]</div>; }

function CTAButtons(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[CTAButtons]</div>; }
