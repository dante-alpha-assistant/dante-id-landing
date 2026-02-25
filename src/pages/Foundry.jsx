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

const PRIORITY_LABELS = {
  critical: { text: '[CRITICAL]', cls: 'text-[#ff3333]' },
  high: { text: '[HIGH]', cls: 'text-[#ffb000]' },
  medium: { text: '[MEDIUM]', cls: 'text-[#33ff00]' },
  low: { text: '[LOW]', cls: 'text-[#22aa00]' },
  'nice-to-have': { text: '[NICE]', cls: 'text-[#1a6b1a]' }
}

const METHOD_COLORS = {
  GET: 'text-[#33ff00] bg-[#33ff00]/10',
  POST: 'text-[#33ff00] bg-[#33ff00]/10',
  PUT: 'text-[#ffb000] bg-[#ffb000]/10',
  DELETE: 'text-[#ff3333] bg-[#ff3333]/10',
  PATCH: 'text-[#ffb000] bg-[#ffb000]/10'
}

const TABS = ['API', 'UI', 'DATA', 'TESTS']

export default function Foundry() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [features, setFeatures] = useState([])
  const [blueprints, setBlueprintsMap] = useState({})
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
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
          <span className="text-[#1a6b1a]">/</span>
          <span className="text-sm text-[#22aa00] uppercase">Foundry</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
        >
          [ DASHBOARD ]
        </button>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-8 flex flex-col items-center gap-3">
            <div className="text-[#33ff00] terminal-blink text-lg">[PROCESSING...]</div>
            <p className="text-sm text-[#22aa00]">AI is thinking...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - Features (35%) */}
        <div className="w-[35%] border-r border-[#1f521f] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>FEATURES</h3>
            {missingCount > 0 && (
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-3 py-1.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-xs font-medium transition-colors uppercase"
              >
                [ GENERATE ALL ({missingCount}) ]
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-[#1a6b1a] text-center mt-8">
              No features found. Go to Refinery first to generate a PRD and extract features.
            </p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => {
                const priority = PRIORITY_LABELS[f.priority] || PRIORITY_LABELS.medium
                return (
                  <div
                    key={f.id}
                    onClick={() => selectFeature(f)}
                    className={`p-3 cursor-pointer border transition-colors ${
                      selectedFeature?.id === f.id
                        ? 'bg-[#0f0f0f] border-[#33ff00]'
                        : 'bg-[#0f0f0f] border-[#1f521f] hover:border-[#33ff00]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-[#33ff00] flex-1 truncate">
                        {selectedFeature?.id === f.id ? '> ' : '  '}{f.name}
                      </h4>
                      <span className={`text-[10px] font-bold shrink-0 ${priority.cls}`}>
                        {priority.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {blueprints[f.id] ? (
                        <span className="text-[10px] text-[#33ff00] font-bold">
                          [OK] Blueprint
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#1a6b1a] font-bold">
                          [NONE] No blueprint
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Blueprint (65%) */}
        <div className="w-[65%] overflow-y-auto p-6">
          {!selectedFeature ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#1a6b1a] text-sm">Select a feature to view its blueprint</p>
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-[#22aa00] text-sm">No blueprint generated for &quot;{selectedFeature.name}&quot;</p>
              <button
                onClick={() => generateBlueprint(selectedFeature.id)}
                disabled={aiLoading}
                className="px-6 py-3 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-sm font-medium transition-colors uppercase"
              >
                [ GENERATE BLUEPRINT ]
              </button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{selectedFeature.name}</h2>
                <span className="text-[10px] text-[#1a6b1a]">v{currentBlueprint.version}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className="px-3 py-1.5 bg-transparent border border-[#1f521f] text-xs text-[#22aa00] hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors uppercase"
                >
                  [ REFINE ]
                </button>
                <button
                  onClick={() => generateBlueprint(selectedFeature.id)}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-transparent border border-[#1f521f] text-xs text-[#22aa00] hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors uppercase"
                >
                  [ REGENERATE ]
                </button>
              </div>

              {/* Refine input */}
              {showRefineInput && (
                <div className="mb-6 flex gap-2">
                  <input
                    className="flex-1 bg-[#0d0d0d] border border-[#1f521f] px-3 py-2 text-sm text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] font-mono"
                    style={{ caretColor: '#33ff00' }}
                    placeholder="How should I improve this blueprint?"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refineInput.trim()) { refineBlueprint(refineInput); setRefineInput('') } }}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (refineInput.trim()) { refineBlueprint(refineInput); setRefineInput('') } }}
                    className="px-4 py-2 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm transition-colors uppercase"
                  >
                    [ GO ]
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-6 border-b border-[#1f521f]">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border border-b-0 ${
                      activeTab === i
                        ? 'bg-[#33ff00] text-[#0a0a0a] border-[#33ff00]'
                        : 'text-[#22aa00] border-[#1f521f] hover:text-[#33ff00] bg-transparent'
                    }`}
                  >
                    [ {tab} ]
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
  if (!data) return <p className="text-[#1a6b1a] text-sm">No API data</p>
  const endpoints = data.endpoints || []
  const integrations = data.integrations || []

  return (
    <div className="space-y-4">
      {endpoints.map((ep, i) => (
        <div key={i} className="bg-[#0f0f0f] border border-[#1f521f] p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] px-2 py-0.5 font-mono font-bold ${METHOD_COLORS[ep.method] || 'text-[#22aa00]'}`}>
              {ep.method}
            </span>
            <span className="text-sm font-mono text-[#33ff00]">{ep.path}</span>
            {ep.auth_required && (
              <span className="text-[10px] px-1.5 py-0.5 text-[#ffb000]">[AUTH]</span>
            )}
          </div>
          <p className="text-xs text-[#22aa00] mb-3">{ep.description}</p>
          {ep.request_body && (
            <div className="mb-2">
              <span className="text-[10px] text-[#1a6b1a] uppercase">REQUEST</span>
              <pre className="text-xs text-[#22aa00] bg-[#0a0a0a] border border-[#1f521f] p-2 mt-1 overflow-x-auto">
                {typeof ep.request_body === 'string' ? ep.request_body : JSON.stringify(ep.request_body, null, 2)}
              </pre>
            </div>
          )}
          {ep.response && (
            <div>
              <span className="text-[10px] text-[#1a6b1a] uppercase">RESPONSE</span>
              <pre className="text-xs text-[#22aa00] bg-[#0a0a0a] border border-[#1f521f] p-2 mt-1 overflow-x-auto">
                {typeof ep.response === 'string' ? ep.response : JSON.stringify(ep.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
      {integrations.length > 0 && (
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
          <h4 className="text-xs text-[#1a6b1a] uppercase mb-2">INTEGRATIONS</h4>
          <div className="flex flex-wrap gap-2">
            {integrations.map((int, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#22aa00]">{int}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UiTab({ data }) {
  if (!data) return <p className="text-[#1a6b1a] text-sm">No UI data</p>
  const components = data.components || []
  const routes = data.routes || []
  const userFlow = data.user_flow || []

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs text-[#1a6b1a] uppercase mb-3">COMPONENTS</h4>
        <div className="space-y-2">
          {components.map((c, i) => (
            <div key={i} className="bg-[#0f0f0f] border border-[#1f521f] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[#33ff00]">{c.name}</span>
                <span className="text-[10px] px-2 py-0.5 text-[#33ff00] bg-[#33ff00]/10">[{c.type?.toUpperCase()}]</span>
              </div>
              <p className="text-xs text-[#22aa00]">{c.description}</p>
              {c.props?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.props.map((p, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 bg-[#0a0a0a] text-[#22aa00] font-mono border border-[#1f521f]">{p}</span>
                  ))}
                </div>
              )}
              {c.children?.length > 0 && (
                <div className="mt-2 text-[10px] text-[#1a6b1a]">
                  Children: {c.children.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {routes.length > 0 && (
        <div>
          <h4 className="text-xs text-[#1a6b1a] uppercase mb-3">ROUTES</h4>
          <div className="space-y-1">
            {routes.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f521f] p-2">
                <span className="text-xs font-mono text-[#33ff00]">{r.path}</span>
                <span className="text-xs text-[#22aa00]">→ {r.component}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {userFlow.length > 0 && (
        <div>
          <h4 className="text-xs text-[#1a6b1a] uppercase mb-3">USER FLOW</h4>
          <ol className="space-y-1">
            {userFlow.map((step, i) => (
              <li key={i} className="text-xs text-[#22aa00] flex gap-2">
                <span className="text-[#33ff00] shrink-0">{i + 1}.</span>
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
  if (!data) return <p className="text-[#1a6b1a] text-sm">No data model</p>
  const tables = data.tables || []
  const indexes = data.indexes || []

  return (
    <div className="space-y-4">
      {tables.map((t, i) => (
        <div key={i} className="bg-[#0f0f0f] border border-[#1f521f] p-4">
          <h4 className="text-sm font-medium text-[#33ff00] mb-3 font-mono" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>{t.name}</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#1a6b1a] border-b border-[#1f521f]">
                <th className="text-left py-1 pr-4">COLUMN</th>
                <th className="text-left py-1 pr-4">TYPE</th>
                <th className="text-left py-1">CONSTRAINTS</th>
              </tr>
            </thead>
            <tbody>
              {(t.columns || []).map((col, j) => (
                <tr key={j} className="border-b border-[#0a0a0a]">
                  <td className="py-1.5 pr-4 text-[#33ff00] font-mono">{col.name}</td>
                  <td className="py-1.5 pr-4 text-[#22aa00] font-mono">{col.type}</td>
                  <td className="py-1.5 text-[#1a6b1a]">{col.constraints}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {t.relationships?.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[#1f521f]">
              <span className="text-[10px] text-[#1a6b1a] uppercase">RELATIONSHIPS</span>
              <ul className="mt-1 space-y-0.5">
                {t.relationships.map((r, j) => (
                  <li key={j} className="text-xs text-[#22aa00]">{'>'} {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      {indexes.length > 0 && (
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
          <h4 className="text-xs text-[#1a6b1a] uppercase mb-2">INDEXES</h4>
          <ul className="space-y-1">
            {indexes.map((idx, i) => (
              <li key={i} className="text-xs text-[#22aa00] font-mono">{'>'} {idx}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TestsTab({ data }) {
  if (!data) return <p className="text-[#1a6b1a] text-sm">No tests</p>
  const sections = [
    { key: 'unit', label: 'UNIT TESTS', color: 'text-[#33ff00]' },
    { key: 'integration', label: 'INTEGRATION TESTS', color: 'text-[#22aa00]' },
    { key: 'e2e', label: 'E2E TESTS', color: 'text-[#ffb000]' }
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
                <div key={i} className="bg-[#0f0f0f] border border-[#1f521f] p-3">
                  <h5 className="text-sm font-medium text-[#33ff00] mb-1">{t.name}</h5>
                  <p className="text-xs text-[#22aa00] mb-2">{t.description}</p>
                  <div className="text-[10px] text-[#1a6b1a]">
                    <span className="uppercase">EXPECTED:</span>{' '}
                    <span className="text-[#22aa00]">{t.expected}</span>
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
