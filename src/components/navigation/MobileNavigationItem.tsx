import { Link } from 'react-router-dom';
import { NavigationItem } from '../../types/navigation';

interface MobileNavigationItemProps {
  item: NavigationItem;
  isActive?: boolean;
  onClick: () => void;
}

const MobileNavigationItem = ({ item, isActive, onClick }: MobileNavigationItemProps) => {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`block px-6 py-3 text-lg font-medium transition-colors min-h-[44px] flex items-center ${
        isActive 
          ? 'text-brand-600 bg-brand-50 border-r-2 border-brand-600' 
          : 'text-gray-900 hover:text-brand-600 hover:bg-gray-50'
      }`}
    >
      {item.label}
    </Link>
  );
};

export default MobileNavigationItem;