import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function LogsTab({ projectId }) {
  const [runs, setRuns] = useState([])
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [logs, setLogs] = useState('')
  const [highlightedErrors, setHighlightedErrors] = useState([])
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const terminalRef = useRef(null)

  // Fetch runs
  useEffect(() => {
    setLoadingRuns(true)
    setError(null)
    fetch(`${API_BASE}/api/qa/global/project/${projectId}/runs?limit=20`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        const list = Array.isArray(data) ? data : data.runs || []
        setRuns(list)
        if (list.length > 0) setSelectedRunId(list[0].id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingRuns(false))
  }, [projectId])

  // Fetch logs
  useEffect(() => {
    if (!selectedRunId) return
    setLoadingLogs(true)
    setError(null)
    fetch(`${API_BASE}/api/qa/global/project/${projectId}/runs/${selectedRunId}/logs`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        setLogs(data.logs || '')
        setHighlightedErrors(data.highlightedErrors || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingLogs(false))
  }, [projectId, selectedRunId])

  const errorLines = useMemo(() => new Set(highlightedErrors.map(e => e.line)), [highlightedErrors])

  const lines = useMemo(() => logs.split('\n'), [logs])

  const { matchCount, renderedLines } = useMemo(() => {
    let count = 0
    const rendered = lines.map((line, i) => {
      const lineNum = i + 1
      const isError = errorLines.has(lineNum) || /FAIL|Error/i.test(line)
      const isPass = /PASS/i.test(line)

      let color = '#e0e0e0'
      if (isPass) color = '#10b981'
      if (isError) color = '#ef4444'

      let content = line
      if (debouncedSearch) {
        const regex = new RegExp(`(${debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        const parts = line.split(regex)
        if (parts.length > 1) {
          count += parts.filter((_, idx) => idx % 2 === 1).length
          content = parts.map((part, j) =>
            j % 2 === 1
              ? <mark key={j} style={{ background: '#facc15', color: '#000', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
              : part
          )
        }
      }

      return (
        <div
          key={i}
          style={{
            display: 'flex',
            background: isError ? 'rgba(239,68,68,0.2)' : 'transparent',
          }}
        >
          <span style={{ color: '#6b7280', minWidth: 48, textAlign: 'right', paddingRight: 16, userSelect: 'none', flexShrink: 0 }}>
            {lineNum}
          </span>
          <span style={{ color, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{content}</span>
        </div>
      )
    })
    return { matchCount: count, renderedLines: rendered }
  }, [lines, debouncedSearch, errorLines])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(logs)
  }, [logs])

  const handleDownload = useCallback(() => {
    window.open(`${API_BASE}/api/qa/global/project/${projectId}/runs/${selectedRunId}/logs/download`)
  }, [projectId, selectedRunId])

  if (loadingRuns) {
    return <div className="flex items-center justify-center py-20 text-md-on-surface-variant animate-pulse">Loading runs…</div>
  }

  if (error && runs.length === 0) {
    return <div className="flex items-center justify-center py-20 text-red-400">Error: {error}</div>
  }

  if (runs.length === 0) {
    return <div className="flex items-center justify-center py-20 text-md-on-surface-variant">No runs available</div>
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedRunId || ''}
          onChange={e => setSelectedRunId(e.target.value)}
          className="bg-md-surface-container border border-md-outline-variant rounded-md px-3 py-2 text-sm text-md-on-background"
        >
          {runs.map(run => (
            <option key={run.id} value={run.id}>
              #{run.run_number ?? run.id} — {timeAgo(run.created_at)} — {run.status === 'success' || run.build_status === 'success' ? '✅' : '❌'} {run.status || run.build_status}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-md-surface-container border border-md-outline-variant rounded-md px-3 py-2 text-sm text-md-on-background w-56"
            />
            {debouncedSearch && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-md-on-surface-variant">
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <button onClick={handleCopy} className="px-3 py-2 text-sm rounded-md border border-md-outline-variant text-md-on-background hover:bg-md-surface-container transition-colors">
            Copy
          </button>
          <button onClick={handleDownload} className="px-3 py-2 text-sm rounded-md border border-md-outline-variant text-md-on-background hover:bg-md-surface-container transition-colors">
            Download
          </button>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm">Error loading logs: {error}</div>}

      {/* Terminal */}
      {loadingLogs ? (
        <div className="flex items-center justify-center py-20 text-md-on-surface-variant animate-pulse">Loading logs…</div>
      ) : !logs ? (
        <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 16 }} className="flex items-center justify-center py-20 text-zinc-500">
          No logs available
        </div>
      ) : (
        <div
          ref={terminalRef}
          style={{
            background: '#0a0a0a',
            color: '#e0e0e0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 1.5,
            padding: 16,
            borderRadius: 8,
            maxHeight: 600,
            overflowY: 'auto',
          }}
        >
          {renderedLines}
        </div>
      )}
    </div>
  )
}
