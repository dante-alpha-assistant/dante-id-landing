const stages = [
  {
    key: 'build',
    label: 'Build',
    getValue: (m) => m.build_status === 'success' ? 'OK' : 'FAIL',
    getStatus: (m) => m.build_status === 'success' ? 'pass' : 'fail',
  },
  {
    key: 'tests',
    label: 'Tests',
    getValue: (m) => `${m.test_passed ?? 0}/${m.test_total ?? 0}`,
    getStatus: (m) => {
      if (!m.test_total) return 'pass'
      if (m.test_passed === m.test_total) return 'pass'
      return (m.test_passed / m.test_total) >= 0.7 ? 'warn' : 'fail'
    },
  },
  {
    key: 'lint',
    label: 'Lint',
    getValue: (m) => `${m.lint_errors ?? 0} err`,
    getStatus: (m) => {
      const e = m.lint_errors ?? 0
      return e === 0 ? 'pass' : e <= 5 ? 'warn' : 'fail'
    },
  },
  {
    key: 'coverage',
    label: 'Coverage',
    getValue: (m) => `${Math.round(m.test_coverage ?? 0)}%`,
    getStatus: (m) => {
      const c = m.test_coverage ?? 0
      return c >= 80 ? 'pass' : c >= 60 ? 'warn' : 'fail'
    },
  },
]

const colors = {
  pass: 'border-[#33ff00] text-[#33ff00]',
  warn: 'border-amber-500 text-amber-400',
  fail: 'border-red-500 text-red-400',
}

export default function PipelineFlow({ latest }) {
  if (!latest) return null

  return (
    <div className="flex items-center gap-2 mb-8 flex-wrap font-mono">
      {stages.map((stage, i) => {
        const status = stage.getStatus(latest)
        const isFailed = status === 'fail'
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div
              className={`${colors[status]} border rounded-none px-4 py-3 flex flex-col items-center min-w-[100px] bg-[#111] transition-all ${
                isFailed ? 'scale-110 border-2 animate-pulse-border' : ''
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
              <span className="text-sm font-bold mt-1">[ {stage.getValue(latest)} ]</span>
            </div>
            {i < stages.length - 1 && (
              <span className="text-zinc-600 text-xl">→</span>
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
