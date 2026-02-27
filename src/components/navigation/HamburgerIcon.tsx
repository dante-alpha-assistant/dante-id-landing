import React from 'react';

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="w-6 h-6 relative">
        <span
          className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-200 ${
            isOpen ? 'rotate-45 top-3' : 'top-1'
          }`}
        />
        <span
          className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-200 top-3 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <span
          className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-200 ${
            isOpen ? '-rotate-45 top-3' : 'top-5'
          }`}
        />
      </div>
    </button>
  );
};