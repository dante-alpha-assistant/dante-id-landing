import React from 'react'
import { ThemeDebugPanel } from '../components/ThemeDebugPanel'

export const DebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 theme-transition">
            Theme System Debug
          </h1>
          <p className="text-gray-600 dark:text-gray-400 theme-transition">
            Inspect and test the theme persistence system
          </p>
        </div>

        <ThemeDebugPanel />

        {/* Additional Debug Info */}
        <div className="mt-8 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 theme-transition">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 theme-transition">
              How It Works
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 theme-transition">
              <p><strong>1. Initialization:</strong> On first load, the system checks localStorage for saved preferences.</p>
              <p><strong>2. System Detection:</strong> If no saved preference exists, it detects the OS theme using `prefers-color-scheme`.</p>
              <p><strong>3. Persistence:</strong> When a user toggles the theme, it's immediately saved to localStorage with metadata.</p>
              <p><strong>4. Synchronization:</strong> Storage events are used to sync theme changes across browser tabs.</p>
              <p><strong>5. Error Handling:</strong> Corrupted localStorage data is automatically cleared and defaults are applied.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 theme-transition">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 theme-transition">
              Technical Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Storage Key</h4>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">dark_mode_test_theme</code>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Storage Format</h4>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs block">JSON with metadata</code>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">CSS Implementation</h4>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Tailwind dark: class</code>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Transition Duration</h4>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">300ms</code>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 theme-transition">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 theme-transition">
              Browser Compatibility
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Chrome</div>
                <div className="text-gray-500 text-xs">Full support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Firefox</div>
                <div className="text-gray-500 text-xs">Full support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Safari</div>
                <div className="text-gray-500 text-xs">Full support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⚠️</div>
                <div className="font-medium text-gray-700 dark:text-gray-300">IE/Legacy</div>
                <div className="text-gray-500 text-xs">Limited</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}