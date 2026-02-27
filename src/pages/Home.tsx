import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import DarkModeButton from '../components/DarkModeButton'
import DarkModeCard from '../components/DarkModeCard'
import { useTheme } from '../components/ThemeProvider'

export default function Home() {
  const { theme, isDark } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>(null)
  const [themeStats, setThemeStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Load user preferences
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        setPreferences(prefs)

        // Load recent theme changes
        const { data: stats } = await supabase
          .from('theme_analytics')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(5)
        
        setThemeStats(stats || [])
      }
    } catch (error) {
      console.log('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold themed-text mb-4">Welcome to Dark Mode Test</h1>
        <p className="text-xl themed-text-secondary mb-8">
          Experience our complete dark theme design system
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-4">Current Theme</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="themed-text-secondary">Active Theme:</span>
              <span className="themed-accent font-medium capitalize">{theme}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="themed-text-secondary">Appearance:</span>
              <span className="themed-text font-medium">{isDark ? 'Dark' : 'Light'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="themed-text-secondary">User:</span>
              <span className="themed-text font-medium">{user?.email}</span>
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-4">Theme Preferences</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="themed-text-secondary">Animations:</span>
              <span className="themed-text font-medium">
                {preferences?.enable_animations ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="themed-text-secondary">High Contrast:</span>
              <span className="themed-text font-medium">
                {preferences?.high_contrast ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="themed-text-secondary">Font Size:</span>
              <span className="themed-text font-medium capitalize">
                {preferences?.font_size || 'Medium'}
              </span>
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard className="md:col-span-2">
          <h2 className="text-2xl font-semibold themed-text mb-4">Component Showcase</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <DarkModeButton variant="primary">Primary</DarkModeButton>
                <DarkModeButton variant="secondary">Secondary</DarkModeButton>
                <DarkModeButton variant="outline">Outline</DarkModeButton>
                <DarkModeButton variant="ghost">Ghost</DarkModeButton>
                <DarkModeButton disabled>Disabled</DarkModeButton>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Form Elements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium themed-text mb-2">Input Field</label>
                  <input
                    type="text"
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 themed-surface themed-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 themed-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium themed-text mb-2">Select Dropdown</label>
                  <select className="w-full px-3 py-2 themed-surface themed-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 themed-text">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Text Styles</h3>
              <div className="space-y-2">
                <p className="themed-text">Primary text color with good contrast</p>
                <p className="themed-text-secondary">Secondary text for less important information</p>
                <p className="themed-accent">Accent color for links and highlights</p>
              </div>
            </div>
          </div>
        </DarkModeCard>

        {themeStats.length > 0 && (
          <DarkModeCard className="md:col-span-2">
            <h2 className="text-2xl font-semibold themed-text mb-4">Recent Theme Changes</h2>
            <div className="space-y-3">
              {themeStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between py-2 themed-border border-b last:border-0">
                  <span className="themed-text-secondary text-sm">
                    {stat.theme_from} → {stat.theme_to}
                  </span>
                  <span className="themed-text-secondary text-sm">
                    {new Date(stat.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </DarkModeCard>
        )}
      </div>
    </div>
  )
}