import { useEffect } from 'react';
import { themeSyncManager } from '../utils/themeSyncManager';

interface UseThemeSyncProps {
  onThemeChange: (theme: 'light' | 'dark') => void;
  currentTheme: 'light' | 'dark';
}

export const useThemeSync = ({ onThemeChange, currentTheme }: UseThemeSyncProps) => {
  useEffect(() => {
    const unsubscribe = themeSyncManager.subscribe((theme) => {
      if (theme !== currentTheme) {
        onThemeChange(theme);
      }
    });
    
    return unsubscribe;
  }, [onThemeChange, currentTheme]);
  
  const broadcastThemeChange = (theme: 'light' | 'dark') => {
    themeSyncManager.broadcastThemeChange(theme);
  };
  
  return {
    broadcastThemeChange
  };
};