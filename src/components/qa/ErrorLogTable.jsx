import { useState } from 'react'

const FILTERS = ['All', 'Lint', 'Build', 'Test']
const SEVERITY_COLORS = { error: 'bg-red-900 text-red-300', warning: 'bg-yellow-900 text-yellow-300', info: 'bg-zinc-800 text-zinc-300' }

export default function ErrorLogTable({ errors = [], page, totalPages, onPageChange, onResolve }) {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? errors : errors.filter(e => e.type?.toLowerCase() === filter.toLowerCase())

  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 font-mono">
      <h3 className="text-[#33ff00] text-sm uppercase tracking-wider mb-4">Error Log</h3>
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs uppercase rounded-none border ${filter === f ? 'border-[#33ff00] text-[#33ff00] bg-[#33ff00]/10' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left py-2 px-2">Severity</th>
              <th className="text-left py-2 px-2">File</th>
              <th className="text-left py-2 px-2">Message</th>
              <th className="text-left py-2 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((err, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                <td className="py-2 px-2">
                  <span className={`px-2 py-0.5 text-[10px] uppercase rounded-none ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.info}`}>
                    {err.severity}
                  </span>
                </td>
                <td className="py-2 px-2 text-zinc-400">{err.file}</td>
                <td className="py-2 px-2 text-zinc-300">{err.message}</td>
                <td className="py-2 px-2">
                  <button onClick={() => onResolve?.(err.id)} className="text-[#33ff00] hover:underline text-[10px] uppercase">Resolve</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-zinc-600">No errors found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
          <button onClick={() => onPageChange?.(page - 1)} disabled={page <= 1} className="px-3 py-1 border border-zinc-800 rounded-none disabled:opacity-30 hover:text-[#33ff00]">← Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages} className="px-3 py-1 border border-zinc-800 rounded-none disabled:opacity-30 hover:text-[#33ff00]">Next →</button>
        </div>
      )}
    </div>
  )
}
