import { useState, useEffect } from 'react'

const DEFAULT_GATES = [
  { key: 'lint', label: 'Lint Errors', threshold: 0, unit: 'errors' },
  { key: 'coverage', label: 'Test Coverage', threshold: 80, unit: '%' },
  { key: 'build', label: 'Build Status', threshold: null, unit: 'pass/fail' },
  { key: 'tests', label: 'Test Pass Rate', threshold: 100, unit: '%' },
]

export default function QualityGatesConfig({ gates: initialGates, onSave }) {
  const [gates, setGates] = useState(DEFAULT_GATES)

  useEffect(() => {
    if (initialGates?.length) setGates(initialGates)
  }, [initialGates])

  const toggle = (key) => {
    setGates(g => g.map(gate => gate.key === key ? { ...gate, enabled: !gate.enabled } : gate))
  }

  const updateThreshold = (key, value) => {
    setGates(g => g.map(gate => gate.key === key ? { ...gate, threshold: Number(value) } : gate))
  }

  return (
    <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md-on-surface text-sm font-semibold">Quality Gates</h3>
        <button onClick={() => onSave?.(gates)} className="px-4 py-1.5 text-xs font-medium rounded-full bg-md-primary text-md-on-primary hover:shadow-md transition-all">Save</button>
      </div>
      <div className="space-y-3">
        {gates.map(gate => (
          <div key={gate.key} className="flex items-center gap-3 py-2 border-b border-md-outline-variant last:border-b-0">
            <button
              onClick={() => toggle(gate.key)}
              className={`relative w-12 h-7 rounded-full transition-colors ${gate.enabled !== false ? 'bg-md-primary' : 'bg-md-surface-variant'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${gate.enabled !== false ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
            </button>
            <span className={`text-xs flex-1 ${gate.enabled !== false ? 'text-md-on-surface' : 'text-md-on-surface-variant'}`}>{gate.label}</span>
            {gate.threshold !== null && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={gate.threshold}
                  onChange={(e) => updateThreshold(gate.key, e.target.value)}
                  className="w-16 rounded-t-lg rounded-b-none border-b-2 border-md-outline bg-md-surface-variant px-2 py-0.5 text-xs text-md-on-surface text-right focus:border-md-primary outline-none transition-colors"
                />
                <span className="text-md-on-surface-variant text-[10px]">{gate.unit}</span>
              </div>
            )}
            <span className={`rounded-full text-[10px] px-2 py-0.5 ${gate.enabled !== false ? 'bg-md-secondary-container text-md-on-secondary-container' : 'bg-md-surface-variant text-md-on-surface-variant'}`}>
              {gate.enabled !== false ? '● Active' : '○ Disabled'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
