import DarkModeCard from '../components/DarkModeCard'
import DarkModeButton from '../components/DarkModeButton'
import { useTheme } from '../components/ThemeProvider'

export default function ThemeDocumentation() {
  const { isDark } = useTheme()

  const colorPalette = {
    light: {
      'Primary Background': '#ffffff',
      'Secondary Background': '#f8fafc',
      'Surface': '#ffffff',
      'Primary Text': '#0f172a',
      'Secondary Text': '#64748b',
      'Border': '#e2e8f0',
      'Accent': '#3b82f6'
    },
    dark: {
      'Primary Background': '#0f172a',
      'Secondary Background': '#1e293b',
      'Surface': '#334155',
      'Primary Text': '#f1f5f9',
      'Secondary Text': '#cbd5e1',
      'Border': '#475569',
      'Accent': '#60a5fa'
    }
  }

  const currentPalette = isDark ? colorPalette.dark : colorPalette.light

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold themed-text mb-4">Design System Documentation</h1>
        <p className="text-xl themed-text-secondary">
          Complete guide to our dark mode implementation
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-6">Color Palette</h2>
          <div className="space-y-4">
            <p className="themed-text-secondary mb-4">
              Current theme: <span className="themed-accent font-medium">{isDark ? 'Dark' : 'Light'}</span>
            </p>
            <div className="grid gap-3">
              {Object.entries(currentPalette).map(([name, color]) => (
                <div key={name} className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded border themed-border"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="flex-1">
                    <p className="themed-text font-medium">{name}</p>
                    <p className="themed-text-secondary text-sm">{color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-6">CSS Custom Properties</h2>
          <div className="space-y-4">
            <p className="themed-text-secondary mb-4">
              Our theme system uses CSS custom properties for dynamic theming:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <div>:root {`{`}</div>
              <div className="ml-2">--color-bg-primary: #ffffff;</div>
              <div className="ml-2">--color-text-primary: #0f172a;</div>
              <div className="ml-2">--color-accent: #3b82f6;</div>
              <div>{`}`}</div>
              <br />
              <div>[data-theme='dark'] {`{`}</div>
              <div className="ml-2">--color-bg-primary: #0f172a;</div>
              <div className="ml-2">--color-text-primary: #f1f5f9;</div>
              <div className="ml-2">--color-accent: #60a5fa;</div>
              <div>{`}`}</div>
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-6">Typography Scale</h2>
          <div className="space-y-4">
            <div className="text-4xl font-bold themed-text">Heading 1</div>
            <div className="text-3xl font-semibold themed-text">Heading 2</div>
            <div className="text-2xl font-medium themed-text">Heading 3</div>
            <div className="text-xl themed-text">Heading 4</div>
            <div className="text-lg themed-text">Large Text</div>
            <div className="text-base themed-text">Body Text</div>
            <div className="text-sm themed-text-secondary">Small Text</div>
            <div className="text-xs themed-text-secondary">Caption</div>
          </div>
        </DarkModeCard>

        <DarkModeCard>
          <h2 className="text-2xl font-semibold themed-text mb-6">Button Variants</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Sizes</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <DarkModeButton size="sm">Small</DarkModeButton>
                <DarkModeButton size="md">Medium</DarkModeButton>
                <DarkModeButton size="lg">Large</DarkModeButton>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <DarkModeButton variant="primary">Primary</DarkModeButton>
                <DarkModeButton variant="secondary">Secondary</DarkModeButton>
                <DarkModeButton variant="outline">Outline</DarkModeButton>
                <DarkModeButton variant="ghost">Ghost</DarkModeButton>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <DarkModeButton>Normal</DarkModeButton>
                <DarkModeButton loading>Loading</DarkModeButton>
                <DarkModeButton disabled>Disabled</DarkModeButton>
              </div>
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard className="lg:col-span-2">
          <h2 className="text-2xl font-semibold themed-text mb-6">Accessibility Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Contrast Ratios</h3>
              <ul className="space-y-2 themed-text-secondary">
                <li>• Primary text: 4.5:1 minimum (WCAG AA)</li>
                <li>• Secondary text: 3:1 minimum</li>
                <li>• Interactive elements: 3:1 minimum</li>
                <li>• Focus indicators: High contrast outline</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium themed-text mb-3">Theme Detection</h3>
              <ul className="space-y-2 themed-text-secondary">
                <li>• Respects system preference</li>
                <li>• Smooth transitions between themes</li>
                <li>• Persistent user selection</li>
                <li>• Cross-device synchronization</li>
              </ul>
            </div>
          </div>
        </DarkModeCard>

        <DarkModeCard className="lg:col-span-2">
          <h2 className="text-2xl font-semibold themed-text mb-6">Implementation Example</h2>
          <div className="bg-gray-900 text-green-400 p-6 rounded-lg text-sm font-mono overflow-x-auto">
            <div className="text-blue-400">// React Component with Theme Support</div>
            <div className="mt-2">import {`{ useTheme }`} from './ThemeProvider'</div>
            <br />
            <div>function MyComponent() {`{`}</div>
            <div className="ml-2 text-yellow-400">const {`{ isDark, theme }`} = useTheme()</div>
            <br />
            <div className="ml-2">return (</div>
            <div className="ml-4 text-pink-400">&lt;div className="themed-surface themed-text"&gt;</div>
            <div className="ml-6">Content adapts to current theme</div>
            <div className="ml-4 text-pink-400">&lt;/div&gt;</div>
            <div className="ml-2">)</div>
            <div>{`}`}</div>
          </div>
        </DarkModeCard>
      </div>
    </div>
  )
}