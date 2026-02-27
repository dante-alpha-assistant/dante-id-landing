import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { theme, actualTheme } = useTheme()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Dark Mode Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the dark mode toggle functionality
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Theme Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Selected Theme:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {theme}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Theme:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {actualTheme}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">System Preference:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            User Info
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {user.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="font-mono text-xs text-gray-900 dark:text-white">
                {user.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Theme Toggle Instructions
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Use the toggle switch in the navigation bar to change themes</li>
            <li>The toggle immediately applies the selected theme</li>
            <li>Your preference is saved automatically</li>
            <li>The theme persists across browser sessions</li>
            <li>Visit Settings → Appearance for more theme options</li>
          </ol>
        </div>
      </div>
    </div>
  )
}