import { createContext, useContext, useState, useEffect } from 'react'
// Placeholder: useAuth (auto-inlined)
import { supabase } from '../lib/supabase'

const AccessibilityContext = createContext()

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export function AccessibilityProvider({ children }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState({
    reduceMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicatorStyle: 'standard'
  })
  const [systemPreferences, setSystemPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false
  })

  // Detect system preferences
  useEffect(() => {
    const detectSystemPreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      setSystemPreferences({
        prefersReducedMotion,
        prefersHighContrast
      })
    }

    detectSystemPreferences()

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    
    motionQuery.addListener(detectSystemPreferences)
    contrastQuery.addListener(detectSystemPreferences)

    return () => {
      motionQuery.removeListener(detectSystemPreferences)
      contrastQuery.removeListener(detectSystemPreferences)
    }
  }, [])

  // Load user preferences
  useEffect(() => {
    if (user) {
      loadUserPreferences()
    } else {
      // Use system preferences for unauthenticated users
      setPreferences(prev => ({
        ...prev,
        reduceMotion: systemPreferences.prefersReducedMotion,
        highContrast: systemPreferences.prefersHighContrast
      }))
    }
  }, [user, systemPreferences])

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_accessibility_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error loading accessibility preferences:', error)
        return
      }

      if (data) {
        setPreferences({
          reduceMotion: data.reduce_motion,
          highContrast: data.high_contrast,
          screenReader: data.screen_reader,
          keyboardNavigation: data.keyboard_navigation,
          focusIndicatorStyle: data.focus_indicator_style
        })
      } else {
        // Create default preferences with system preferences
        await updatePreferences({
          reduceMotion: systemPreferences.prefersReducedMotion,
          highContrast: systemPreferences.prefersHighContrast
        })
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error)
    }
  }

  const updatePreferences = async (updates) => {
    if (!user) return

    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)

    try {
      const { error } = await supabase
        .from('user_accessibility_preferences')
        .upsert({
          user_id: user.id,
          reduce_motion: newPreferences.reduceMotion,
          high_contrast: newPreferences.highContrast,
          screen_reader: newPreferences.screenReader,
          keyboard_navigation: newPreferences.keyboardNavigation,
          focus_indicator_style: newPreferences.focusIndicatorStyle,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating accessibility preferences:', error)
      }
    } catch (error) {
      console.error('Error updating accessibility preferences:', error)
    }
  }

  const trackInteraction = async (component, action, inputMethod) => {
    if (!user) return

    try {
      await supabase
        .from('accessibility_analytics')
        .insert({
          user_id: user.id,
          component,
          action,
          input_method: inputMethod,
          page_url: window.location.pathname,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking accessibility interaction:', error)
    }
  }

  const value = {
    preferences: {
      ...preferences,
      // Always respect system preferences if user hasn't explicitly overridden
      reduceMotion: preferences.reduceMotion || systemPreferences.prefersReducedMotion,
      highContrast: preferences.highContrast || systemPreferences.prefersHighContrast
    },
    systemPreferences,
    updatePreferences,
    trackInteraction
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
function useAuth(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useAuth]</div>; }
