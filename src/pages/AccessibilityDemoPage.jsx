import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccessibleBreadcrumb } from '../components/AccessibleBreadcrumb';
import { ScreenReaderAnnouncer } from '../components/ScreenReaderAnnouncer';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAccessibilitySettings } from '../contexts/AccessibilityContext';

/**
 * Demo page showcasing accessibility features for breadcrumb navigation
 */
export function AccessibilityDemoPage() {
  const [announcement, setAnnouncement] = useState('');
  const { announce } = useAccessibility();
  const {
    settings,
    setHighContrast,
    setReduceMotion,
    setAnnouncements,
    setKeyboardNavigation,
    resetSettings
  } = useAccessibilitySettings();

  const handleTestAnnouncement = () => {
    const message = 'Test announcement: Breadcrumb navigation is working correctly';
    announce(message);
    setAnnouncement(message);
  };

  const customLabels = {
    'accessibility-demo': 'Accessibility Demo'
  };

  return (
    <div className="min-h-screen bg-md-background font-sans">
      {/* Header */}
      <header className="bg-md-surface-container border-b border-md-outline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-md-on-surface">
            Breadcrumb Nav - Accessibility Demo
          </h1>
          <p className="text-md-on-surface-variant mt-2">
            Testing accessibility features for breadcrumb navigation
          </p>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AccessibleBreadcrumb
          customLabels={customLabels}
          announceNavigation={settings.screenReaderAnnouncements}
          ariaLabel="Breadcrumb Nav accessibility demo navigation"
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Accessibility Features Demo */}
          <div className="bg-md-surface-container rounded-md-lg p-6">
            <h2 className="text-xl font-bold text-md-on-surface mb-4">
              Accessibility Features
            </h2>
            
            <div className="space-y-6">
              {/* Screen Reader Announcements */}
              <div>
                <h3 className="font-medium text-md-on-surface mb-2">
                  Screen Reader Announcements
                </h3>
                <p className="text-sm text-md-on-surface-variant mb-3">
                  Test live region announcements for navigation changes
                </p>
                <button
                  onClick={handleTestAnnouncement}
                  className="bg-md-primary text-md-on-primary px-4 py-2 rounded-full hover:bg-md-primary-container hover:text-md-on-primary-container transition-colors"
                  aria-describedby="announcement-help"
                >
                  Test Announcement
                </button>
                <p id="announcement-help" className="text-xs text-md-on-surface-variant mt-1">
                  This will trigger a screen reader announcement
                </p>
              </div>

              {/* Keyboard Navigation */}
              <div>
                <h3 className="font-medium text-md-on-surface mb-2">
                  Keyboard Navigation
                </h3>
                <p className="text-sm text-md-on-surface-variant mb-3">
                  Navigate breadcrumbs using keyboard:
                </p>
                <ul className="text-sm text-md-on-surface-variant space-y-1 ml-4">
                  <li>• <kbd className="bg-md-surface px-1 rounded">Tab</kbd> - Move between items</li>
                  <li>• <kbd className="bg-md-surface px-1 rounded">Arrow keys</kbd> - Alternative navigation</li>
                  <li>• <kbd className="bg-md-surface px-1 rounded">Enter/Space</kbd> - Activate links</li>
                  <li>• <kbd className="bg-md-surface px-1 rounded">Home/End</kbd> - Jump to first/last</li>
                </ul>
              </div>

              {/* ARIA Landmarks */}
              <div>
                <h3 className="font-medium text-md-on-surface mb-2">
                  ARIA Landmarks
                </h3>
                <p className="text-sm text-md-on-surface-variant">
                  Breadcrumb uses proper ARIA roles and labels:
                </p>
                <ul className="text-sm text-md-on-surface-variant space-y-1 mt-2 ml-4">
                  <li>• <code className="bg-md-surface px-1 rounded text-xs">role="navigation"</code></li>
                  <li>• <code className="bg-md-surface px-1 rounded text-xs">aria-label="Breadcrumb navigation"</code></li>
                  <li>• <code className="bg-md-surface px-1 rounded text-xs">aria-current="page"</code> for active item</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-md-surface-container rounded-md-lg p-6">
            <h2 className="text-xl font-bold text-md-on-surface mb-4">
              Accessibility Settings
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.highContrastMode}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-4 h-4 text-md-primary border-md-outline rounded focus:ring-md-primary"
                  aria-describedby="contrast-help"
                />
                <div>
                  <span className="text-sm font-medium text-md-on-surface">
                    High Contrast Mode
                  </span>
                  <p id="contrast-help" className="text-xs text-md-on-surface-variant">
                    Increases color contrast for better visibility
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) => setReduceMotion(e.target.checked)}
                  className="w-4 h-4 text-md-primary border-md-outline rounded focus:ring-md-primary"
                  aria-describedby="motion-help"
                />
                <div>
                  <span className="text-sm font-medium text-md-on-surface">
                    Reduce Motion
                  </span>
                  <p id="motion-help" className="text-xs text-md-on-surface-variant">
                    Minimizes animations and transitions
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.screenReaderAnnouncements}
                  onChange={(e) => setAnnouncements(e.target.checked)}
                  className="w-4 h-4 text-md-primary border-md-outline rounded focus:ring-md-primary"
                  aria-describedby="announcements-help"
                />
                <div>
                  <span className="text-sm font-medium text-md-on-surface">
                    Screen Reader Announcements
                  </span>
                  <p id="announcements-help" className="text-xs text-md-on-surface-variant">
                    Enable navigation announcements for screen readers
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.keyboardNavigationEnabled}
                  onChange={(e) => setKeyboardNavigation(e.target.checked)}
                  className="w-4 h-4 text-md-primary border-md-outline rounded focus:ring-md-primary"
                  aria-describedby="keyboard-help"
                />
                <div>
                  <span className="text-sm font-medium text-md-on-surface">
                    Enhanced Keyboard Navigation
                  </span>
                  <p id="keyboard-help" className="text-xs text-md-on-surface-variant">
                    Enable arrow key navigation and other keyboard shortcuts
                  </p>
                </div>
              </label>

              <button
                onClick={resetSettings}
                className="w-full mt-4 bg-md-error text-md-on-error px-4 py-2 rounded-full hover:bg-md-error-container hover:text-md-on-error-container transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 bg-md-surface-container rounded-md-lg p-6">
          <h2 className="text-xl font-bold text-md-on-surface mb-4">
            Test Navigation
          </h2>
          <p className="text-md-on-surface-variant mb-4">
            Use these links to test breadcrumb navigation and accessibility features:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/dashboard"
              className="block p-3 border border-md-outline rounded-lg hover:bg-md-surface-variant transition-colors"
            >
              <span className="text-md-on-surface font-medium">Dashboard</span>
              <p className="text-xs text-md-on-surface-variant mt-1">Main dashboard view</p>
            </Link>
            <Link
              to="/dashboard/123"
              className="block p-3 border border-md-outline rounded-lg hover:bg-md-surface-variant transition-colors"
            >
              <span className="text-md-on-surface font-medium">Project View</span>
              <p className="text-xs text-md-on-surface-variant mt-1">Specific project dashboard</p>
            </Link>
            <Link
              to="/editor/123"
              className="block p-3 border border-md-outline rounded-lg hover:bg-md-surface-variant transition-colors"
            >
              <span className="text-md-on-surface font-medium">Editor</span>
              <p className="text-xs text-md-on-surface-variant mt-1">Code editor interface</p>
            </Link>
          </div>
        </div>
      </main>

      {/* Screen Reader Announcer */}
      <ScreenReaderAnnouncer
        message={announcement}
        politeness="polite"
        clearTimeout={3000}
      />
    </div>
  );
}