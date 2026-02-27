import React from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../providers/ThemeProvider'

export const DemoPage: React.FC = () => {
  const { theme } = useTheme()

  const components = [
    {
      title: 'Buttons',
      content: (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 theme-transition">
              Primary
            </button>
            <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 theme-transition">
              Secondary
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition">
              Outline
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Form Elements',
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Text input"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white theme-transition"
          />
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white theme-transition">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
          <textarea
            placeholder="Textarea"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white theme-transition"
          />
        </div>
      )
    },
    {
      title: 'Cards',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 theme-transition">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 theme-transition">Card Title</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm theme-transition">Card content goes here</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-600 theme-transition">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 theme-transition">Alternative Card</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm theme-transition">Different background style</p>
          </div>
        </div>
      )
    },
    {
      title: 'Theme Toggles',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 theme-transition">Small:</span>
            <ThemeToggle size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 theme-transition">Medium:</span>
            <ThemeToggle size="md" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 theme-transition">Large:</span>
            <ThemeToggle size="lg" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 theme-transition">No Label:</span>
            <ThemeToggle showLabel={false} />
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 theme-transition">
            Component Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 theme-transition">
            See how different UI components look in {theme} mode
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {components.map((component, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 theme-transition"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 theme-transition">
                {component.title}
              </h2>
              {component.content}
            </div>
          ))}
        </div>

        {/* Background Demonstration */}
        <div className="mt-8 p-8 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900 dark:to-gray-900 rounded-lg theme-transition">
          <h2 className="text-2xl font-bold text-brand-900 dark:text-brand-100 mb-4 theme-transition">
            Gradient Backgrounds
          </h2>
          <p className="text-brand-700 dark:text-brand-300 theme-transition">
            This section demonstrates how gradients and brand colors adapt to the current theme.
          </p>
        </div>
      </div>
    </div>
  )
}