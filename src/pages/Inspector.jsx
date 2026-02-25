import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE = '/api/inspector'

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

async function apiRefinery(path) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`/api/refinery${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return res.json()
}

const STATUS_CONFIG = {
  untested: { label: '[UNTESTED]', cls: 'text-[#1a6b1a]' },
  running: { label: '[RUNNING...]', cls: 'text-[#ffb000] terminal-blink' },
  passed: { label: '[PASS]', cls: 'text-[#33ff00]' },
  failed: { label: '[FAIL]', cls: 'text-[#ff3333]' },
  partial: { label: '[WARN]', cls: 'text-[#ffb000]' }
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.untested
  return (
    <span className={`text-xs font-bold font-mono ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function AsciiBar({ label, value, max = 100 }) {
  const pct = Math.min(Math.max(value || 0, 0), max)
  const totalBlocks = 20
  const filled = Math.round((pct / max) * totalBlocks)
  const empty = totalBlocks - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  const color = pct >= 80 ? 'text-[#33ff00]' : pct >= 50 ? 'text-[#ffb000]' : 'text-[#ff3333]'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#22aa00] uppercase">{label}</span>
        <span className={`font-bold ${color}`}>{pct}%</span>
      </div>
      <div className={`font-mono text-sm ${color}`}>
        [{bar}]
      </div>
    </div>
  )
}

function TestResultItem({ test }) {
  const [expanded, setExpanded] = useState(false)
  const statusLabel = test.status === 'pass' ? '[PASS]' : test.status === 'fail' ? '[FAIL]' : '[WARN]'
  const statusColor = test.status === 'pass' ? 'text-[#33ff00]' : test.status === 'fail' ? 'text-[#ff3333]' : 'text-[#ffb000]'

  return (
    <div className="border border-[#1f521f] p-3 hover:border-[#33ff00] transition-colors">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold font-mono ${statusColor}`}>{statusLabel}</span>
            <span className="text-sm font-medium text-[#33ff00]">{test.test_name}</span>
          </div>
        </div>
        <p className="text-xs text-[#22aa00] mt-1">{test.description}</p>
      </button>
      {expanded && test.details && (
        <div className="mt-2 pt-2 border-t border-[#1f521f]">
          <p className="text-xs text-[#22aa00] whitespace-pre-wrap font-mono">{test.details}</p>
        </div>
      )}
    </div>
  )
}

export default function Inspector() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [features, setFeatures] = useState([])
  const [testResults, setTestResults] = useState([])
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedResult, setSelectedResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runningTests, setRunningTests] = useState(new Set())
  const [fixSuggestions, setFixSuggestions] = useState(null)
  const [loadingFixes, setLoadingFixes] = useState(false)
  const [builds, setBuilds] = useState({})

  const fetchData = useCallback(async () => {
    const [featRes, testRes] = await Promise.all([
      apiRefinery(`/${project_id}/features`),
      apiCall(`/${project_id}/results`)
    ])
    setFeatures(featRes.features || [])
    setTestResults(testRes.results || [])

    const { data: buildData } = await supabase
      .from('builds')
      .select('id, feature_id')
      .eq('project_id', project_id)
    const buildMap = {}
    ;(buildData || []).forEach(b => { buildMap[b.feature_id] = b.id })
    setBuilds(buildMap)

    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const hasRunning = testResults.some(r => r.status === 'running')
    if (!hasRunning && runningTests.size === 0) return
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [testResults, runningTests, fetchData])

  const getResultForFeature = (featureId) => testResults.find(r => r.feature_id === featureId)

  const runTests = async (featureId) => {
    setRunningTests(prev => new Set([...prev, featureId]))
    try {
      await apiCall('/run-tests', {
        method: 'POST',
        body: JSON.stringify({ feature_id: featureId, project_id })
      })
      await fetchData()
    } catch (err) {
      console.error('Run tests error:', err)
    }
    setRunningTests(prev => {
      const next = new Set(prev)
      next.delete(featureId)
      return next
    })
  }

  const runAllTests = async () => {
    const testable = features.filter(f => builds[f.id])
    for (const f of testable) {
      runTests(f.id)
    }
  }

  const handleSelectFeature = (feature) => {
    setSelectedFeature(feature)
    setFixSuggestions(null)
    const result = getResultForFeature(feature.id)
    setSelectedResult(result || null)
  }

  const getFixSuggestions = async (featureId) => {
    setLoadingFixes(true)
    try {
      const res = await apiCall('/fix-suggestion', {
        method: 'POST',
        body: JSON.stringify({ feature_id: featureId, project_id })
      })
      setFixSuggestions(res.suggestions || [])
    } catch (err) {
      console.error('Fix suggestions error:', err)
    }
    setLoadingFixes(false)
  }

  useEffect(() => {
    if (selectedFeature) {
      const result = getResultForFeature(selectedFeature.id)
      setSelectedResult(result || null)
    }
  }, [testResults, selectedFeature])

  const testedFeatures = testResults.filter(r => r.status !== 'untested')
  const passedCount = testResults.filter(r => r.status === 'passed').length
  const passRate = testedFeatures.length > 0 ? Math.round((passedCount / testedFeatures.length) * 100) : 0
  const avgQuality = testedFeatures.length > 0
    ? Math.round(testedFeatures.reduce((sum, r) => sum + (r.quality_score || 0), 0) / testedFeatures.length)
    : 0
  const totalBlockers = testResults.reduce((sum, r) => {
    const results = r.results || []
    return sum + results.filter(t => t.status === 'fail').length
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING INSPECTOR...]</div>
      </div>
    )
  }

  const groupedResults = {}
  if (selectedResult?.results) {
    for (const test of selectedResult.results) {
      const cat = test.category || 'other'
      if (!groupedResults[cat]) groupedResults[cat] = []
      groupedResults[cat].push(test)
    }
  }

  const blockerTests = (selectedResult?.results || []).filter(t => t.status === 'fail')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase text-sm">
            [ DASHBOARD ]
          </button>
          <span className="text-xl font-bold tracking-tight uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>INSPECTOR</span>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
            <div className="text-xs text-[#1a6b1a] uppercase">FEATURES TESTED</div>
            <div className="text-2xl font-bold mt-1 text-[#33ff00]" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{testedFeatures.length}</div>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
            <div className="text-xs text-[#1a6b1a] uppercase">PASS RATE</div>
            <div className={`text-2xl font-bold mt-1 ${passRate >= 80 ? 'text-[#33ff00]' : passRate >= 50 ? 'text-[#ffb000]' : 'text-[#ff3333]'}`} style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{passRate}%</div>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
            <div className="text-xs text-[#1a6b1a] uppercase">AVG QUALITY SCORE</div>
            <div className="text-2xl font-bold mt-1 text-[#33ff00]" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{avgQuality}</div>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
            <div className="text-xs text-[#1a6b1a] uppercase">BLOCKERS</div>
            <div className={`text-2xl font-bold mt-1 ${totalBlockers > 0 ? 'text-[#ff3333]' : 'text-[#33ff00]'}`} style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{totalBlockers}</div>
          </div>
        </div>

        {/* Main panels */}
        <div className="flex gap-6">
          {/* Left Panel - Feature List (35%) */}
          <div className="w-[35%] space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>FEATURES</h2>
              <button
                onClick={runAllTests}
                className="px-3 py-1.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] text-xs font-medium transition-colors uppercase"
              >
                [ RUN ALL ]
              </button>
            </div>

            {features.length === 0 ? (
              <div className="text-center text-[#1a6b1a] py-8">
                No features found. Add features in the Refinery first.
              </div>
            ) : (
              features.map(feature => {
                const result = getResultForFeature(feature.id)
                const status = runningTests.has(feature.id) ? 'running' : (result?.status || 'untested')
                const hasBuild = !!builds[feature.id]
                const isSelected = selectedFeature?.id === feature.id

                return (
                  <button
                    key={feature.id}
                    onClick={() => handleSelectFeature(feature)}
                    className={`w-full text-left p-3 border transition-colors ${
                      isSelected ? 'bg-[#0f0f0f] border-[#33ff00]' : 'bg-[#0f0f0f] border-[#1f521f] hover:border-[#33ff00]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate text-[#33ff00]">
                        {isSelected ? '> ' : '  '}{feature.name}
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {hasBuild && status !== 'running' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); runTests(feature.id) }}
                          className="px-2 py-1 border border-[#1f521f] text-[#22aa00] hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] text-xs transition-colors uppercase"
                        >
                          [ RUN ]
                        </button>
                      )}
                      {!hasBuild && (
                        <span className="text-xs text-[#1a6b1a]">[NO BUILD]</span>
                      )}
                      {result?.quality_score != null && (
                        <span className="text-xs text-[#22aa00] ml-auto">Quality: {result.quality_score}%</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Panel - Test Results (65%) */}
          <div className="w-[65%]">
            {!selectedFeature ? (
              <div className="bg-[#0f0f0f] border border-[#1f521f] p-12 text-center">
                <div className="text-[#1a6b1a]">Select a feature to view test results</div>
              </div>
            ) : !selectedResult || selectedResult.status === 'untested' ? (
              <div className="bg-[#0f0f0f] border border-[#1f521f] p-12 text-center">
                <div className="text-[#1a6b1a]">[UNTESTED] No test results yet for {selectedFeature.name}</div>
                {builds[selectedFeature.id] && (
                  <button
                    onClick={() => runTests(selectedFeature.id)}
                    className="mt-4 px-4 py-2 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm font-medium transition-colors uppercase"
                  >
                    [ RUN TESTS ]
                  </button>
                )}
              </div>
            ) : selectedResult.status === 'running' ? (
              <div className="bg-[#0f0f0f] border border-[#1f521f] p-12 text-center">
                <div className="text-[#ffb000] terminal-blink text-lg">[RUNNING TESTS...]</div>
                <div className="text-[#22aa00] mt-2">{selectedFeature.name}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score bars */}
                <div className="bg-[#0f0f0f] border border-[#1f521f] p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#33ff00] mb-2 uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>{selectedFeature.name}</h3>
                  <AsciiBar label="QUALITY SCORE" value={selectedResult.quality_score} />
                  <AsciiBar label="COVERAGE ESTIMATE" value={selectedResult.coverage_estimate} />
                </div>

                {/* Blockers */}
                {blockerTests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#ff3333] uppercase">[FAIL] BLOCKERS ({blockerTests.length})</h3>
                    {blockerTests.map((test, i) => (
                      <div key={i} className="bg-[#ff3333]/5 border border-[#ff3333]/30 p-3">
                        <div className="text-sm font-medium text-[#ff3333]">[FAIL] {test.test_name}</div>
                        <p className="text-xs text-[#ff3333]/70 mt-1 font-mono">{test.details || test.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Test Results grouped by category */}
                {Object.entries(groupedResults).map(([category, tests]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-[#22aa00] mb-2 uppercase">{category} TESTS ({tests.length})</h3>
                    <div className="space-y-2">
                      {tests.map((test, i) => (
                        <TestResultItem key={i} test={test} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Fix Suggestions */}
                <div className="flex gap-2">
                  {(selectedResult.status === 'failed' || selectedResult.status === 'partial') && (
                    <button
                      onClick={() => getFixSuggestions(selectedFeature.id)}
                      disabled={loadingFixes}
                      className="px-4 py-2 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-[#0a0a0a] disabled:opacity-50 text-sm font-medium transition-colors uppercase"
                    >
                      {loadingFixes ? '[ GETTING FIXES... ]' : '[ GET FIX SUGGESTIONS ]'}
                    </button>
                  )}
                </div>

                {/* Fix Suggestions Display */}
                {fixSuggestions && fixSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#ffb000] uppercase">[WARN] SUGGESTED FIXES</h3>
                    {fixSuggestions.map((fix, i) => (
                      <div key={i} className="bg-[#0f0f0f] border border-[#ffb000]/30 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#33ff00]">{fix.test_name}</span>
                          <span className="text-xs text-[#1a6b1a] font-mono">{fix.file_path}</span>
                        </div>
                        <p className="text-xs text-[#22aa00]">{fix.explanation}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-[#ff3333] mb-1 font-bold">- CURRENT</div>
                            <pre className="text-xs bg-[#ff3333]/5 border border-[#ff3333]/20 p-2 overflow-x-auto whitespace-pre-wrap text-[#ff3333] font-mono">{fix.current_code_snippet}</pre>
                          </div>
                          <div>
                            <div className="text-xs text-[#33ff00] mb-1 font-bold">+ SUGGESTED</div>
                            <pre className="text-xs bg-[#33ff00]/5 border border-[#33ff00]/20 p-2 overflow-x-auto whitespace-pre-wrap text-[#33ff00] font-mono">{fix.suggested_fix}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {selectedResult.summary && (
                  <div className="bg-[#0f0f0f] border border-[#1f521f] p-4">
                    <h3 className="text-sm font-semibold text-[#22aa00] mb-2 uppercase">SUMMARY</h3>
                    <p className="text-sm text-[#22aa00]">{selectedResult.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
