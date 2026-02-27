import { Link } from 'react-router-dom';
import { useNavigationState } from '../../hooks/useNavigationState';
import { useNavigationData } from '../../hooks/useNavigationData';
// Placeholder: HamburgerIcon (auto-inlined);
// Placeholder: MobileMenuOverlay (auto-inlined);
// Placeholder: DesktopNavigation (auto-inlined);

interface NavigationContainerProps {
  children: React.ReactNode;
  isSticky?: boolean;
}

const NavigationContainer = ({ children, isSticky = true }: NavigationContainerProps) => {
  const { isOpen, isMobile, toggle, close } = useNavigationState();
  const { data, loading } = useNavigationData();

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Navigation Bar
              </Link>
              <div className="animate-pulse w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className={`bg-white border-b ${isSticky ? 'sticky top-0 z-40' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Navigation Bar
            </Link>
            
            {isMobile ? (
              <HamburgerIcon isOpen={isOpen} onClick={toggle} />
            ) : (
              <DesktopNavigation 
                menuItems={data.menuItems}
                ctaButtons={data.ctaButtons}
              />
            )}
          </div>
        </div>
      </header>
      
      {isMobile && (
        <MobileMenuOverlay
          isOpen={isOpen}
          onClose={close}
          menuItems={data.menuItems}
          ctaButtons={data.ctaButtons}
        />
      )}
      
      <main>{children}</main>
    </div>
  );
};

export default NavigationContainer;
function HamburgerIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[HamburgerIcon]</div>; }

function MobileMenuOverlay(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileMenuOverlay]</div>; }

function DesktopNavigation(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[DesktopNavigation]</div>; }
