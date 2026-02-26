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
  if (typeof val === 'string') return <p className="text-sm text-md-on-surface-variant leading-relaxed">{val}</p>
  if (Array.isArray(val)) return (
    <ul className="list-disc list-inside space-y-1">
      {val.map((item, i) => (
        <li key={i} className="text-sm text-md-on-surface-variant">
          {typeof item === 'string' ? item : typeof item === 'object' ? Object.values(item).filter(v => typeof v === 'string').join(' — ') : JSON.stringify(item)}
        </li>
      ))}
    </ul>
  )
  if (typeof val === 'object') return (
    <div className="space-y-2">
      {Object.entries(val).map(([k, v]) => (
        <div key={k}>
          <span className="text-xs font-medium text-md-on-surface-variant uppercase">{k.replace(/_/g, ' ')}</span>
          <div className="ml-2">{renderValue(v)}</div>
        </div>
      ))}
    </div>
  )
  return <p className="text-sm text-md-on-surface-variant">{String(val)}</p>
}

export default function BusinessPlanView({ content }) {
  const [open, setOpen] = useState({})
  if (!content) return null

  const toggle = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }))

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
          <div key={key} className="bg-md-surface-container rounded-md-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-md-on-surface hover:bg-md-surface-variant/50 transition-colors"
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
        <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
          <h4 className="text-sm font-medium text-md-on-surface mb-2">Milestones</h4>
          <ol className="list-decimal list-inside space-y-1">
            {milestones.map((m, i) => (
              <li key={i} className="text-sm text-md-on-surface-variant">{m}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
