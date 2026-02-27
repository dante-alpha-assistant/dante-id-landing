import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''

function StatusBadge({ status }) {
  const color = status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'
  const label = status === 'success' ? 'Passing' : status === 'failure' ? 'Failing' : 'Unknown'
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${color}`}>{label}</span>
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function TestHistoryTab({ projectId }) {
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const debounceRef = useRef(null)

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ limit: '50', offset: '0', status: statusFilter, from: '', to: '' })
      const res = await fetch(`${API_BASE}/api/qa/global/project/${projectId}/runs?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setRuns(Array.isArray(json) ? json : json.runs || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, statusFilter])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  const filtered = debouncedSearch
    ? runs.filter(r => (r.commit_message || '').toLowerCase().includes(debouncedSearch.toLowerCase()))
    : runs

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleRetry = async (runId) => {
    try {
      await fetch(`${API_BASE}/api/qa/global/project/${projectId}/runs/${runId}/retry`, { method: 'POST' })
      fetchRuns()
    } catch {}
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-md-on-surface-variant animate-pulse text-lg">Loading test history…</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-red-400">Error loading runs: {error}</p>
        <button onClick={fetchRuns} className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Retry</button>
      </div>
    )
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-md-surface-container border border-md-outline-variant rounded-md px-3 py-2 text-sm text-md-on-background focus:outline-none focus:border-md-primary"
        >
          <option value="">All</option>
          <option value="success">Passing</option>
          <option value="failure">Failing</option>
        </select>
        <input
          type="text"
          placeholder="Search by commit message…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-md-surface-container border border-md-outline-variant rounded-md px-3 py-2 text-sm text-md-on-background placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary"
        />
      </div>

      {/* Runs */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-md-on-surface-variant">
          <p className="text-lg">No test runs found</p>
        </div>
      ) : (
        <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg overflow-hidden divide-y divide-md-outline-variant">
          {filtered.map((run, i) => {
            const isOpen = expanded[run.id]
            const details = run.tests?.details || []
            return (
              <div key={run.id}>
                {/* Row */}
                <div
                  className="flex items-center px-5 py-3 cursor-pointer hover:bg-md-surface-container-high transition-colors"
                  onClick={() => toggleExpand(run.id)}
                >
                  <span className="text-md-on-surface-variant mr-3 text-sm select-none">{isOpen ? '▼' : '▶'}</span>
                  <span className="text-md-on-background font-medium text-sm mr-3">#{run.run_number ?? i + 1}</span>
                  <span className="text-md-on-surface-variant text-xs mr-3">{timeAgo(run.created_at)}</span>
                  <StatusBadge status={run.build_status || run.status} />
                  <span className="text-md-on-surface-variant text-sm ml-3">{run.test_passed ?? 0}/{run.test_total ?? 0} tests</span>
                  {run.commit_message && (
                    <span className="text-md-on-surface-variant text-xs ml-3 truncate max-w-xs">{run.commit_message}</span>
                  )}
                  {/* Actions */}
                  <div className="ml-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`?tab=logs&run=${run.id}`)}
                      className="text-xs text-md-primary hover:underline"
                    >View Logs</button>
                    <button
                      onClick={() => handleRetry(run.id)}
                      className="text-xs text-md-on-surface-variant hover:text-md-on-background"
                    >Re-run</button>
                    <a
                      href={`${API_BASE}/api/qa/global/project/${projectId}/runs/${run.id}/download`}
                      className="text-xs text-md-on-surface-variant hover:text-md-on-background"
                    >Download</a>
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="bg-zinc-900/50 px-5 py-3 border-t border-md-outline-variant">
                    {details.length === 0 ? (
                      <p className="text-md-on-surface-variant text-sm">No test details available</p>
                    ) : (
                      <div className="space-y-1">
                        {details.map((test, j) => (
                          <div key={j}>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={test.status === 'failure' || test.status === 'failed' ? 'text-red-400' : 'text-emerald-400'}>
                                {test.status === 'failure' || test.status === 'failed' ? '✗' : '✓'}
                              </span>
                              <span className="text-md-on-background">{test.name || test.test_name}</span>
                              {test.duration && <span className="text-md-on-surface-variant text-xs">{test.duration}ms</span>}
                            </div>
                            {(test.status === 'failure' || test.status === 'failed') && test.error && (
                              <div className="bg-red-500/10 text-red-400 text-xs font-mono p-2 rounded ml-5 mt-1">
                                {test.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
