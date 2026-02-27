import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-full transition-all duration-200
        md3-typography-label-large
        hover:bg-[var(--md3-sys-color-surface-container)]
        focus:outline-none focus:ring-2 focus:ring-[var(--md3-sys-color-primary)]
        ${
          isActive
            ? 'text-[var(--md3-sys-color-primary)] bg-[var(--md3-sys-color-primary-container)]'
            : 'text-[var(--md3-sys-color-on-surface)]'
        }
      `}
      role="link"
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
      {isActive && (
        <span 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-[var(--md3-sys-color-primary)] rounded-full"
          aria-hidden="true"
        />
      )}
    </Link>
  );
};

export default NavLink;