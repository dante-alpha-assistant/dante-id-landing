import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE = '/api/refinery'

async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  })
  return res.json()
}

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'nice-to-have': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

const STATUS_COLORS = {
  draft: 'bg-zinc-700 text-zinc-300',
  ready: 'bg-indigo-500/20 text-indigo-400',
  'in-progress': 'bg-yellow-500/20 text-yellow-400',
  done: 'bg-green-500/20 text-green-400'
}

function PrdSection({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => { setDraft(value || '') }, [value])

  if (editing) {
    return (
      <div className="mb-4">
        <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
        <textarea
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-y min-h-[80px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { setEditing(false); if (draft !== value) onSave(draft) }}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="mb-4 cursor-pointer group" onClick={() => setEditing(true)}>
      <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap group-hover:bg-[#1a1a1a] rounded p-2 -m-2 transition-colors">
        {value || <span className="text-gray-600 italic">Click to edit...</span>}
      </p>
    </div>
  )
}

function FeatureCard({ feature, expanded, onToggle }) {
  return (
    <div
      className="bg-[#111] border border-[#222] rounded-lg p-4 cursor-pointer hover:border-[#333] transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white flex-1">{feature.name}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[feature.priority] || PRIORITY_COLORS.medium}`}>
          {feature.priority}
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        {expanded ? feature.description : (feature.description?.slice(0, 100) + (feature.description?.length > 100 ? '…' : ''))}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[feature.status] || STATUS_COLORS.draft}`}>
          {feature.status}
        </span>
      </div>
      {expanded && feature.acceptance_criteria?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#222]">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Acceptance Criteria</p>
          <ul className="space-y-1">
            {feature.acceptance_criteria.map((ac, i) => (
              <li key={i} className="text-xs text-gray-400 flex gap-1">
                <span className="text-indigo-400">•</span> {ac}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Refinery() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [prd, setPrd] = useState(null)
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [ideaText, setIdeaText] = useState('')
  const [refineInput, setRefineInput] = useState('')
  const [showRefineInput, setShowRefineInput] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState({})

  const fetchData = useCallback(async () => {
    const [prdRes, featRes] = await Promise.all([
      apiCall(`/${project_id}/prd`),
      apiCall(`/${project_id}/features`)
    ])
    setPrd(prdRes.prd)
    setFeatures(featRes.features || [])
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  const generatePrd = async () => {
    if (!ideaText.trim()) return
    setAiLoading(true)
    try {
      const res = await apiCall('/generate-prd', {
        method: 'POST',
        body: JSON.stringify({ project_id, idea_description: ideaText })
      })
      if (res.prd) setPrd(res.prd)
    } catch (err) {
      console.error('Generate PRD failed:', err)
    }
    setAiLoading(false)
  }

  const refinePrd = async (instruction) => {
    if (!prd) return
    setAiLoading(true)
    setShowRefineInput(false)
    try {
      const res = await apiCall('/refine', {
        method: 'POST',
        body: JSON.stringify({ project_id, prd_id: prd.id, instruction })
      })
      if (res.prd) setPrd(res.prd)
    } catch (err) {
      console.error('Refine failed:', err)
    }
    setAiLoading(false)
  }

  const extractFeatures = async () => {
    if (!prd) return
    setAiLoading(true)
    try {
      const res = await apiCall('/extract-features', {
        method: 'POST',
        body: JSON.stringify({ project_id, prd_id: prd.id })
      })
      if (res.features) setFeatures(res.features)
    } catch (err) {
      console.error('Extract features failed:', err)
    }
    setAiLoading(false)
  }

  const savePrdField = async (field, value) => {
    if (!prd) return
    const updated = { ...prd.content, [field]: value }
    const res = await apiCall(`/${project_id}/prd`, {
      method: 'PUT',
      body: JSON.stringify({ content: updated })
    })
    if (res.prd) setPrd(res.prd)
  }

  const content = prd?.content || {}

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight">dante.</span>
          <span className="text-gray-500">/</span>
          <span className="text-sm text-gray-400">Refinery</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </button>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">AI is thinking...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - PRD (60%) */}
        <div className="w-[60%] border-r border-[#222] overflow-y-auto p-6">
          {!prd ? (
            <div className="max-w-xl mx-auto mt-16">
              <h2 className="text-xl font-semibold mb-2">Describe your product idea</h2>
              <p className="text-sm text-gray-500 mb-6">
                The AI will generate a comprehensive Product Requirements Document.
              </p>
              <textarea
                className="w-full h-40 bg-[#111] border border-[#222] rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="e.g., A marketplace for freelance designers to sell UI component packs..."
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
              />
              <button
                onClick={generatePrd}
                disabled={!ideaText.trim() || aiLoading}
                className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                Generate PRD
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* AI action buttons */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  ✏️ Refine
                </button>
                <button
                  onClick={() => refinePrd("Expand all sections with more detail and specificity")}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  📐 Expand
                </button>
                <button
                  onClick={() => refinePrd("Play devil's advocate. Challenge assumptions, identify gaps, ask hard questions, and suggest improvements")}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  🔍 Challenge
                </button>
                <span className="ml-auto text-[10px] text-gray-600">v{prd.version}</span>
              </div>

              {/* Refine input */}
              {showRefineInput && (
                <div className="mb-6 flex gap-2">
                  <input
                    className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="How should I improve this?"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refineInput.trim()) { refinePrd(refineInput); setRefineInput('') } }}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (refineInput.trim()) { refinePrd(refineInput); setRefineInput('') } }}
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition-colors"
                  >
                    Go
                  </button>
                </div>
              )}

              {/* PRD sections */}
              <h1 className="text-2xl font-bold mb-6">{content.title || 'Untitled PRD'}</h1>

              <PrdSection label="Overview" value={content.overview} onSave={(v) => savePrdField('overview', v)} />
              <PrdSection label="Problem" value={content.problem} onSave={(v) => savePrdField('problem', v)} />
              <PrdSection label="Solution" value={content.solution} onSave={(v) => savePrdField('solution', v)} />

              {content.target_users?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Target Users</label>
                  <div className="space-y-2">
                    {content.target_users.map((u, i) => (
                      <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-200">{u.persona}</p>
                        <ul className="mt-1 space-y-0.5">
                          {u.needs?.map((n, j) => (
                            <li key={j} className="text-xs text-gray-400">• {n}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.tech_stack && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Tech Stack</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(content.tech_stack).map(([k, v]) => (
                      <div key={k} className="bg-[#111] border border-[#222] rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase">{k}</span>
                        <p className="text-xs text-gray-300">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.success_metrics?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Success Metrics</label>
                  <div className="space-y-1">
                    {content.success_metrics.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs bg-[#111] border border-[#222] rounded-lg p-2">
                        <span className="text-gray-300">{m.metric}</span>
                        <span className="text-indigo-400">{m.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.risks?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Risks</label>
                  <div className="space-y-1">
                    {content.risks.map((r, i) => (
                      <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-2">
                        <p className="text-xs text-red-400">{r.risk}</p>
                        <p className="text-xs text-gray-400 mt-1">↳ {r.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PrdSection label="Timeline" value={content.timeline} onSave={(v) => savePrdField('timeline', v)} />
            </div>
          )}
        </div>

        {/* Right Panel - Features (40%) */}
        <div className="w-[40%] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Features</h3>
            {prd && features.length === 0 && (
              <button
                onClick={extractFeatures}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors"
              >
                Extract Features
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-gray-600 text-center mt-8">
              {prd ? 'Click "Extract Features" to pull features from the PRD' : 'Generate a PRD first to extract features'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  expanded={!!expandedFeatures[f.id]}
                  onToggle={() => setExpandedFeatures(p => ({ ...p, [f.id]: !p[f.id] }))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
