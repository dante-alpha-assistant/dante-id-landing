export type Theme = 'light' | 'dark'

export interface ThemeConfig {
  theme_preference: Theme
  last_updated: string
  version: string
  system_theme_detected: boolean
  user_manually_set: boolean
}

export interface ThemeContextValue {
  theme: Theme
  systemTheme: Theme | null
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isLoading: boolean
}

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}