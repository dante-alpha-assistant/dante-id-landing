import { createContext, useContext } from 'react';

interface ThemeTransitionState {
  isTransitioning: boolean;
  duration: number;
  transitionEnabled: boolean;
  reduceMotion: boolean;
}

interface ThemeTransitionActions {
  startTransition: () => void;
  endTransition: () => void;
  setTransitionEnabled: (enabled: boolean) => void;
  setDuration: (duration: number) => void;
  setReduceMotion: (reduce: boolean) => void;
}

type ThemeTransitionContextType = ThemeTransitionState & ThemeTransitionActions;

export const ThemeTransitionContext = createContext<ThemeTransitionContextType | null>(null);

export const useThemeTransition = () => {
  const context = useContext(ThemeTransitionContext);
  if (!context) {
    throw new Error('useThemeTransition must be used within ThemeTransitionProvider');
  }
  return context;
};