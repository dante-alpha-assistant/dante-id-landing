import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
// Placeholder: useAuth (auto-inlined)

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  loading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getActualTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'auto' ? getSystemTheme() : theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const actualTheme = getActualTheme(theme)

  // Load theme from localStorage or user preferences
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (user) {
          // Load from Supabase
          const { data } = await supabase
            .from('user_preferences')
            .select('theme')
            .eq('user_id', user.id)
            .single()
          
          if (data?.theme) {
            setThemeState(data.theme as Theme)
          } else {
            // Create default preference
            await supabase
              .from('user_preferences')
              .upsert({ user_id: user.id, theme: 'auto' })
          }
        } else {
          // Load from localStorage
          const saved = localStorage.getItem('theme') as Theme
          if (saved && ['light', 'dark', 'auto'].includes(saved)) {
            setThemeState(saved)
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
        const saved = localStorage.getItem('theme') as Theme
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
          setThemeState(saved)
        }
      } finally {
        setLoading(false)
      }
    }

    loadTheme()
  }, [user])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
  }, [actualTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'auto') {
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(getSystemTheme())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            theme: newTheme,
            updated_at: new Date().toISOString()
          })

        // Track theme change
        await supabase
          .from('theme_analytics')
          .insert({
            user_id: user.id,
            theme_from: theme,
            theme_to: newTheme,
            session_id: crypto.randomUUID()
          })
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
function useAuth(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useAuth]</div>; }
