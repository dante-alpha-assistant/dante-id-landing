import { Theme, ThemeConfig } from '../types/theme'

const STORAGE_KEY = 'dark_mode_test_theme'
const CURRENT_VERSION = '1.0.0'

export const getStoredTheme = (): ThemeConfig | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as ThemeConfig
    
    // Validate stored data structure
    if (!parsed.theme_preference || !parsed.version) {
      console.warn('Invalid theme data found, clearing storage')
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.warn('Failed to parse stored theme data:', error)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {}
    return null
  }
}

export const saveTheme = (theme: Theme, userSet = true): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const existing = getStoredTheme()
    const config: ThemeConfig = {
      theme_preference: theme,
      last_updated: new Date().toISOString(),
      version: CURRENT_VERSION,
      system_theme_detected: existing?.system_theme_detected || false,
      user_manually_set: userSet
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}

export const clearThemeStorage = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    console.warn('Failed to clear theme storage:', error)
  }
}