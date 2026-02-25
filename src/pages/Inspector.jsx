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
  untested: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '⚪', label: 'Untested' },
  running: { bg: 'bg-yellow-500/20', text: 'text-yellow-400 animate-pulse', icon: '🔄', label: 'Running' },
  passed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '✅', label: 'Passed' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '❌', label: 'Failed' },
  partial: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '⚠️', label: 'Partial' }
}

const TEST_STATUS_ICON = { pass: '✅', fail: '❌', warn: '⚠️' }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.untested
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function ScoreBar({ label, value, max = 100 }) {
  const pct = Math.min(Math.max(value || 0, 0), max)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{pct}%</span>
      </div>
      <div className="w-full bg-[#222] rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TestResultItem({ test }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = test.status === 'pass' ? 'text-green-500' : test.status === 'fail' ? 'text-red-500' : 'text-yellow-500'

  return (
    <div className="border border-[#333] rounded-lg p-3 hover:border-[#444] transition-colors">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{TEST_STATUS_ICON[test.status] || '⚪'}</span>
            <span className="text-sm font-medium text-white">{test.test_name}</span>
          </div>
          <span className={`text-xs font-medium ${statusColor}`}>{test.status?.toUpperCase()}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{test.description}</p>
      </button>
      {expanded && test.details && (
        <div className="mt-2 pt-2 border-t border-[#333]">
          <p className="text-xs text-gray-300 whitespace-pre-wrap">{test.details}</p>
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

    // Fetch builds to know which features have them
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

  // Auto-refresh while tests are running
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

  // Update selected result when testResults change
  useEffect(() => {
    if (selectedFeature) {
      const result = getResultForFeature(selectedFeature.id)
      setSelectedResult(result || null)
    }
  }, [testResults, selectedFeature])

  // Summary stats
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

  const passRateColor = passRate > 80 ? 'text-green-400' : passRate >= 50 ? 'text-yellow-400' : 'text-red-400'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading Inspector...</div>
      </div>
    )
  }

  // Group test results by category
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            ← Back
          </button>
          <span className="text-xl font-bold tracking-tight">🔍 Inspector</span>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-sm text-gray-400">Features Tested</div>
            <div className="text-2xl font-bold mt-1">{testedFeatures.length}</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-sm text-gray-400">Pass Rate</div>
            <div className={`text-2xl font-bold mt-1 ${passRateColor}`}>{passRate}%</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-sm text-gray-400">Avg Quality Score</div>
            <div className="text-2xl font-bold mt-1">{avgQuality}</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-sm text-gray-400">Blockers</div>
            <div className={`text-2xl font-bold mt-1 ${totalBlockers > 0 ? 'text-red-400' : 'text-green-400'}`}>{totalBlockers}</div>
          </div>
        </div>

        {/* Main panels */}
        <div className="flex gap-6">
          {/* Left Panel - Feature List (35%) */}
          <div className="w-[35%] space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Features</h2>
              <button
                onClick={runAllTests}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
              >
                Run All
              </button>
            </div>

            {features.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
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
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      isSelected ? 'bg-[#1a1a2e] border-indigo-500/50' : 'bg-[#111] border-[#222] hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{feature.name}</span>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {hasBuild && status !== 'running' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); runTests(feature.id) }}
                          className="px-2 py-1 bg-indigo-600/50 hover:bg-indigo-500 rounded text-xs transition-colors"
                        >
                          Run Tests
                        </button>
                      )}
                      {!hasBuild && (
                        <span className="text-xs text-gray-500">No build available</span>
                      )}
                      {result?.quality_score != null && (
                        <span className="text-xs text-gray-400 ml-auto">Quality: {result.quality_score}%</span>
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
              <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-gray-400">Select a feature to view test results</div>
              </div>
            ) : !selectedResult || selectedResult.status === 'untested' ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
                <div className="text-4xl mb-3">⚪</div>
                <div className="text-gray-400">No test results yet for {selectedFeature.name}</div>
                {builds[selectedFeature.id] && (
                  <button
                    onClick={() => runTests(selectedFeature.id)}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    Run Tests
                  </button>
                )}
              </div>
            ) : selectedResult.status === 'running' ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
                <div className="text-4xl mb-3 animate-spin">🔄</div>
                <div className="text-yellow-400 animate-pulse">Running tests for {selectedFeature.name}...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score bars */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">{selectedFeature.name}</h3>
                  <ScoreBar label="Quality Score" value={selectedResult.quality_score} />
                  <ScoreBar label="Coverage Estimate" value={selectedResult.coverage_estimate} />
                </div>

                {/* Blockers */}
                {blockerTests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-red-400">🚨 Blockers ({blockerTests.length})</h3>
                    {blockerTests.map((test, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <div className="text-sm font-medium text-red-400">{test.test_name}</div>
                        <p className="text-xs text-red-300/70 mt-1">{test.details || test.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Test Results grouped by category */}
                {Object.entries(groupedResults).map(([category, tests]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 capitalize">{category} Tests ({tests.length})</h3>
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
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      {loadingFixes ? 'Getting fixes...' : '🔧 Get Fix Suggestions'}
                    </button>
                  )}
                </div>

                {/* Fix Suggestions Display */}
                {fixSuggestions && fixSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-orange-400">🔧 Suggested Fixes</h3>
                    {fixSuggestions.map((fix, i) => (
                      <div key={i} className="bg-[#111] border border-orange-500/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{fix.test_name}</span>
                          <span className="text-xs text-gray-400">{fix.file_path}</span>
                        </div>
                        <p className="text-xs text-gray-400">{fix.explanation}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-red-400 mb-1">Current</div>
                            <pre className="text-xs bg-red-500/10 border border-red-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap text-red-300">{fix.current_code_snippet}</pre>
                          </div>
                          <div>
                            <div className="text-xs text-green-400 mb-1">Suggested Fix</div>
                            <pre className="text-xs bg-green-500/10 border border-green-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap text-green-300">{fix.suggested_fix}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {selectedResult.summary && (
                  <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Summary</h3>
                    <p className="text-sm text-gray-400">{selectedResult.summary}</p>
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
