import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE = '/api/planner'
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
const PRIORITY_COLORS = { critical: 'text-red-400', high: 'text-[#ffb000]', medium: 'text-[#33ff00]', low: 'text-[#1a6b1a]' }
const STATUS_BADGES = {
  pending: { label: 'PENDING', color: 'text-[#1a6b1a] border-[#1a6b1a]' },
  in_progress: { label: 'IN PROGRESS', color: 'text-[#ffb000] border-[#ffb000]' },
  done: { label: 'DONE', color: 'text-[#33ff00] border-[#33ff00]' },
  blocked: { label: 'BLOCKED', color: 'text-red-400 border-red-400' },
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] terminal-blink font-mono">[LOADING...]</div>
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

  const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-8 flex flex-col items-center gap-3">
            <div className="text-[#33ff00] terminal-blink text-lg">[PLANNING...]</div>
            {batchProgress ? (
              <p className="text-sm text-[#22aa00]">{batchProgress.featureName}</p>
            ) : (
              <p className="text-sm text-[#22aa00]">AI is generating work orders...</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dashboard/${project_id}`)} className="text-[#22aa00] hover:text-[#33ff00] text-sm">← BACK</button>
          <h1 className="text-lg font-bold" style={glowStyle}>PLANNER</h1>
          <span className="text-xs text-[#1a6b1a]">// work orders</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'phase' ? 'feature' : 'phase')}
            className="text-xs text-[#22aa00] border border-[#1f521f] px-2 py-1 hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors"
          >
            [ VIEW: {viewMode === 'phase' ? 'BY PHASE' : 'BY FEATURE'} ]
          </button>
          {workOrders.length === 0 && (
            <button
              onClick={generateAll}
              disabled={aiLoading}
              className="text-sm border border-[#33ff00] text-[#33ff00] px-3 py-1 hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors disabled:opacity-40"
            >
              [ GENERATE ALL WORK ORDERS ]
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#1f521f] flex gap-6 text-xs">
        <span>TOTAL: <span className="text-[#33ff00] font-bold">{totalWOs}</span></span>
        <span>DONE: <span className="text-[#33ff00] font-bold">{doneWOs}</span></span>
        <span>IN PROGRESS: <span className="text-[#ffb000] font-bold">{inProgressWOs}</span></span>
        <span>PENDING: <span className="text-[#1a6b1a] font-bold">{totalWOs - doneWOs - inProgressWOs}</span></span>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left: Work order list */}
        <div className="lg:w-1/2 border-r border-[#1f521f] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {workOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#22aa00] mb-4">No work orders yet.</p>
              <p className="text-xs text-[#1a6b1a] mb-6">Generate work orders from your blueprints to create an implementation plan.</p>
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-6 py-3 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors disabled:opacity-40"
              >
                [ GENERATE WORK ORDERS ]
              </button>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.key}>
                <div className="px-4 py-2 bg-[#0f0f0f] border-b border-[#1f521f] text-xs font-bold text-[#22aa00]">
                  {group.label} ({group.items.length})
                </div>
                {group.items.map(wo => {
                  const badge = STATUS_BADGES[wo.status] || STATUS_BADGES.pending
                  return (
                    <button
                      key={wo.id}
                      onClick={() => setSelectedWO(wo)}
                      className={`w-full text-left px-4 py-3 border-b border-[#0f0f0f] hover:bg-[#111] transition-colors ${selectedWO?.id === wo.id ? 'bg-[#111] border-l-2 border-l-[#33ff00]' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate pr-2">{wo.title}</span>
                        <span className={`text-[10px] border px-1.5 py-0.5 ${badge.color}`}>{badge.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className={PRIORITY_COLORS[wo.priority] || ''}>{wo.priority?.toUpperCase()}</span>
                        <span className="text-[#1a6b1a]">{wo.estimated_complexity}</span>
                        <span className="text-[#1a6b1a]">{wo.feature_name}</span>
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
            <div className="text-[#1a6b1a] text-center mt-12">Select a work order to view details</div>
          ) : (
            <div>
              <h2 className="text-lg font-bold mb-2" style={glowStyle}>{selectedWO.title}</h2>
              <p className="text-sm text-[#22aa00] mb-4">{selectedWO.description}</p>

              {/* Status controls */}
              <div className="flex gap-2 mb-6">
                {['pending', 'in_progress', 'done', 'blocked'].map(s => {
                  const badge = STATUS_BADGES[s]
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedWO.id, s)}
                      className={`text-[10px] border px-2 py-1 transition-colors ${selectedWO.status === s ? badge.color + ' bg-[#111]' : 'text-[#1a6b1a] border-[#1a6b1a] hover:border-[#33ff00]'}`}
                    >
                      {badge.label}
                    </button>
                  )
                })}
              </div>

              {/* Files to create */}
              {selectedWO.files_to_create?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[#22aa00] mb-2">FILES TO CREATE</h3>
                  {selectedWO.files_to_create.map((f, i) => (
                    <div key={i} className="border border-[#1f521f] p-3 mb-2">
                      <div className="text-sm text-[#33ff00] font-medium">{f.path}</div>
                      <div className="text-xs text-[#22aa00] mt-1">{f.purpose}</div>
                      {f.key_contents && <div className="text-[10px] text-[#1a6b1a] mt-1 font-mono">{f.key_contents}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Files to modify */}
              {selectedWO.files_to_modify?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[#22aa00] mb-2">FILES TO MODIFY</h3>
                  {selectedWO.files_to_modify.map((f, i) => (
                    <div key={i} className="border border-[#1f521f] p-3 mb-2">
                      <div className="text-sm text-[#33ff00] font-medium">{f.path}</div>
                      <div className="text-xs text-[#22aa00] mt-1">{f.change}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dependencies */}
              {selectedWO.dependencies?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[#22aa00] mb-2">DEPENDENCIES</h3>
                  {selectedWO.dependencies.map((d, i) => (
                    <div key={i} className="text-xs text-[#1a6b1a] border-l-2 border-[#1f521f] pl-3 py-1">→ {d}</div>
                  ))}
                </div>
              )}

              {/* Acceptance criteria */}
              {selectedWO.acceptance_criteria?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[#22aa00] mb-2">ACCEPTANCE CRITERIA</h3>
                  {selectedWO.acceptance_criteria.map((ac, i) => (
                    <div key={i} className="text-xs text-[#22aa00] flex items-start gap-2 py-1">
                      <span className="text-[#1a6b1a]">□</span> {ac}
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
            className="w-full py-4 border-2 border-[#33ff00] text-[#33ff00] text-lg font-bold hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors"
          >
            [ CONTINUE → BUILDER: Generate Code ]
          </button>
        </div>
      )}
    </div>
  )
}
