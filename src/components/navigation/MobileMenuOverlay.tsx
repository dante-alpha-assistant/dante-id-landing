import React, { useEffect } from 'react';
// Placeholder: NavigationLink (auto-inlined);
// Placeholder: CTAButtons (auto-inlined);
import { NavigationItem, CTAButton } from '../../data/navigationConfig';

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: NavigationItem[];
  ctaButtons: CTAButton[];
}

export const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({
  isOpen,
  onClose,
  menuItems,
  ctaButtons
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Content */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={item.active || false}
                variant="mobile"
                onClick={onClose}
              />
            ))}
          </nav>
          
          {/* CTA Buttons */}
          <div className="p-4 border-t border-gray-200">
            <CTAButtons buttons={ctaButtons} variant="mobile" />
          </div>
        </div>
      </div>
    </div>
  );
};
function NavigationLink(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationLink]</div>; }

function CTAButtons(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[CTAButtons]</div>; }
