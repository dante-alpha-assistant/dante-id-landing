import React from 'react'
import { useTheme } from '../providers/ThemeProvider'
import { getStoredTheme, clearThemeStorage } from '../utils/themeStorage'

interface ThemeDebugPanelProps {
  visible?: boolean
  onReset?: () => void
  onExport?: () => void
}

export const ThemeDebugPanel: React.FC<ThemeDebugPanelProps> = ({
  visible = true,
  onReset,
  onExport
}) => {
  const { theme, systemTheme, setTheme, isLoading } = useTheme()
  const storedData = getStoredTheme()

  const handleReset = () => {
    clearThemeStorage()
    window.location.reload()
    onReset?.()
  }

  const handleExport = () => {
    const debugData = {
      currentTheme: theme,
      systemTheme,
      storedData,
      isLoading,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theme-debug-data.json'
    a.click()
    URL.revokeObjectURL(url)
    
    onExport?.()
  }

  if (!visible) return null

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 theme-transition">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Theme Debug Panel
      </h3>
      
      {/* Current State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Current State</h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Active Theme: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{theme}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              System Theme: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{systemTheme || 'unknown'}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Loading: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{isLoading.toString()}</span>
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Stored Data</h4>
          <div className="text-sm">
            {storedData ? (
              <div className="space-y-1">
                <p className="text-gray-600 dark:text-gray-400">
                  Preference: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{storedData.theme_preference}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  User Set: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{storedData.user_manually_set.toString()}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Version: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{storedData.version}</span>
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-500 italic">No stored data</p>
            )}
          </div>
        </div>
      </div>

      {/* Theme Controls */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Theme Controls</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            disabled={theme === 'light' || isLoading}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded border hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            disabled={theme === 'dark' || isLoading}
            className="px-3 py-1 bg-gray-700 text-white rounded border hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Dark
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 theme-transition"
        >
          Reset Storage
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 theme-transition"
        >
          Export Debug Data
        </button>
      </div>
    </div>
  )
}