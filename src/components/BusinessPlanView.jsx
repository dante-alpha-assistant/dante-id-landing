import { useState } from 'react'
import CopyButton from './CopyButton'

const sections = [
  { key: 'executive_summary', label: 'Executive Summary' },
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'target_market', label: 'Target Market' },
  { key: 'revenue_model', label: 'Revenue Model' },
  { key: 'competitive_landscape', label: 'Competitive Landscape' },
  { key: 'go_to_market', label: 'Go to Market' },
  { key: 'success_metrics', label: 'Success Metrics' },
]

function renderValue(val) {
  if (!val) return null
  if (typeof val === 'string') return <p className="text-sm text-gray-400 leading-relaxed">{val}</p>
  if (Array.isArray(val)) return (
    <ul className="list-disc list-inside space-y-1">
      {val.map((item, i) => (
        <li key={i} className="text-sm text-gray-400">
          {typeof item === 'string' ? item : typeof item === 'object' ? Object.values(item).filter(v => typeof v === 'string').join(' — ') : JSON.stringify(item)}
        </li>
      ))}
    </ul>
  )
  if (typeof val === 'object') return (
    <div className="space-y-2">
      {Object.entries(val).map(([k, v]) => (
        <div key={k}>
          <span className="text-xs font-medium text-gray-500 uppercase">{k.replace(/_/g, ' ')}</span>
          <div className="ml-2">{renderValue(v)}</div>
        </div>
      ))}
    </div>
  )
  return <p className="text-sm text-gray-400">{String(val)}</p>
}

export default function BusinessPlanView({ content }) {
  const [open, setOpen] = useState({})
  if (!content) return null

  const toggle = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }))

  // Support both v1 (milestones as array) and v2 (milestones as object with quarters)
  const milestones = Array.isArray(content.milestones)
    ? content.milestones
    : content.milestones
      ? Object.entries(content.milestones).flatMap(([q, v]) =>
          typeof v === 'object' && v.goals ? v.goals.map(g => `${q.toUpperCase()}: ${g}`) : [String(v)]
        )
      : []

  return (
    <div className="space-y-2 pt-4">
      <div className="flex justify-end"><CopyButton text={JSON.stringify(content, null, 2)} label="Copy All" /></div>
      {sections.map(({ key, label }) => {
        if (!content[key]) return null
        const isOpen = !!open[key]
        return (
          <div key={key} className="border border-[#333] rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              {label}
              <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isOpen ? '2000px' : '0', opacity: isOpen ? 1 : 0 }}
            >
              <div className="px-4 pb-3">{renderValue(content[key])}</div>
            </div>
          </div>
        )
      })}

      {milestones.length > 0 && (
        <div className="border border-[#333] rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Milestones</h4>
          <ol className="list-decimal list-inside space-y-1">
            {milestones.map((m, i) => (
              <li key={i} className="text-sm text-gray-400">{m}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
