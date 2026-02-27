import React from 'react';
// Placeholder: NavigationLink (auto-inlined);
import { NavigationItem } from '../../data/navigationConfig';

interface DesktopMenuProps {
  menuItems: NavigationItem[];
}

export const DesktopMenu: React.FC<DesktopMenuProps> = ({ menuItems }) => {
  return (
    <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
      {menuItems.map((item) => (
        <NavigationLink
          key={item.href}
          href={item.href}
          label={item.label}
          isActive={item.active || false}
          variant="desktop"
        />
      ))}
    </nav>
  );
};
function NavigationLink(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationLink]</div>; }
