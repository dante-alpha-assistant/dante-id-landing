import { useState } from 'react'

const FILTERS = ['All', 'Lint', 'Build', 'Test']
const SEVERITY_COLORS = {
  error: 'bg-md-error-container text-md-on-error-container',
  warning: 'bg-md-tertiary-container text-md-on-tertiary-container',
  info: 'bg-md-surface-variant text-md-on-surface-variant'
}

export default function ErrorLogTable({ errors = [], page, totalPages, onPageChange, onResolve }) {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? errors : errors.filter(e => e.type?.toLowerCase() === filter.toLowerCase())

  return (
    <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-4 shadow-sm">
      <h3 className="text-md-on-surface text-sm font-semibold mb-4">Error Log</h3>
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${filter === f ? 'bg-md-secondary-container text-md-on-secondary-container shadow-sm' : 'bg-md-surface-variant text-md-on-surface-variant hover:bg-md-surface-variant/80'}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-md-on-surface-variant border-b border-md-outline-variant">
              <th className="text-left py-2 px-2">Severity</th>
              <th className="text-left py-2 px-2">File</th>
              <th className="text-left py-2 px-2">Message</th>
              <th className="text-left py-2 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((err, i) => (
              <tr key={i} className="border-b border-md-outline-variant hover:bg-md-surface-variant/30">
                <td className="py-2 px-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.info}`}>
                    {err.severity}
                  </span>
                </td>
                <td className="py-2 px-2 text-md-on-surface-variant">{err.file}</td>
                <td className="py-2 px-2 text-md-on-surface">{err.message}</td>
                <td className="py-2 px-2">
                  <button onClick={() => onResolve?.(err.id)} className="text-md-primary hover:underline text-[10px] font-medium">Resolve</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-md-on-surface-variant">No errors found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-md-on-surface-variant">
          <button onClick={() => onPageChange?.(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-full bg-md-secondary-container text-md-on-secondary-container disabled:opacity-30 hover:shadow-sm transition-all">← Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-full bg-md-secondary-container text-md-on-secondary-container disabled:opacity-30 hover:shadow-sm transition-all">Next →</button>
        </div>
      )}
    </div>
  )
}
