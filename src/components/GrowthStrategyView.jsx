import CopyButton from './CopyButton'

export default function GrowthStrategyView({ content }) {
  if (!content) return null

  const channels = Array.isArray(content.channels)
    ? content.channels.map(c => ({ name: c.name || c.channel || '', desc: c.description || c.why_it_fits || '' }))
    : Array.isArray(content.channel_strategy)
      ? content.channel_strategy.map(c => ({ name: c.channel || '', desc: c.why_it_fits || '' }))
      : []

  const first90 = Array.isArray(content.first_90_days)
    ? content.first_90_days
    : content.ninety_day_plan
      ? Object.entries(content.ninety_day_plan).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v?.focus || ''}`)
      : []

  const metrics = Array.isArray(content.key_metrics)
    ? content.key_metrics
    : content.metrics
      ? [content.metrics.north_star?.metric, ...(content.metrics.weekly || []).map(w => w.metric)].filter(Boolean)
      : []

  const budget = Array.isArray(content.budget_allocation)
    ? content.budget_allocation
    : content.budget_allocation && typeof content.budget_allocation === 'object'
      ? Object.entries(content.budget_allocation).map(([tier, val]) => ({
          category: `$${tier}/mo`,
          percentage: null,
          outcome: val?.expected_outcome || ''
        }))
      : []

  const quickWins = Array.isArray(content.quick_wins) ? content.quick_wins : []

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-end"><CopyButton text={JSON.stringify(content, null, 2)} label="Copy All" /></div>
      {channels.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Growth Channels</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {channels.map((c, i) => (
              <div key={i} className="bg-md-surface-container rounded-md-lg p-3 shadow-sm">
                <div className="text-sm font-medium text-md-on-surface">{c.name}</div>
                <div className="text-xs text-md-on-surface-variant mt-1">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {first90.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">First 90 Days</h4>
          <ol className="list-decimal list-inside space-y-1">
            {first90.map((item, i) => (
              <li key={i} className="text-sm text-md-on-surface">{typeof item === 'string' ? item : item?.focus || JSON.stringify(item)}</li>
            ))}
          </ol>
        </div>
      )}

      {quickWins.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Quick Wins</h4>
          <div className="space-y-1">
            {quickWins.map((w, i) => (
              <div key={i} className="text-sm text-md-on-surface">
                ⚡ {typeof w === 'string' ? w : w.action || ''} {w.time ? <span className="text-xs text-md-on-surface-variant">({w.time})</span> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Key Metrics</h4>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m, i) => (
              <span key={i} className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-3 py-1.5">
                {typeof m === 'string' ? m : m?.metric || ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {budget.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Budget Allocation</h4>
          <div className="space-y-2">
            {budget.map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-md-on-surface-variant mb-1">
                  <span>{b.category}</span>
                  {b.percentage != null && <span>{b.percentage}%</span>}
                </div>
                {b.percentage != null && (
                  <div className="h-2 rounded-full bg-md-surface-variant">
                    <div className="h-2 rounded-full bg-md-primary transition-all" style={{ width: `${b.percentage}%` }} />
                  </div>
                )}
                {b.outcome && <p className="text-xs text-md-on-surface-variant mt-1">{b.outcome}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
