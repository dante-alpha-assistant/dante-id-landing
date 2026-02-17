export default function GrowthStrategyView({ content }) {
  if (!content) return null
  const { channels, first_90_days, key_metrics, budget_allocation } = content

  return (
    <div className="space-y-6 pt-4">
      {channels?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Channels</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {channels.map((c, i) => (
              <div key={i} className="bg-white/5 border border-[#333] rounded-lg p-3">
                <div className="text-sm font-medium text-white">{c.name}</div>
                <div className="text-xs text-gray-400 mt-1">{c.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {first_90_days?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">First 90 Days</h4>
          <ol className="list-decimal list-inside space-y-1">
            {first_90_days.map((item, i) => (
              <li key={i} className="text-sm text-gray-300">{item}</li>
            ))}
          </ol>
        </div>
      )}

      {key_metrics?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Key Metrics</h4>
          <div className="flex flex-wrap gap-2">
            {key_metrics.map((m, i) => (
              <span key={i} className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-300">{m}</span>
            ))}
          </div>
        </div>
      )}

      {budget_allocation?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Budget Allocation</h4>
          <div className="space-y-2">
            {budget_allocation.map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{b.category}</span>
                  <span>{b.percentage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${b.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
