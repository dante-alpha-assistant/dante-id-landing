import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  text: string;
  href: string;
  alt: string;
}

export const Logo: React.FC<LogoProps> = ({ text, href, alt }) => {
  return (
    <Link 
      to={href} 
      className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
      aria-label={alt}
    >
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
        NB
      </div>
      <span className="hidden sm:block">{text}</span>
    </Link>
  );
};