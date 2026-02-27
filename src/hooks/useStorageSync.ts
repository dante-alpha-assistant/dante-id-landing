import { useEffect } from 'react'
import { Theme } from '../types/theme'

export const useStorageSync = (
  onStorageChange: (newTheme: Theme | null) => void
) => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dark_mode_test_theme' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.theme_preference) {
            onStorageChange(parsed.theme_preference)
          }
        } catch {
          onStorageChange(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [onStorageChange])
}