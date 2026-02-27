import React, { useState } from 'react';
import { BreadcrumbContainer } from '../components/Breadcrumb/BreadcrumbContainer';
import { BreadcrumbItem } from '../components/Breadcrumb/BreadcrumbItem';
import { BreadcrumbSeparator } from '../components/Breadcrumb/BreadcrumbSeparator';
import { BreadcrumbIcon } from '../components/Breadcrumb/BreadcrumbIcon';

const CodeExample = ({ title, code }) => (
  <div className="bg-md-surface-container rounded-md-lg p-6">
    <h3 className="font-semibold mb-3 text-md-on-surface">{title}</h3>
    <pre className="bg-zinc-900 text-green-400 p-4 rounded text-sm overflow-x-auto font-mono">
      <code>{code}</code>
    </pre>
  </div>
);

const ResponsivePreview = () => {
  const [viewportSize, setViewportSize] = useState('desktop');
  
  const mockBreadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/dashboard/users' },
    { label: 'Users', path: '/dashboard/users/list' },
    { label: 'Edit Profile', path: '/dashboard/users/123/edit' }
  ];

  const viewportClasses = {
    mobile: 'max-w-sm',
    tablet: 'max-w-md', 
    desktop: 'max-w-4xl'
  };

  return (
    <div className="bg-md-surface-container rounded-md-lg p-6">
      <h3 className="font-semibold mb-4 text-md-on-surface">Responsive Preview</h3>
      
      <div className="flex space-x-2 mb-4">
        {Object.keys(viewportClasses).map(size => (
          <button
            key={size}
            onClick={() => setViewportSize(size)}
            className={`
              px-4 py-2 rounded-full text-sm capitalize transition-colors
              ${
                viewportSize === size
                  ? 'bg-md-primary text-md-on-primary'
                  : 'bg-md-surface-variant text-md-on-surface-variant hover:bg-md-secondary-container'
              }
            `}
          >
            {size}
          </button>
        ))}
      </div>

      <div className={`border border-md-border p-4 transition-all ${viewportClasses[viewportSize]}`}>
        <nav className="flex items-center space-x-2 text-sm">
          <ol className="flex items-center space-x-2">
            {mockBreadcrumbs.map((crumb, index) => {
              const isLast = index === mockBreadcrumbs.length - 1;
              return (
                <li key={index} className="flex items-center space-x-2">
                  <BreadcrumbItem
                    href={crumb.path}
                    label={crumb.label}
                    isActive={isLast}
                    showIcon={index === 0}
                  />
                  {!isLast && <BreadcrumbSeparator />}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export const BreadcrumbDemo = () => {
  return (
    <div className="min-h-screen bg-md-background p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-md-on-background mb-2">Breadcrumb Nav</h1>
        <p className="text-md-on-surface-variant">
          Visual breadcrumb navigation with clean styling, hover states, and responsive design
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Live Demo */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-md-on-background">Live Demo</h2>
          <div className="bg-md-surface rounded-md-lg p-6">
            <BreadcrumbContainer
              customLabels={{
                'user-mgmt': 'User Management',
                'api-keys': 'API Keys',
                'org-settings': 'Organization Settings'
              }}
              showHomeIcon={true}
              maxDepth={5}
            />
          </div>
        </section>

        {/* Component Variations */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-md-on-background">Component Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Breadcrumb */}
            <div className="bg-md-surface rounded-md-lg p-6">
              <h3 className="font-semibold mb-3 text-md-on-surface">Basic Breadcrumb</h3>
              <nav className="flex items-center space-x-2 text-sm">
                <BreadcrumbItem href="/" label="Home" showIcon={true} />
                <BreadcrumbSeparator />
                <BreadcrumbItem href="/products" label="Products" />
                <BreadcrumbSeparator />
                <BreadcrumbItem label="Laptops" isActive={true} ariaCurrent="page" />
              </nav>
            </div>

            {/* With Custom Icons */}
            <div className="bg-md-surface rounded-md-lg p-6">
              <h3 className="font-semibold mb-3 text-md-on-surface">Custom Separators</h3>
              <nav className="flex items-center space-x-3 text-sm">
                <BreadcrumbItem href="/" label="Dashboard" showIcon={true} />
                <BreadcrumbSeparator variant="slash" />
                <BreadcrumbItem href="/settings" label="Settings" />
                <BreadcrumbSeparator variant="slash" />
                <BreadcrumbItem label="Profile" isActive={true} ariaCurrent="page" />
              </nav>
            </div>

            {/* Long Path */}
            <div className="bg-md-surface rounded-md-lg p-6">
              <h3 className="font-semibold mb-3 text-md-on-surface">Long Navigation Path</h3>
              <nav className="flex items-center space-x-2 text-sm">
                <BreadcrumbItem href="/" label="Dashboard" showIcon={true} />
                <BreadcrumbSeparator />
                <BreadcrumbItem href="/admin" label="Administration" />
                <BreadcrumbSeparator />
                <BreadcrumbItem href="/admin/users" label="User Management" />
                <BreadcrumbSeparator />
                <BreadcrumbItem href="/admin/users/groups" label="Groups" />
                <BreadcrumbSeparator />
                <BreadcrumbItem label="Edit Permissions" isActive={true} ariaCurrent="page" />
              </nav>
            </div>

            {/* Compact Mobile */}
            <div className="bg-md-surface rounded-md-lg p-6">
              <h3 className="font-semibold mb-3 text-md-on-surface">Mobile Optimized</h3>
              <div className="max-w-xs">
                <nav className="flex items-center space-x-1 text-sm">
                  <BreadcrumbItem href="/" label="..." />
                  <BreadcrumbSeparator />
                  <BreadcrumbItem href="/users" label="Users" />
                  <BreadcrumbSeparator />
                  <BreadcrumbItem label="Profile" isActive={true} ariaCurrent="page" />
                </nav>
              </div>
            </div>
          </div>
        </section>

        {/* Responsive Preview */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-md-on-background">Responsive Design</h2>
          <ResponsivePreview />
        </section>

        {/* Code Examples */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-md-on-background">Implementation Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CodeExample
              title="Basic Usage"
              code={`import { BreadcrumbContainer } from './components/Breadcrumb';

<BreadcrumbContainer
  showHomeIcon={true}
  maxDepth={5}
  customLabels={{
    'user-mgmt': 'User Management',
    'api-keys': 'API Keys'
  }}
/>`}
            />
            
            <CodeExample
              title="Manual Breadcrumb"
              code={`import { BreadcrumbItem, BreadcrumbSeparator } from './components/Breadcrumb';

<nav role="navigation" aria-label="Breadcrumb">
  <BreadcrumbItem href="/" label="Home" showIcon={true} />
  <BreadcrumbSeparator />
  <BreadcrumbItem href="/products" label="Products" />
  <BreadcrumbSeparator />
  <BreadcrumbItem label="Current" isActive={true} />
</nav>`}
            />
          </div>
        </section>

        {/* Design Tokens */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-md-on-background">Design System Integration</h2>
          <div className="bg-md-surface rounded-md-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-md-on-surface">Colors</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-md-primary rounded"></div>
                    <span>Primary links</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-md-on-surface rounded"></div>
                    <span>Active/current</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-md-on-surface-variant rounded"></div>
                    <span>Separators</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-md-on-surface">Typography</h4>
                <div className="space-y-1 text-sm">
                  <div>Font: Roboto (font-sans)</div>
                  <div>Size: 14px (text-sm)</div>
                  <div>Weight: 400 (regular)</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-md-on-surface">Spacing</h4>
                <div className="space-y-1 text-sm">
                  <div>Item gap: 8px (space-x-2)</div>
                  <div>Padding: 12px (p-3)</div>
                  <div>Border radius: 8px (rounded-md-lg)</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BreadcrumbDemo;