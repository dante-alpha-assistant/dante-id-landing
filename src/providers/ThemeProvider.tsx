import React, { createContext, useContext } from 'react'
import { ThemeContextValue, ThemeProviderProps } from '../types/theme'
import { useThemePersistence } from '../hooks/useThemePersistence'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light'
}) => {
  const themeState = useThemePersistence(defaultTheme)

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}