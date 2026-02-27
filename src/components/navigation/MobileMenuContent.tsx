// Placeholder: MobileNavigationList (auto-inlined);
// Placeholder: MobileCTASection (auto-inlined);
import { NavigationItem, CTAButton } from '../../types/navigation';

interface MobileMenuContentProps {
  menuItems: NavigationItem[];
  ctaButtons: CTAButton[];
  onItemClick: () => void;
}

const MobileMenuContent = ({ menuItems, ctaButtons, onItemClick }: MobileMenuContentProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Navigation Bar</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <MobileNavigationList 
          items={menuItems}
          onItemClick={onItemClick}
        />
      </div>
      
      <div className="p-6 border-t bg-gray-50">
        <MobileCTASection 
          ctaButtons={ctaButtons}
          onButtonClick={onItemClick}
        />
      </div>
    </div>
  );
};

export default MobileMenuContent;
function MobileNavigationList(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileNavigationList]</div>; }

function MobileCTASection(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileCTASection]</div>; }
