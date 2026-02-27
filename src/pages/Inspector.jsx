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
  untested: { label: 'Untested', cls: 'text-md-outline' },
  running: { label: 'Running', cls: 'text-amber-500 animate-pulse' },
  passed: { label: 'Pass', cls: 'text-md-primary' },
  failed: { label: 'Fail', cls: 'text-red-500' },
  partial: { label: 'Warning', cls: 'text-amber-500' }
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.untested
  return (
    <span className={`text-xs font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function ProgressBar({ label, value, max = 100 }) {
  const pct = Math.min(Math.max(value || 0, 0), max)
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-md-on-surface-variant">{label}</span>
        <span className={`font-semibold ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-md-surface-variant rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all ease-md-standard duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TestResultItem({ test }) {
  const [expanded, setExpanded] = useState(false)
  const statusLabel = test.status === 'pass' ? 'Passed' : test.status === 'fail' ? '[FAIL]' : '[WARN]'
  const statusColor = test.status === 'pass' ? 'text-md-primary' : test.status === 'fail' ? 'text-red-500' : 'text-amber-500'

  return (
    <div className="border border-md-outline-variant rounded-md-lg p-3 hover:border-md-primary transition-all ease-md-standard duration-300">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
            <span className="text-sm font-medium text-md-primary">{test.test_name}</span>
          </div>
        </div>
        <p className="text-xs text-md-on-surface-variant mt-1">{test.description}</p>
      </button>
      {expanded && test.details && (
        <div className="mt-2 pt-2 border-t border-md-outline-variant">
          <p className="text-xs text-md-on-surface-variant whitespace-pre-wrap">{test.details}</p>
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
  const [ciRunning, setCiRunning] = useState(false)
  const [ciResult, setCiResult] = useState(null)

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

  const handleRunCI = async () => {
    setCiRunning(true)
    setCiResult(null)
    try {
      const res = await apiCall(`/${project_id}/run-tests`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      setCiResult(res)
    } catch (err) {
      setCiResult({ error: err.message })
    } finally {
      setCiRunning(false)
    }
  }

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
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary animate-pulse">Loading...</div>
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
    <div className="min-h-screen bg-md-background text-md-on-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-md-on-surface-variant hover:bg-md-primary hover:text-md-on-primary border border-md-outline-variant px-3 py-1 transition-all ease-md-standard duration-300 uppercase text-sm">
            Dashboard
          </button>
          <span className="text-xl font-bold tracking-tight uppercase">INSPECTOR</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunCI}
            disabled={ciRunning}
            className="border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00]/10 rounded-none px-4 py-2 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ciRunning ? '[ Running... ]' : '[ Run Tests ]'}
          </button>
          {ciResult && (
            <div className={`p-2 border font-mono text-xs ${ciResult.error ? 'border-red-500 text-red-400' : 'border-[#33ff00] text-[#33ff00]'}`}>
              {ciResult.error ? `✗ ${ciResult.error}` : '✓ CI pipeline triggered — results will appear in QA dashboard'}
            </div>
          )}
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <div className="text-xs text-md-outline uppercase">FEATURES TESTED</div>
            <div className="text-2xl font-bold mt-1 text-md-primary">{testedFeatures.length}</div>
          </div>
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <div className="text-xs text-md-outline uppercase">PASS RATE</div>
            <div className={`text-2xl font-bold mt-1 ${passRate >= 80 ? 'text-md-primary' : passRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{passRate}%</div>
          </div>
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <div className="text-xs text-md-outline uppercase">AVG QUALITY SCORE</div>
            <div className="text-2xl font-bold mt-1 text-md-primary">{avgQuality}</div>
          </div>
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <div className="text-xs text-md-outline uppercase">BLOCKERS</div>
            <div className={`text-2xl font-bold mt-1 ${totalBlockers > 0 ? 'text-red-500' : 'text-md-primary'}`}>{totalBlockers}</div>
          </div>
        </div>

        {/* Main panels */}
        <div className="flex gap-6">
          {/* Left Panel - Feature List (35%) */}
          <div className="w-[35%] space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold uppercase">FEATURES</h2>
              <button
                onClick={runAllTests}
                className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-xs font-medium transition-all ease-md-standard duration-300 uppercase"
              >
                Run All
              </button>
            </div>

            {features.length === 0 ? (
              <div className="text-center text-md-outline py-8">
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
                    className={`w-full text-left p-3 border transition-all ease-md-standard duration-300 ${
                      isSelected ? 'bg-md-surface-container border-md-primary' : 'bg-md-surface-container border-md-outline-variant hover:border-md-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate text-md-primary">
                        {feature.name}
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {hasBuild && status !== 'running' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); runTests(feature.id) }}
                          className="px-2 py-1 border border-md-outline-variant text-md-on-surface-variant hover:border-md-primary hover:bg-md-primary hover:text-md-on-primary text-xs transition-all ease-md-standard duration-300 uppercase"
                        >
                          Run
                        </button>
                      )}
                      {!hasBuild && (
                        <span className="text-xs text-md-outline">No build</span>
                      )}
                      {result?.quality_score != null && (
                        <span className="text-xs text-md-on-surface-variant ml-auto">Quality: {result.quality_score}%</span>
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
              <div className="bg-md-surface-container rounded-md-lg p-12 shadow-sm text-center">
                <div className="text-md-outline">Select a feature to view test results</div>
              </div>
            ) : !selectedResult || selectedResult.status === 'untested' ? (
              <div className="bg-md-surface-container rounded-md-lg p-12 shadow-sm text-center">
                <div className="text-md-outline">No test results yet for {selectedFeature.name}</div>
                {builds[selectedFeature.id] && (
                  <button
                    onClick={() => runTests(selectedFeature.id)}
                    className="mt-4 px-4 py-2 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-sm font-medium transition-all ease-md-standard duration-300 uppercase"
                  >
                    Run Tests
                  </button>
                )}
              </div>
            ) : selectedResult.status === 'running' ? (
              <div className="bg-md-surface-container rounded-md-lg p-12 shadow-sm text-center">
                <div className="text-amber-500 animate-pulse text-lg">Running tests...</div>
                <div className="text-md-on-surface-variant mt-2">{selectedFeature.name}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score bars */}
                <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm space-y-3">
                  <h3 className="text-sm font-semibold text-md-primary mb-2 uppercase">{selectedFeature.name}</h3>
                  <ProgressBar label="QUALITY SCORE" value={selectedResult.quality_score} />
                  <ProgressBar label="COVERAGE ESTIMATE" value={selectedResult.coverage_estimate} />
                </div>

                {/* Blockers */}
                {blockerTests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-red-500 uppercase">[FAIL] BLOCKERS ({blockerTests.length})</h3>
                    {blockerTests.map((test, i) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/30 p-3">
                        <div className="text-sm font-medium text-red-500">[FAIL] {test.test_name}</div>
                        <p className="text-xs text-red-500/70 mt-1">{test.details || test.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Test Results grouped by category */}
                {Object.entries(groupedResults).map(([category, tests]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-md-on-surface-variant mb-2 uppercase">{category} TESTS ({tests.length})</h3>
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
                      className="px-4 py-2 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-md-on-primary disabled:opacity-50 text-sm font-medium transition-all ease-md-standard duration-300 uppercase"
                    >
                      {loadingFixes ? 'Getting Fixes...' : 'Get Fix Suggestions'}
                    </button>
                  )}
                </div>

                {/* Fix Suggestions Display */}
                {fixSuggestions && fixSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-500 uppercase">⚠ SUGGESTED FIXES</h3>
                    {fixSuggestions.map((fix, i) => (
                      <div key={i} className="bg-md-surface-container border border-amber-500/30 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-md-primary">{fix.test_name}</span>
                          <span className="text-xs text-md-outline">{fix.file_path}</span>
                        </div>
                        <p className="text-xs text-md-on-surface-variant">{fix.explanation}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-red-500 mb-1 font-bold">- CURRENT</div>
                            <pre className="text-xs bg-red-500/5 border border-red-500/20 p-2 overflow-x-auto whitespace-pre-wrap text-red-500">{fix.current_code_snippet}</pre>
                          </div>
                          <div>
                            <div className="text-xs text-md-primary mb-1 font-bold">+ SUGGESTED</div>
                            <pre className="text-xs bg-md-primary/5 border border-md-primary/20 p-2 overflow-x-auto whitespace-pre-wrap text-md-primary">{fix.suggested_fix}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {selectedResult.summary && (
                  <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-md-on-surface-variant mb-2 uppercase">SUMMARY</h3>
                    <p className="text-sm text-md-on-surface-variant">{selectedResult.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA to next stage */}
        {testResults.length > 0 && testResults.length >= features.length && (
          <button
            onClick={() => navigate(`/deployer/${project_id}`)}
            className="w-full mt-6 py-4 border-2 border-md-primary text-md-primary text-lg font-bold hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300"
          >
            Continue to Deployer →
          </button>
        )}
      </div>
    </div>
  )
}
