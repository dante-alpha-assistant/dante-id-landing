import React from 'react'
import { useTheme } from '../providers/ThemeProvider'

export const HomePage: React.FC = () => {
  const { theme, systemTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 theme-transition">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 theme-transition">
            Dark Mode Test
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 theme-transition">
            Theme preference storage that persists across browser sessions and page refreshes
          </p>
          
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 theme-transition">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 theme-transition">
                Current: {theme}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                systemTheme === 'dark' ? 'bg-blue-400' : systemTheme === 'light' ? 'bg-yellow-400' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 theme-transition">
                System: {systemTheme || 'unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'localStorage Persistence',
              description: 'Theme preference is saved to localStorage and restored on page reload',
              icon: '💾'
            },
            {
              title: 'System Detection',
              description: 'Automatically detects and applies your OS theme preference',
              icon: '🎯'
            },
            {
              title: 'Cross-Tab Sync',
              description: 'Theme changes are synchronized across all open browser tabs',
              icon: '🔄'
            },
            {
              title: 'Smooth Transitions',
              description: 'Beautiful animations when switching between light and dark modes',
              icon: '✨'
            },
            {
              title: 'Error Handling',
              description: 'Gracefully handles localStorage errors and corrupted data',
              icon: '🛡️'
            },
            {
              title: 'Accessibility',
              description: 'Full keyboard navigation and screen reader support',
              icon: '♿'
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg theme-transition"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 theme-transition">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm theme-transition">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 theme-transition">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 theme-transition">
            Try It Out
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300 theme-transition">
            <p>1. Use the theme toggle in the navigation bar to switch between light and dark modes</p>
            <p>2. Refresh the page - your theme preference will be restored</p>
            <p>3. Open another tab with this app - the theme will be synchronized</p>
            <p>4. Check the Debug page for detailed information about the theme system</p>
          </div>
        </div>
      </div>
    </div>
  )
}