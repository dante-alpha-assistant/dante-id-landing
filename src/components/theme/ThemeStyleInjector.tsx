import { useEffect } from 'react';
import { useCSSTransitions } from '../../hooks/useCSSTransitions';

interface ThemeStyleInjectorProps {
  theme: 'light' | 'dark';
  transitionEnabled: boolean;
  duration?: number;
  reduceMotion?: boolean;
  customProperties?: Record<string, string>;
}

export const ThemeStyleInjector = ({ 
  theme, 
  transitionEnabled, 
  duration = 250,
  reduceMotion = false,
  customProperties = {} 
}: ThemeStyleInjectorProps) => {
  useCSSTransitions({
    duration,
    enabled: transitionEnabled,
    reduceMotion
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    root.className = root.className.replace(/(light|dark)/, theme);
    if (!root.className.includes(theme)) {
      root.classList.add(theme);
    }

    // Apply custom properties
    Object.entries(customProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Theme-specific CSS variables
    const themeVars = theme === 'dark' ? {
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2a2a2a',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b3b3b3',
      '--border-color': '#404040',
      '--accent-color': '#3b82f6'
    } : {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#64748b',
      '--border-color': '#e2e8f0',
      '--accent-color': '#3b82f6'
    };

    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [theme, customProperties]);

  return null;
};