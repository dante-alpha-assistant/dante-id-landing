import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationConfig, NavigationConfig } from '../data/navigationConfig';

export const useNavigation = () => {
  const [config, setConfig] = useState<NavigationConfig>(navigationConfig);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getActiveMenuItems = () => {
    return config.menuItems.map(item => ({
      ...item,
      active: item.href === location.pathname || 
              (item.href === '/' && location.pathname === '/')
    }));
  };

  return {
    config,
    isMobileMenuOpen,
    isScrolled,
    currentPath: location.pathname,
    toggleMobileMenu,
    closeMobileMenu,
    activeMenuItems: getActiveMenuItems()
  };
};