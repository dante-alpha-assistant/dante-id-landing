import { Link, useLocation } from 'react-router-dom';
import { NavigationItem, CTAButton } from '../../types/navigation';

interface DesktopNavigationProps {
  menuItems: NavigationItem[];
  ctaButtons: CTAButton[];
}

const DesktopNavigation = ({ menuItems, ctaButtons }: DesktopNavigationProps) => {
  const location = useLocation();

  return (
    <nav className="flex items-center space-x-8">
      <div className="flex items-center space-x-6">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={`text-sm font-medium transition-colors ${
              location.pathname === item.href
                ? 'text-brand-600'
                : 'text-gray-900 hover:text-brand-600'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      
      <div className="flex items-center space-x-3">
        {ctaButtons.map((button) => (
          <Link
            key={button.id}
            to={button.href}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              button.variant === 'primary'
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'text-brand-600 hover:bg-brand-50'
            }`}
          >
            {button.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default DesktopNavigation;