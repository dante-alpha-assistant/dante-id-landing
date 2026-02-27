import { Theme } from '../types/theme';

export function detectSystemTheme(): Theme | null {
  if (!window.matchMedia) {
    return null;
  }
  
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');
  
  if (darkModeQuery.matches) {
    return 'dark';
  } else if (lightModeQuery.matches) {
    return 'light';
  }
  
  return 'light'; // fallback
}

export function supportsSystemThemeDetection(): boolean {
  return typeof window !== 'undefined' && 
         'matchMedia' in window && 
         window.matchMedia('(prefers-color-scheme)').media !== 'not all';
}

export function createSystemThemeListener(
  callback: (theme: Theme) => void
): () => void {
  if (!supportsSystemThemeDetection()) {
    return () => {};
  }
  
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  } else {
    // Fallback for older browsers
    darkModeQuery.addListener(handleChange);
    return () => darkModeQuery.removeListener(handleChange);
  }
}

export function isFirstVisit(): boolean {
  const hasVisited = localStorage.getItem('dark-mode-test-visited');
  return !hasVisited;
}

export function markAsVisited(): void {
  localStorage.setItem('dark-mode-test-visited', 'true');
}