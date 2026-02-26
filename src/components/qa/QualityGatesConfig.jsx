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
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#33ff00] text-sm uppercase tracking-wider">Quality Gates</h3>
        <button onClick={() => onSave?.(gates)} className="px-3 py-1 text-xs uppercase border border-[#33ff00] text-[#33ff00] rounded-none hover:bg-[#33ff00]/10">Save</button>
      </div>
      <div className="space-y-3">
        {gates.map(gate => (
          <div key={gate.key} className="flex items-center gap-3 py-2 border-b border-zinc-900">
            <button
              onClick={() => toggle(gate.key)}
              className={`w-8 h-4 rounded-none border ${gate.enabled !== false ? 'bg-[#33ff00]/20 border-[#33ff00]' : 'bg-zinc-900 border-zinc-700'} relative transition-colors`}
            >
              <div className={`w-3 h-3 rounded-none absolute top-0.5 transition-all ${gate.enabled !== false ? 'right-0.5 bg-[#33ff00]' : 'left-0.5 bg-zinc-600'}`} />
            </button>
            <span className={`text-xs flex-1 ${gate.enabled !== false ? 'text-zinc-300' : 'text-zinc-600'}`}>{gate.label}</span>
            {gate.threshold !== null && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={gate.threshold}
                  onChange={(e) => updateThreshold(gate.key, e.target.value)}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded-none px-2 py-0.5 text-xs text-zinc-300 text-right focus:border-[#33ff00] outline-none"
                />
                <span className="text-zinc-600 text-[10px]">{gate.unit}</span>
              </div>
            )}
            <span className={`text-[10px] uppercase ${gate.enabled !== false ? 'text-green-500' : 'text-zinc-600'}`}>
              {gate.enabled !== false ? '● Active' : '○ Disabled'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
