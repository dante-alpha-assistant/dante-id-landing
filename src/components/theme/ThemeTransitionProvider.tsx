import { useState, useCallback, useEffect } from 'react';
import { ThemeTransitionContext } from '../../contexts/ThemeTransitionContext';
// Placeholder: TransitionOverlay (auto-inlined);
// Placeholder: ThemeStyleInjector (auto-inlined);
// Placeholder: MotionPreferenceDetector (auto-inlined);

interface ThemeTransitionProviderProps {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark';
  transitionDuration?: number;
}

export const ThemeTransitionProvider = ({ 
  children, 
  initialTheme = 'light',
  transitionDuration = 250 
}: ThemeTransitionProviderProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [duration, setDuration] = useState(transitionDuration);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(initialTheme);

  const startTransition = useCallback(() => {
    if (transitionEnabled && !reduceMotion) {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, duration);
    }
  }, [transitionEnabled, reduceMotion, duration]);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const handleMotionPreference = useCallback((prefersReduced: boolean) => {
    setReduceMotion(prefersReduced);
    if (prefersReduced) {
      setTransitionEnabled(false);
    }
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const { theme } = event.detail;
      if (theme !== currentTheme) {
        startTransition();
        setCurrentTheme(theme);
      }
    };

    window.addEventListener('themeChange' as any, handleThemeChange);
    return () => window.removeEventListener('themeChange' as any, handleThemeChange);
  }, [currentTheme, startTransition]);

  const value = {
    isTransitioning,
    duration,
    transitionEnabled,
    reduceMotion,
    startTransition,
    endTransition,
    setTransitionEnabled,
    setDuration,
    setReduceMotion
  };

  return (
    <ThemeTransitionContext.Provider value={value}>
      <MotionPreferenceDetector 
        onPreferenceDetected={handleMotionPreference}
        fallbackValue={false}
      />
      <ThemeStyleInjector 
        theme={currentTheme}
        transitionEnabled={transitionEnabled}
        duration={duration}
        reduceMotion={reduceMotion}
      />
      <TransitionOverlay 
        isTransitioning={isTransitioning}
        duration={duration}
      />
      {children}
    </ThemeTransitionContext.Provider>
  );
};
function TransitionOverlay(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[TransitionOverlay]</div>; }

function ThemeStyleInjector(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ThemeStyleInjector]</div>; }

function MotionPreferenceDetector(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MotionPreferenceDetector]</div>; }
