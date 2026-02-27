import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../components/ThemeProvider'
import DarkModeButton from '../components/DarkModeButton'
import DarkModeCard from '../components/DarkModeCard'
import ThemeToggle from '../components/ThemeToggle'

export default function AppearanceSettings() {
  const { theme } = useTheme()
  const [preferences, setPreferences] = useState({
    theme: 'system',
    enable_animations: true,
    high_contrast: false,
    font_size: 'medium'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setPreferences(data)
        }
      }
    } catch (error) {
      console.log('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            ...preferences,
            user_id: user.id,
            updated_at: new Date().toISOString()
          })
        
        alert('Preferences saved successfully!')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold themed-text mb-4">Appearance Settings</h1>
        <p className="text-xl themed-text-secondary">
          Customize your Dark Mode Test experience
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-6">Theme Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium themed-text mb-3">
                Theme Mode
              </label>
              <div className="flex items-center justify-center">
                <ThemeToggle showLabel={true} size="lg" />
              </div>
              <p className="text-sm themed-text-secondary mt-2">
                Current theme: <span className="capitalize themed-accent">{theme}</span>
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.enable_animations}
                  onChange={(e) => updatePreference('enable_animations', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="themed-text">Enable animations and transitions</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.high_contrast}
                  onChange={(e) => updatePreference('high_contrast', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="themed-text">High contrast mode</span>
              </label>
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-6">Accessibility</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium themed-text mb-3">
                Font Size
              </label>
              <select
                value={preferences.font_size}
                onChange={(e) => updatePreference('font_size', e.target.value)}
                className="w-full px-3 py-2 themed-surface themed-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 themed-text"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium themed-text">Preview</h3>
              <div className="p-4 themed-surface rounded-lg themed-border border">
                <p className={`themed-text ${
                  preferences.font_size === 'small' ? 'text-sm' :
                  preferences.font_size === 'large' ? 'text-lg' : 'text-base'
                }`}>
                  This is how text will appear with your current settings.
                </p>
                <p className={`themed-text-secondary mt-2 ${
                  preferences.font_size === 'small' ? 'text-xs' :
                  preferences.font_size === 'large' ? 'text-base' : 'text-sm'
                }`}>
                  Secondary text example with reduced opacity.
                </p>
              </div>
            </div>
          </div>
        </DarkModeCard>
      </div>

      <div className="flex justify-center">
        <DarkModeButton
          onClick={savePreferences}
          loading={saving}
          size="lg"
        >
          Save Preferences
        </DarkModeButton>
      </div>
    </div>
  )
}