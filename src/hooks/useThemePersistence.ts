import { useState, useEffect, useCallback } from 'react'
import { Theme } from '../types/theme'
import { getStoredTheme, saveTheme } from '../utils/themeStorage'
// Placeholder: useSystemTheme (auto-inlined)
// Placeholder: useStorageSync (auto-inlined)

export const useThemePersistence = (defaultTheme: Theme = 'light') => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)
  const systemTheme = useSystemTheme()

  // Initialize theme from storage or system preference
  useEffect(() => {
    const initializeTheme = () => {
      const stored = getStoredTheme()
      
      if (stored) {
        setThemeState(stored.theme_preference)
      } else if (systemTheme) {
        setThemeState(systemTheme)
        saveTheme(systemTheme, false) // Mark as not user-set
      } else {
        setThemeState(defaultTheme)
      }
      
      setIsLoading(false)
    }

    // Small delay to prevent flash
    const timer = setTimeout(initializeTheme, 50)
    return () => clearTimeout(timer)
  }, [systemTheme, defaultTheme])

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    saveTheme(newTheme, true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  // Handle storage changes from other tabs
  const handleStorageSync = useCallback((newTheme: Theme | null) => {
    if (newTheme && newTheme !== theme) {
      setThemeState(newTheme)
    }
  }, [theme])

  useStorageSync(handleStorageSync)

  return {
    theme,
    systemTheme,
    setTheme,
    toggleTheme,
    isLoading
  }
}
function useSystemTheme(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useSystemTheme]</div>; }

function useStorageSync(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useStorageSync]</div>; }
