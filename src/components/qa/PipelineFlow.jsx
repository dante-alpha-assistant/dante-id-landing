const stages = [
  {
    key: 'build',
    label: 'Build',
    icon: '🔨',
    getValue: (m) => m.build_status === 'success' ? 'OK' : 'FAIL',
    getStatus: (m) => m.build_status === 'success' ? 'pass' : 'fail',
  },
  {
    key: 'lint',
    label: 'Lint',
    icon: '🔍',
    getValue: (m) => `${m.lint_errors ?? 0} err`,
    getStatus: (m) => {
      const e = m.lint_errors ?? 0
      return e === 0 ? 'pass' : e <= 5 ? 'warn' : 'fail'
    },
  },
  {
    key: 'tests',
    label: 'Tests',
    icon: '🧪',
    getValue: (m) => `${m.test_passed ?? 0}/${m.test_total ?? 0}`,
    getStatus: (m) => {
      if (!m.test_total) return 'pass'
      if (m.test_passed === m.test_total) return 'pass'
      return (m.test_passed / m.test_total) >= 0.7 ? 'warn' : 'fail'
    },
  },
  {
    key: 'coverage',
    label: 'Coverage',
    icon: '📊',
    getValue: (m) => `${Math.round(m.test_coverage ?? 0)}%`,
    getStatus: (m) => {
      const c = m.test_coverage ?? 0
      return c >= 80 ? 'pass' : c >= 60 ? 'warn' : 'fail'
    },
  },
]

const colors = {
  pass: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
  warn: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
  fail: 'bg-red-500/20 border-red-500/30 text-red-400',
}

export default function PipelineFlow({ latest }) {
  if (!latest) return null

  return (
    <div className="flex items-center gap-2 mb-8 flex-wrap">
      {stages.map((stage, i) => {
        const status = stage.getStatus(latest)
        const isFailed = status === 'fail'
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div
              className={`${colors[status]} border rounded-md-lg px-4 py-3 flex flex-col items-center min-w-[100px] transition-all ${
                isFailed ? 'scale-110 border-2 animate-pulse-border' : ''
              }`}
            >
              <span className="text-lg">{stage.icon}</span>
              <span className="text-xs font-semibold mt-1">{stage.label}</span>
              <span className="text-sm font-bold mt-0.5">{stage.getValue(latest)}</span>
            </div>
            {i < stages.length - 1 && (
              <span className="text-md-outline-variant text-xl">→</span>
            )}
          </div>
        )
      })}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .animate-pulse-border { animation: pulse-border 2s infinite; }
      `}</style>
    </div>
  )
}
