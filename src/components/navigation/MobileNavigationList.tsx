import { useLocation } from 'react-router-dom';
// Placeholder: MobileNavigationItem (auto-inlined);
import { NavigationItem } from '../../types/navigation';

interface MobileNavigationListProps {
  items: NavigationItem[];
  onItemClick: () => void;
}

const MobileNavigationList = ({ items, onItemClick }: MobileNavigationListProps) => {
  const location = useLocation();

  return (
    <nav className="py-6">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <MobileNavigationItem
              item={item}
              isActive={location.pathname === item.href}
              onClick={onItemClick}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileNavigationList;
function MobileNavigationItem(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileNavigationItem]</div>; }
