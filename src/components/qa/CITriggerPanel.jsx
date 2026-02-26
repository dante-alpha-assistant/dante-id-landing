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
    const styles = {
      success: 'bg-md-secondary-container text-md-on-secondary-container',
      failed: 'bg-md-error-container text-md-on-error-container',
      running: 'bg-md-tertiary-container text-md-on-tertiary-container',
      pending: 'bg-md-surface-variant text-md-on-surface-variant'
    }
    return <span className={`rounded-full text-[10px] px-2 py-0.5 ${styles[status] || styles.pending}`}>● {status}</span>
  }

  return (
    <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-4 shadow-sm">
      <h3 className="text-md-on-surface text-sm font-semibold mb-4">CI Triggers</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TRIGGER_TYPES.map(type => (
          <button
            key={type}
            onClick={() => handleTrigger(type)}
            disabled={triggering !== null}
            className="px-3 py-2 text-xs font-medium rounded-full bg-md-secondary-container text-md-on-secondary-container hover:shadow-sm disabled:opacity-50 transition-all"
          >
            {triggering === type ? '▶ Running...' : `▶ ${type}`}
          </button>
        ))}
      </div>
      <div className="text-xs text-md-on-surface-variant font-medium mb-2">Recent Triggers</div>
      <div className="space-y-1">
        {triggers.map((t, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-md-outline-variant last:border-b-0">
            <span className="text-md-on-surface">{t.type}</span>
            <span className="text-md-on-surface-variant">{t.timestamp}</span>
            {statusBadge(t.status)}
          </div>
        ))}
        {triggers.length === 0 && <div className="text-md-on-surface-variant text-xs">No recent triggers</div>}
      </div>
    </div>
  )
}
