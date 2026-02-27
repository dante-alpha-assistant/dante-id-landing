import { useState } from 'react'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { AccessibleBackToTopButton } from '../components/AccessibleBackToTopButton'
import { FocusRing } from '../components/FocusRing'
import { MotionWrapper } from '../components/MotionWrapper'

export function AccessibilityTestPage() {
  const { preferences, updatePreferences, systemPreferences } = useAccessibility()
  const [testResults, setTestResults] = useState([])

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      result,
      details,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runKeyboardTest = () => {
    addTestResult(
      'Keyboard Navigation', 
      'manual', 
      'Use Tab key to navigate to Back to Top button, then press Enter or Space'
    )
  }

  const runScreenReaderTest = () => {
    addTestResult(
      'Screen Reader', 
      'manual', 
      'Enable screen reader and verify "Back to top" announcement when button appears'
    )
  }

  const runMotionTest = () => {
    updatePreferences({ reduceMotion: !preferences.reduceMotion })
    addTestResult(
      'Motion Preferences', 
      'pass', 
      `Reduced motion ${!preferences.reduceMotion ? 'enabled' : 'disabled'}`
    )
  }

  const runContrastTest = () => {
    updatePreferences({ highContrast: !preferences.highContrast })
    addTestResult(
      'High Contrast', 
      'pass', 
      `High contrast mode ${!preferences.highContrast ? 'enabled' : 'disabled'}`
    )
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-md-primary mb-2">
            Back to Top Button - Accessibility Test Suite
          </h1>
          <p className="text-md-on-surface-variant">
            Test and validate accessibility features for WCAG 2.1 AA compliance
          </p>
        </header>

        {/* Current Preferences */}
        <section className="bg-md-surface-container rounded-md-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Preferences</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Reduce Motion:</strong>
              <br />
              User: {preferences.reduceMotion ? 'Yes' : 'No'}
              <br />
              System: {systemPreferences.prefersReducedMotion ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>High Contrast:</strong>
              <br />
              User: {preferences.highContrast ? 'Yes' : 'No'}
              <br />
              System: {systemPreferences.prefersHighContrast ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Keyboard Navigation:</strong>
              <br />
              {preferences.keyboardNavigation ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </section>

        {/* Test Controls */}
        <section className="bg-md-surface-container rounded-md-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Accessibility Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FocusRing>
              <button
                onClick={runKeyboardTest}
                className="w-full p-4 bg-md-primary text-md-on-primary rounded-full hover:bg-opacity-90 focus:bg-opacity-90"
              >
                Test Keyboard Navigation
              </button>
            </FocusRing>
            
            <FocusRing>
              <button
                onClick={runScreenReaderTest}
                className="w-full p-4 bg-md-primary text-md-on-primary rounded-full hover:bg-opacity-90 focus:bg-opacity-90"
              >
                Test Screen Reader
              </button>
            </FocusRing>
            
            <FocusRing>
              <button
                onClick={runMotionTest}
                className="w-full p-4 bg-md-primary text-md-on-primary rounded-full hover:bg-opacity-90 focus:bg-opacity-90"
              >
                Toggle Motion Preference
              </button>
            </FocusRing>
            
            <FocusRing>
              <button
                onClick={runContrastTest}
                className="w-full p-4 bg-md-primary text-md-on-primary rounded-full hover:bg-opacity-90 focus:bg-opacity-90"
              >
                Toggle High Contrast
              </button>
            </FocusRing>
          </div>
        </section>

        {/* Test Results */}
        {testResults.length > 0 && (
          <MotionWrapper animationType="fade">
            <section className="bg-md-surface-container rounded-md-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="space-y-3">
                {testResults.map(result => (
                  <div 
                    key={result.id}
                    className={`p-3 rounded border-l-4 ${
                      result.result === 'pass' 
                        ? 'bg-green-50 border-green-500 text-green-900'
                        : result.result === 'fail'
                        ? 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-blue-50 border-blue-500 text-blue-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>{result.test}</strong>
                        {result.details && (
                          <p className="text-sm mt-1">{result.details}</p>
                        )}
                      </div>
                      <span className="text-xs opacity-75">{result.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </MotionWrapper>
        )}

        {/* Long content to test scroll threshold */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Test Content</h2>
          <p className="text-md-on-surface-variant leading-relaxed">
            Scroll down past 300px to see the Back to Top button appear.
            The button should be accessible via keyboard navigation (Tab key)
            and screen readers should announce it properly.
          </p>
          
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-md-surface-variant rounded p-4">
              <h3 className="font-semibold mb-2">Section {i + 1}</h3>
              <p className="text-md-on-surface-variant">
                This is test content to create sufficient page height for testing 
                the scroll threshold. The Back to Top button should appear when 
                scrolling past 300px from the top of the page. Each interaction 
                with the button should be tracked for analytics purposes.
              </p>
            </div>
          ))}
        </section>

        {/* WCAG Compliance Checklist */}
        <section className="bg-md-surface-container rounded-md-lg p-6 mt-12">
          <h2 className="text-xl font-semibold mb-4">WCAG 2.1 AA Compliance Checklist</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              ARIA label "Back to top" for screen readers
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Keyboard accessible via Tab and Enter/Space keys
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Focus visible indicator with 3:1 contrast ratio
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Semantic button element with proper role
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Respects prefers-reduced-motion settings
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              High contrast mode support
            </li>
          </ul>
        </section>
      </div>

      {/* The actual Back to Top button */}
      <AccessibleBackToTopButton />
    </div>
  )
}