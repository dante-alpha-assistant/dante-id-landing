import { useState } from 'react'

const sections = [
  { key: 'executive_summary', label: 'Executive Summary' },
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'target_market', label: 'Target Market' },
  { key: 'revenue_model', label: 'Revenue Model' },
  { key: 'competitive_landscape', label: 'Competitive Landscape' },
]

export default function BusinessPlanView({ content }) {
  const [open, setOpen] = useState({})
  if (!content) return null

  const toggle = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-2 pt-4">
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
              style={{ maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0 }}
            >
              <p className="px-4 pb-3 text-sm text-gray-400 leading-relaxed">{content[key]}</p>
            </div>
          </div>
        )
      })}

      {content.milestones?.length > 0 && (
        <div className="border border-[#333] rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Milestones</h4>
          <ol className="list-decimal list-inside space-y-1">
            {content.milestones.map((m, i) => (
              <li key={i} className="text-sm text-gray-400">{m}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
