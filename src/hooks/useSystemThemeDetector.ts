import { useState, useEffect } from 'react';
import { trackThemeDetection } from '../services/themeAnalytics';
import { Theme } from '../types/theme';

export interface SystemThemeDetector {
  systemTheme: Theme | null;
  supportsSystemTheme: boolean;
  isDetecting: boolean;
}

export function useSystemThemeDetector(): SystemThemeDetector {
  const [systemTheme, setSystemTheme] = useState<Theme | null>(null);
  const [supportsSystemTheme, setSupportsSystemTheme] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectSystemTheme = () => {
      if (!window.matchMedia) {
        setSupportsSystemTheme(false);
        setIsDetecting(false);
        return;
      }

      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');
      
      setSupportsSystemTheme(true);
      
      let detectedTheme: Theme;
      if (darkModeQuery.matches) {
        detectedTheme = 'dark';
      } else if (lightModeQuery.matches) {
        detectedTheme = 'light';
      } else {
        detectedTheme = 'light'; // fallback
      }
      
      setSystemTheme(detectedTheme);
      setIsDetecting(false);
      
      // Track detection event
      trackThemeDetection({
        detected_theme: detectedTheme,
        supports_prefers_color_scheme: true,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newTheme);
      
      trackThemeDetection({
        detected_theme: newTheme,
        supports_prefers_color_scheme: true,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    detectSystemTheme();

    // Listen for system theme changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      darkModeQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (darkModeQuery.removeEventListener) {
        darkModeQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        darkModeQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  return {
    systemTheme,
    supportsSystemTheme,
    isDetecting
  };
}