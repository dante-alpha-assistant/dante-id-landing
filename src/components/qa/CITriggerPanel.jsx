import { useState } from 'react'

const TRIGGER_TYPES = ['Full Pipeline', 'Lint Only', 'Tests Only', 'Build Only']

export default function CITriggerPanel({ triggers = [], onTrigger }) {
  const [triggering, setTriggering] = useState(null)

  const handleTrigger = async (type) => {
    setTriggering(type)
    await onTrigger?.(type)
    setTriggering(null)
  }

  const statusBadge = (status) => {
    const colors = { success: 'text-green-400', failed: 'text-red-400', running: 'text-yellow-400', pending: 'text-zinc-500' }
    return <span className={`${colors[status] || colors.pending} uppercase text-[10px]`}>● {status}</span>
  }

  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 font-mono">
      <h3 className="text-[#33ff00] text-sm uppercase tracking-wider mb-4">CI Triggers</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TRIGGER_TYPES.map(type => (
          <button
            key={type}
            onClick={() => handleTrigger(type)}
            disabled={triggering !== null}
            className="px-3 py-2 text-xs uppercase border border-zinc-800 rounded-none text-zinc-300 hover:border-[#33ff00] hover:text-[#33ff00] disabled:opacity-50 transition-colors"
          >
            {triggering === type ? '▶ Running...' : `▶ ${type}`}
          </button>
        ))}
      </div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recent Triggers</div>
      <div className="space-y-1">
        {triggers.map((t, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900">
            <span className="text-zinc-400">{t.type}</span>
            <span className="text-zinc-600">{t.timestamp}</span>
            {statusBadge(t.status)}
          </div>
        ))}
        {triggers.length === 0 && <div className="text-zinc-600 text-xs">No recent triggers</div>}
      </div>
    </div>
  )
}
