import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE = '/api/planner'

const PLAN_STEPS = [
  'Analyzing blueprints...',
  'Identifying implementation phases...',
  'Creating work order structure...',
  'Finalizing dependencies...',
]

function PlannerLoadingOverlay({ batchProgress }) {
  const [elapsed, setElapsed] = useState(0)
  const step = Math.floor(elapsed / 15) % PLAN_STEPS.length
  const pct = Math.min(Math.round((elapsed / 60) * 90), 90)
  const filled = Math.round(pct / 5)

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-md-surface-container rounded-md-lg p-8 shadow-sm flex flex-col items-center gap-4 min-w-[340px]">
        <div className="text-md-primary animate-pulse text-lg">Planning...</div>
        <p className="text-sm text-md-on-surface-variant">{batchProgress?.featureName || PLAN_STEPS[step]}</p>
        <div className="w-full max-w-[200px]">
          <div className="w-full h-2 bg-md-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-md-primary rounded-full transition-all ease-md-standard duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-md-on-surface-variant mt-1 text-center">{pct}%</div>
        </div>
        <div className="flex gap-6 text-[10px] text-md-outline">
          <span>Elapsed: {elapsed}s</span>
          <span>Est: 30-60s</span>
        </div>
      </div>
    </div>
  )
}
const API_BASE_REFINERY = '/api/refinery'

async function apiCall(base, path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    }
  })
  return res.json()
}

const PHASE_LABELS = { 1: 'FOUNDATION', 2: 'CORE LOGIC', 3: 'UI', 4: 'INTEGRATION' }
const PRIORITY_COLORS = { critical: 'text-red-500', high: 'text-amber-500', medium: 'text-md-primary', low: 'text-md-outline' }
const STATUS_BADGES = {
  pending: { label: 'Pending', color: 'text-md-outline border-md-outline' },
  in_progress: { label: 'In Progress', color: 'text-amber-500 border-amber-500' },
  done: { label: 'Done', color: 'text-md-primary border-md-primary' },
  blocked: { label: 'Blocked', color: 'text-red-500 border-red-500' },
}

export default function Planner() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [features, setFeatures] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)
  const [selectedWO, setSelectedWO] = useState(null)
  const [viewMode, setViewMode] = useState('phase') // 'phase' or 'feature'

  const fetchData = useCallback(async () => {
    const [featRes, woRes] = await Promise.all([
      apiCall(API_BASE_REFINERY, `/${project_id}/features`),
      apiCall(API_BASE, `/${project_id}/work-orders`),
    ])
    setFeatures(featRes.features || [])
    setWorkOrders(woRes.work_orders || [])
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-generate work orders when user arrives with 0 WOs but has features
  const [autoTriggered, setAutoTriggered] = useState(false)
  useEffect(() => {
    if (!loading && !autoTriggered && workOrders.length === 0 && features.length > 0 && !aiLoading) {
      setAutoTriggered(true)
      generateAll()
    }
  }, [loading, workOrders.length, features.length])

  const generateAll = async () => {
    setAiLoading(true)
    setBatchProgress({ current: 0, total: 1, featureName: 'Generating work orders...' })
    try {
      const res = await apiCall(API_BASE, '/generate-all-work-orders', {
        method: 'POST',
        body: JSON.stringify({ project_id })
      })
      setBatchProgress({ current: 1, total: 1, featureName: `${res.count} work orders created` })
      await fetchData()
    } catch (err) {
      console.error('Generate all work orders failed:', err)
    }
    setTimeout(() => setBatchProgress(null), 2000)
    setAiLoading(false)
  }

  const updateStatus = async (woId, newStatus) => {
    await apiCall(API_BASE, `/work-orders/${woId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    })
    setWorkOrders(prev => prev.map(wo => wo.id === woId ? { ...wo, status: newStatus } : wo))
    if (selectedWO?.id === woId) setSelectedWO(prev => ({ ...prev, status: newStatus }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  // Group by phase or feature
  const grouped = viewMode === 'phase'
    ? [1, 2, 3, 4].map(p => ({ key: p, label: `PHASE ${p}: ${PHASE_LABELS[p]}`, items: workOrders.filter(wo => wo.phase === p) })).filter(g => g.items.length > 0)
    : features.map(f => ({ key: f.id, label: f.name, items: workOrders.filter(wo => wo.feature_id === f.id) })).filter(g => g.items.length > 0)

  const totalWOs = workOrders.length
  const doneWOs = workOrders.filter(wo => wo.status === 'done').length
  const inProgressWOs = workOrders.filter(wo => wo.status === 'in_progress').length

  

  return (
    <div className="min-h-screen bg-md-background text-md-on-surface">
      {/* AI Loading overlay */}
      {aiLoading && <PlannerLoadingOverlay batchProgress={batchProgress} />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-md-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dashboard/${project_id}`)} className="text-md-on-surface-variant hover:text-md-primary text-sm">← BACK</button>
          <h1 className="text-lg font-bold">PLANNER</h1>
          <span className="text-xs text-md-outline">// work orders</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'phase' ? 'feature' : 'phase')}
            className="text-xs text-md-on-surface-variant border border-md-outline-variant px-2 py-1 hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300"
          >
            View: {viewMode === 'phase' ? 'By Phase' : 'By Feature'}
          </button>
          {workOrders.length === 0 && (
            <button
              onClick={generateAll}
              disabled={aiLoading}
              className="text-sm border border-md-primary text-md-primary px-3 py-1 hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300 disabled:opacity-40"
            >
              Generate All Work Orders
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-md-outline-variant flex gap-6 text-xs">
        <span>TOTAL: <span className="text-md-primary font-bold">{totalWOs}</span></span>
        <span>DONE: <span className="text-md-primary font-bold">{doneWOs}</span></span>
        <span>IN PROGRESS: <span className="text-amber-500 font-bold">{inProgressWOs}</span></span>
        <span>PENDING: <span className="text-md-outline font-bold">{totalWOs - doneWOs - inProgressWOs}</span></span>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left: Work order list */}
        <div className="lg:w-1/2 border-r border-md-outline-variant overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {workOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-md-on-surface-variant mb-4">No work orders yet.</p>
              <p className="text-xs text-md-outline mb-6">Generate work orders from your blueprints to create an implementation plan.</p>
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-6 py-3 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300 disabled:opacity-40"
              >
                Generate Work Orders
              </button>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.key}>
                <div className="px-4 py-2 bg-md-surface-container border-b border-md-outline-variant text-xs font-bold text-md-on-surface-variant">
                  {group.label} ({group.items.length})
                </div>
                {group.items.map(wo => {
                  const badge = STATUS_BADGES[wo.status] || STATUS_BADGES.pending
                  return (
                    <button
                      key={wo.id}
                      onClick={() => setSelectedWO(wo)}
                      className={`w-full text-left px-4 py-3 border-b border-md-outline-variant hover:bg-md-surface-container transition-all ease-md-standard duration-300 ${selectedWO?.id === wo.id ? 'bg-md-surface-container border-l-2 border-l-md-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate pr-2">{wo.title}</span>
                        <span className={`text-[10px] border px-1.5 py-0.5 ${badge.color}`}>{badge.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className={PRIORITY_COLORS[wo.priority] || ''}>{wo.priority?.toUpperCase()}</span>
                        <span className="text-md-outline">{wo.estimated_complexity}</span>
                        <span className="text-md-outline">{wo.feature_name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Right: Work order detail */}
        <div className="lg:w-1/2 overflow-y-auto p-4 sm:p-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {!selectedWO ? (
            <div className="text-md-outline text-center mt-12">Select a work order to view details</div>
          ) : (
            <div>
              <h2 className="text-lg font-bold mb-2">{selectedWO.title}</h2>
              <p className="text-sm text-md-on-surface-variant mb-4">{selectedWO.description}</p>

              {/* Status controls */}
              <div className="flex gap-2 mb-6">
                {['pending', 'in_progress', 'done', 'blocked'].map(s => {
                  const badge = STATUS_BADGES[s]
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedWO.id, s)}
                      className={`text-[10px] border px-2 py-1 transition-all ease-md-standard duration-300 ${selectedWO.status === s ? badge.color + ' bg-md-surface-container' : 'text-md-outline border-md-outline hover:border-md-primary'}`}
                    >
                      {badge.label}
                    </button>
                  )
                })}
              </div>

              {/* Files to create */}
              {selectedWO.files_to_create?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-md-on-surface-variant mb-2">FILES TO CREATE</h3>
                  {selectedWO.files_to_create.map((f, i) => (
                    <div key={i} className="border border-md-outline-variant rounded-md-lg p-3 mb-2">
                      <div className="text-sm text-md-primary font-medium">{f.path}</div>
                      <div className="text-xs text-md-on-surface-variant mt-1">{f.purpose}</div>
                      {f.key_contents && <div className="text-[10px] text-md-outline mt-1">{f.key_contents}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Files to modify */}
              {selectedWO.files_to_modify?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-md-on-surface-variant mb-2">FILES TO MODIFY</h3>
                  {selectedWO.files_to_modify.map((f, i) => (
                    <div key={i} className="border border-md-outline-variant rounded-md-lg p-3 mb-2">
                      <div className="text-sm text-md-primary font-medium">{f.path}</div>
                      <div className="text-xs text-md-on-surface-variant mt-1">{f.change}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dependencies */}
              {selectedWO.dependencies?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-md-on-surface-variant mb-2">DEPENDENCIES</h3>
                  {selectedWO.dependencies.map((d, i) => (
                    <div key={i} className="text-xs text-md-outline border-l-2 border-md-outline-variant pl-3 py-1">→ {d}</div>
                  ))}
                </div>
              )}

              {/* Acceptance criteria */}
              {selectedWO.acceptance_criteria?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-md-on-surface-variant mb-2">ACCEPTANCE CRITERIA</h3>
                  {selectedWO.acceptance_criteria.map((ac, i) => (
                    <div key={i} className="text-xs text-md-on-surface-variant flex items-start gap-2 py-1">
                      <span className="text-md-outline">□</span> {ac}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA to next stage */}
      {workOrders.length > 0 && (
        <div className="px-4 sm:px-6 pb-6">
          <button
            onClick={() => navigate(`/builder/${project_id}`)}
            className="w-full py-4 border-2 border-md-primary text-md-primary text-lg font-bold hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300"
          >
            Continue to Builder →
          </button>
        </div>
      )}
    </div>
  )
}
