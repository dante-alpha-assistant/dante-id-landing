import { useEffect, useState } from 'react';
// Placeholder: useSystemThemeDetector (auto-inlined);
import { isFirstVisit, markAsVisited } from '../utils/themeDetection';
import { saveUserThemePreferences } from '../services/themeAnalytics';
import { Theme } from '../types/theme';

export interface FirstVisitTheme {
  detectedTheme: Theme | null;
  isFirstVisit: boolean;
  hasDetected: boolean;
}

export function useFirstVisitTheme(): FirstVisitTheme {
  const [detectedTheme, setDetectedTheme] = useState<Theme | null>(null);
  const [isFirst, setIsFirst] = useState(false);
  const [hasDetected, setHasDetected] = useState(false);
  const { systemTheme, supportsSystemTheme, isDetecting } = useSystemThemeDetector();

  useEffect(() => {
    const checkFirstVisit = async () => {
      const firstVisit = isFirstVisit();
      setIsFirst(firstVisit);
      
      if (firstVisit && !isDetecting && systemTheme) {
        setDetectedTheme(systemTheme);
        setHasDetected(true);
        
        // Mark as visited
        markAsVisited();
        
        // Save to localStorage for immediate use
        localStorage.setItem('theme-preference', 'system');
        
        // Save to user preferences if logged in
        await saveUserThemePreferences({
          theme_preference: 'system',
          system_preference_detected: true
        });
      } else if (firstVisit && !supportsSystemTheme) {
        // Fallback for browsers without system theme support
        setDetectedTheme('light');
        setHasDetected(true);
        markAsVisited();
        
        localStorage.setItem('theme-preference', 'light');
        
        await saveUserThemePreferences({
          theme_preference: 'light',
          system_preference_detected: false
        });
      }
    };
    
    checkFirstVisit();
  }, [systemTheme, isDetecting, supportsSystemTheme]);

  return {
    detectedTheme,
    isFirstVisit: isFirst,
    hasDetected
  };
}
function useSystemThemeDetector(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useSystemThemeDetector]</div>; }
