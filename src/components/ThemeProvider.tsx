import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)

  // System theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches)
      }
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    let actualTheme: 'light' | 'dark'
    
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      actualTheme = theme
    }

    setIsDark(actualTheme === 'dark')
    document.documentElement.setAttribute('data-theme', actualTheme)
    document.documentElement.classList.toggle('dark', actualTheme === 'dark')
  }, [theme])

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      // Try localStorage first
      const stored = localStorage.getItem('theme')
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setTheme(stored as Theme)
        return
      }

      // Try to load from Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('user_preferences')
            .select('theme')
            .eq('user_id', user.id)
            .single()
          
          if (data?.theme) {
            setTheme(data.theme as Theme)
            localStorage.setItem('theme', data.theme)
          }
        }
      } catch (error) {
        console.log('Could not load theme preferences:', error)
      }
    }

    loadPreferences()
  }, [])

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    // Save to Supabase if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.log('Could not save theme preference:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}