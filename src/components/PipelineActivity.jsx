import { useEffect, useState } from 'react'

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  running: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
  error: 'bg-red-500/20 text-red-400',
}

function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function PipelineActivity() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/platform/activity')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-md-on-background mb-4">Self-Improvement Pipeline</h2>
        <p className="text-md-on-surface-variant text-sm animate-pulse">Loading activity...</p>
      </div>
    )
  }

  if (!data || (!data.cycles?.length && !data.stats?.total_cycles)) {
    return (
      <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-md-on-background mb-2">Self-Improvement Pipeline</h2>
        <p className="text-md-on-surface-variant text-sm">
          No self-improvement cycles yet. The pipeline runs every 6 hours.
        </p>
      </div>
    )
  }

  const { cycles, stats } = data

  return (
    <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm">
      <h2 className="text-lg font-bold text-md-on-background mb-4">Self-Improvement Pipeline</h2>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-md-surface-variant rounded-md-sm p-3">
          <div className="text-md-on-surface-variant text-xs">Total Cycles</div>
          <div className="text-md-on-background text-xl font-bold">{stats.total_cycles}</div>
        </div>
        <div className="bg-md-surface-variant rounded-md-sm p-3">
          <div className="text-md-on-surface-variant text-xs">Successful</div>
          <div className="text-emerald-500 text-xl font-bold">{stats.successful}</div>
        </div>
        <div className="bg-md-surface-variant rounded-md-sm p-3">
          <div className="text-md-on-surface-variant text-xs">Failed</div>
          <div className="text-red-400 text-xl font-bold">{stats.failed}</div>
        </div>
        <div className="bg-md-surface-variant rounded-md-sm p-3">
          <div className="text-md-on-surface-variant text-xs">Last Run</div>
          <div className="text-md-on-background text-sm font-medium">{formatTime(stats.last_cycle)}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="flex items-start gap-3 bg-md-surface-variant/50 rounded-md-sm p-3">
            <div className="mt-0.5">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[cycle.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                {cycle.status}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-md-on-background truncate">
                {cycle.suggestion || 'Self-improvement cycle'}
              </p>
              <p className="text-xs text-md-on-surface-variant mt-0.5">
                {formatTime(cycle.started_at)}
                {cycle.completed_at && ` → ${formatTime(cycle.completed_at)}`}
              </p>
            </div>
            {cycle.github_issue_url && (
              <a
                href={cycle.github_issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-md-primary hover:underline shrink-0"
              >
                Issue →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
