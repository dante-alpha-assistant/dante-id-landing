import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE_FOUNDRY = '/api/foundry'
const API_BASE_REFINERY = '/api/refinery'

async function apiCall(base, path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${base}${path}`, {
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

const METHOD_COLORS = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
  PATCH: 'bg-purple-500/20 text-purple-400'
}

const TABS = ['API', 'UI', 'Data Model', 'Tests']

export default function Foundry() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [features, setFeatures] = useState([])
  const [blueprints, setBlueprintsMap] = useState({}) // feature_id -> blueprint
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showRefineInput, setShowRefineInput] = useState(false)
  const [refineInput, setRefineInput] = useState('')

  const fetchData = useCallback(async () => {
    const [featRes, bpRes] = await Promise.all([
      apiCall(API_BASE_REFINERY, `/${project_id}/features`),
      apiCall(API_BASE_FOUNDRY, `/${project_id}/blueprints`)
    ])
    setFeatures(featRes.features || [])
    const bpMap = {}
    for (const bp of (bpRes.blueprints || [])) {
      bpMap[bp.feature_id] = bp
    }
    setBlueprintsMap(bpMap)
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchBlueprint = async (featureId) => {
    const res = await apiCall(API_BASE_FOUNDRY, `/${project_id}/blueprints/${featureId}`)
    if (res.blueprint) {
      setBlueprintsMap(prev => ({ ...prev, [featureId]: res.blueprint }))
    }
    return res.blueprint
  }

  const generateBlueprint = async (featureId) => {
    setAiLoading(true)
    try {
      const res = await apiCall(API_BASE_FOUNDRY, '/generate-blueprint', {
        method: 'POST',
        body: JSON.stringify({ feature_id: featureId, project_id })
      })
      if (res.blueprint) {
        setBlueprintsMap(prev => ({ ...prev, [featureId]: res.blueprint }))
      }
    } catch (err) {
      console.error('Generate blueprint failed:', err)
    }
    setAiLoading(false)
  }

  const generateAll = async () => {
    const missing = features.filter(f => !blueprints[f.id])
    if (missing.length === 0) return
    setAiLoading(true)
    for (const f of missing) {
      try {
        const res = await apiCall(API_BASE_FOUNDRY, '/generate-blueprint', {
          method: 'POST',
          body: JSON.stringify({ feature_id: f.id, project_id })
        })
        if (res.blueprint) {
          setBlueprintsMap(prev => ({ ...prev, [f.id]: res.blueprint }))
        }
      } catch (err) {
        console.error(`Generate blueprint for ${f.name} failed:`, err)
      }
    }
    setAiLoading(false)
  }

  const refineBlueprint = async (instruction) => {
    if (!selectedFeature) return
    setAiLoading(true)
    setShowRefineInput(false)
    try {
      const res = await apiCall(API_BASE_FOUNDRY, '/refine-blueprint', {
        method: 'POST',
        body: JSON.stringify({ feature_id: selectedFeature.id, instruction })
      })
      if (res.blueprint) {
        setBlueprintsMap(prev => ({ ...prev, [selectedFeature.id]: res.blueprint }))
      }
    } catch (err) {
      console.error('Refine blueprint failed:', err)
    }
    setAiLoading(false)
  }

  const selectFeature = async (f) => {
    setSelectedFeature(f)
    setActiveTab(0)
    setShowRefineInput(false)
    if (!blueprints[f.id]?.content) {
      await fetchBlueprint(f.id)
    }
  }

  const currentBlueprint = selectedFeature ? blueprints[selectedFeature.id] : null
  const content = currentBlueprint?.content || null
  const missingCount = features.filter(f => !blueprints[f.id]).length

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
          <span className="text-sm text-gray-400">Foundry</span>
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
        {/* Left Panel - Features (35%) */}
        <div className="w-[35%] border-r border-[#222] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Features</h3>
            {missingCount > 0 && (
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors"
              >
                Generate All ({missingCount})
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-gray-600 text-center mt-8">
              No features found. Go to Refinery first to generate a PRD and extract features.
            </p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => (
                <div
                  key={f.id}
                  onClick={() => selectFeature(f)}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedFeature?.id === f.id
                      ? 'bg-[#1a1a1a] border-indigo-500/50'
                      : 'bg-[#111] border-[#222] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white flex-1 truncate">{f.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_COLORS[f.priority] || PRIORITY_COLORS.medium}`}>
                      {f.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {blueprints[f.id] ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        ✓ Blueprint
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
                        No blueprint
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Blueprint (65%) */}
        <div className="w-[65%] overflow-y-auto p-6">
          {!selectedFeature ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-sm">Select a feature to view its blueprint</p>
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-gray-500 text-sm">No blueprint generated for "{selectedFeature.name}"</p>
              <button
                onClick={() => generateBlueprint(selectedFeature.id)}
                disabled={aiLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
              >
                Generate Blueprint
              </button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedFeature.name}</h2>
                <span className="text-[10px] text-gray-600">v{currentBlueprint.version}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  ✏️ Refine
                </button>
                <button
                  onClick={() => generateBlueprint(selectedFeature.id)}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  🔄 Regenerate
                </button>
              </div>

              {/* Refine input */}
              {showRefineInput && (
                <div className="mb-6 flex gap-2">
                  <input
                    className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="How should I improve this blueprint?"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refineInput.trim()) { refineBlueprint(refineInput); setRefineInput('') } }}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (refineInput.trim()) { refineBlueprint(refineInput); setRefineInput('') } }}
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition-colors"
                  >
                    Go
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-6 border-b border-[#222]">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === i
                        ? 'text-white border-indigo-500'
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 0 && <ApiTab data={content.api} />}
              {activeTab === 1 && <UiTab data={content.ui} />}
              {activeTab === 2 && <DataModelTab data={content.data_model} />}
              {activeTab === 3 && <TestsTab data={content.tests} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ApiTab({ data }) {
  if (!data) return <p className="text-gray-600 text-sm">No API data</p>
  const endpoints = data.endpoints || []
  const integrations = data.integrations || []

  return (
    <div className="space-y-4">
      {endpoints.map((ep, i) => (
        <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${METHOD_COLORS[ep.method] || 'bg-zinc-700 text-zinc-300'}`}>
              {ep.method}
            </span>
            <span className="text-sm font-mono text-gray-200">{ep.path}</span>
            {ep.auth_required && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">🔒</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">{ep.description}</p>
          {ep.request_body && (
            <div className="mb-2">
              <span className="text-[10px] text-gray-500 uppercase">Request</span>
              <pre className="text-xs text-gray-300 bg-[#0a0a0a] rounded p-2 mt-1 overflow-x-auto">
                {typeof ep.request_body === 'string' ? ep.request_body : JSON.stringify(ep.request_body, null, 2)}
              </pre>
            </div>
          )}
          {ep.response && (
            <div>
              <span className="text-[10px] text-gray-500 uppercase">Response</span>
              <pre className="text-xs text-gray-300 bg-[#0a0a0a] rounded p-2 mt-1 overflow-x-auto">
                {typeof ep.response === 'string' ? ep.response : JSON.stringify(ep.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
      {integrations.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-lg p-4">
          <h4 className="text-xs text-gray-500 uppercase mb-2">Integrations</h4>
          <div className="flex flex-wrap gap-2">
            {integrations.map((int, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded bg-[#1a1a1a] border border-[#333] text-gray-300">{int}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UiTab({ data }) {
  if (!data) return <p className="text-gray-600 text-sm">No UI data</p>
  const components = data.components || []
  const routes = data.routes || []
  const userFlow = data.user_flow || []

  return (
    <div className="space-y-6">
      {/* Components */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase mb-3">Components</h4>
        <div className="space-y-2">
          {components.map((c, i) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{c.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">{c.type}</span>
              </div>
              <p className="text-xs text-gray-400">{c.description}</p>
              {c.props?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.props.map((p, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-400 font-mono">{p}</span>
                  ))}
                </div>
              )}
              {c.children?.length > 0 && (
                <div className="mt-2 text-[10px] text-gray-500">
                  Children: {c.children.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Routes */}
      {routes.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-500 uppercase mb-3">Routes</h4>
          <div className="space-y-1">
            {routes.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-lg p-2">
                <span className="text-xs font-mono text-indigo-400">{r.path}</span>
                <span className="text-xs text-gray-400">→ {r.component}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Flow */}
      {userFlow.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-500 uppercase mb-3">User Flow</h4>
          <ol className="space-y-1">
            {userFlow.map((step, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-indigo-400 shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function DataModelTab({ data }) {
  if (!data) return <p className="text-gray-600 text-sm">No data model</p>
  const tables = data.tables || []
  const indexes = data.indexes || []

  return (
    <div className="space-y-4">
      {tables.map((t, i) => (
        <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 font-mono">{t.name}</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-[#222]">
                <th className="text-left py-1 pr-4">Column</th>
                <th className="text-left py-1 pr-4">Type</th>
                <th className="text-left py-1">Constraints</th>
              </tr>
            </thead>
            <tbody>
              {(t.columns || []).map((col, j) => (
                <tr key={j} className="border-b border-[#1a1a1a]">
                  <td className="py-1.5 pr-4 text-gray-200 font-mono">{col.name}</td>
                  <td className="py-1.5 pr-4 text-indigo-400 font-mono">{col.type}</td>
                  <td className="py-1.5 text-gray-400">{col.constraints}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {t.relationships?.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[#222]">
              <span className="text-[10px] text-gray-500 uppercase">Relationships</span>
              <ul className="mt-1 space-y-0.5">
                {t.relationships.map((r, j) => (
                  <li key={j} className="text-xs text-gray-400">• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      {indexes.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-lg p-4">
          <h4 className="text-xs text-gray-500 uppercase mb-2">Indexes</h4>
          <ul className="space-y-1">
            {indexes.map((idx, i) => (
              <li key={i} className="text-xs text-gray-300 font-mono">• {idx}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TestsTab({ data }) {
  if (!data) return <p className="text-gray-600 text-sm">No tests</p>
  const sections = [
    { key: 'unit', label: 'Unit Tests', color: 'text-green-400' },
    { key: 'integration', label: 'Integration Tests', color: 'text-blue-400' },
    { key: 'e2e', label: 'E2E Tests', color: 'text-purple-400' }
  ]

  return (
    <div className="space-y-6">
      {sections.map(({ key, label, color }) => {
        const tests = data[key] || []
        if (tests.length === 0) return null
        return (
          <div key={key}>
            <h4 className={`text-xs uppercase mb-3 ${color}`}>{label} ({tests.length})</h4>
            <div className="space-y-2">
              {tests.map((t, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <h5 className="text-sm font-medium text-white mb-1">{t.name}</h5>
                  <p className="text-xs text-gray-400 mb-2">{t.description}</p>
                  <div className="text-[10px] text-gray-500">
                    <span className="uppercase">Expected:</span>{' '}
                    <span className="text-gray-300">{t.expected}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
