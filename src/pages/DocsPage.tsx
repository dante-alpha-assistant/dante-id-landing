import React from 'react';

export const DocsPage: React.FC = () => {
  const sections = [
    {
      title: 'Getting Started',
      items: [
        'Installation',
        'Quick Setup',
        'Configuration',
        'First Navigation'
      ]
    },
    {
      title: 'Components',
      items: [
        'NavigationBar',
        'Logo',
        'DesktopMenu',
        'MobileMenu',
        'CTAButtons'
      ]
    },
    {
      title: 'Customization',
      items: [
        'Styling',
        'Themes',
        'Responsive Breakpoints',
        'Animation Settings'
      ]
    },
    {
      title: 'Advanced',
      items: [
        'Analytics Integration',
        'Performance Optimization',
        'Accessibility',
        'Testing'
      ]
    }
  ];

  return (
    <div className="bg-white">
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">Navigation Bar</span> Documentation
            </h1>
            <p className="text-xl text-gray-600">
              Complete guide to implementing and customizing your navigation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Documentation</h2>
                {sections.map((section) => (
                  <div key={section.title} className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">{section.title}</h3>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item}>
                          <a
                            href={`#${item.toLowerCase().replace(' ', '-')}`}
                            className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                          >
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="prose max-w-none">
                <h2 id="installation" className="text-2xl font-bold text-gray-900 mb-4">
                  Installation
                </h2>
                <p className="text-gray-600 mb-6">
                  Get started with Navigation Bar by installing the package and setting up the basic configuration.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <code className="text-sm text-gray-800">
                    npm install @navigation-bar/react
                  </code>
                </div>

                <h2 id="quick-setup" className="text-2xl font-bold text-gray-900 mb-4">
                  Quick Setup
                </h2>
                <p className="text-gray-600 mb-6">
                  Import and use the NavigationBar component in your React application:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <pre className="text-sm text-gray-800">
{`import { NavigationBar } from '@navigation-bar/react';

function App() {
  return (
    <div>
      <NavigationBar />
      {/* Your content */}
    </div>
  );
}`}
                  </pre>
                </div>

                <h2 id="configuration" className="text-2xl font-bold text-gray-900 mb-4">
                  Configuration
                </h2>
                <p className="text-gray-600 mb-6">
                  Customize your navigation by providing configuration options:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <pre className="text-sm text-gray-800">
{`const config = {
  logo: {
    text: "Your App",
    href: "/"
  },
  menuItems: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
  ],
  ctaButtons: [
    { href: "/login", label: "Login", variant: "secondary" },
    { href: "/signup", label: "Sign Up", variant: "primary" }
  ]
};`}
                  </pre>
                </div>

                <h2 id="responsive-behavior" className="text-2xl font-bold text-gray-900 mb-4">
                  Responsive Behavior
                </h2>
                <p className="text-gray-600 mb-6">
                  The navigation automatically adapts to different screen sizes:
                </p>
                
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Desktop: Horizontal menu with logo left, links center, CTAs right</li>
                  <li>Tablet: Similar to desktop with adjusted spacing</li>
                  <li>Mobile: Hamburger menu with full-screen overlay</li>
                </ul>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                  <p className="text-blue-800 mb-4">
                    Check out our comprehensive examples and community resources.
                  </p>
                  <div className="flex space-x-4">
                    <a href="/examples" className="text-blue-600 hover:text-blue-700 font-medium">
                      View Examples
                    </a>
                    <a href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
                      Get Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};