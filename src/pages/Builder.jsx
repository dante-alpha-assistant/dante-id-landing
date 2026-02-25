import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE_BUILDER = '/api/builder'
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

const STATUS_LABELS = {
  pending: { text: '[PENDING]', cls: 'text-[#1a6b1a]' },
  generating: { text: '[GENERATING...]', cls: 'text-[#ffb000] terminal-blink' },
  review: { text: '[REVIEW]', cls: 'text-[#33ff00]' },
  done: { text: '[DONE]', cls: 'text-[#33ff00]' },
  failed: { text: '[FAILED]', cls: 'text-[#ff3333]' }
}

// Simple syntax highlight
function highlightCode(content, language) {
  if (!content) return ''
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
    .replace(/(#.*$)/gm, '<span class="code-comment">$1</span>')
    .replace(/(&quot;|")((?:[^"\\]|\\.)*)(&quot;|")/g, '<span class="code-string">"$2"</span>')
    .replace(/(&#x27;|')((?:[^'\\]|\\.)*)('|&#x27;)/g, "<span class='code-string'>'$2'</span>")
    .replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="code-string">$1</span>')
    .replace(/\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|extends|new|async|await|try|catch|throw|switch|case|break|continue|typeof|instanceof|in|of|yield|delete|void|null|undefined|true|false|this|super|static|get|set|constructor|interface|type|enum|implements|public|private|protected|readonly|abstract|require|module\.exports)\b/g,
      '<span class="code-keyword">$1</span>')
}

// Build file tree from flat paths
function buildFileTree(files) {
  const root = { name: '', children: {}, files: [] }
  for (const file of (files || [])) {
    const parts = file.path.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node.children[parts[i]]) {
        node.children[parts[i]] = { name: parts[i], children: {}, files: [] }
      }
      node = node.children[parts[i]]
    }
    node.files.push({ ...file, filename: parts[parts.length - 1] })
  }
  return root
}

function FileTreeNode({ node, depth = 0, selectedFile, onSelect, isLast = false }) {
  const [open, setOpen] = useState(true)
  const folders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))
  const files = (node.files || []).sort((a, b) => a.filename.localeCompare(b.filename))
  const indent = depth * 16 + 8

  return (
    <>
      {folders.map((folder, fi) => {
        const isLastFolder = fi === folders.length - 1 && files.length === 0
        return (
          <div key={folder.name}>
            <div
              className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[#0f0f0f] text-xs text-[#22aa00] font-mono"
              style={{ paddingLeft: `${indent}px` }}
              onClick={() => setOpen(prev => {
                const next = { ...prev }
                next[folder.name] = !prev[folder.name]
                return next
              })}
            >
              <span className="text-[#1a6b1a]">{isLastFolder ? '└──' : '├──'}</span>
              <span>{folder.name}/</span>
            </div>
            {open && <FileTreeNode node={folder} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />}
          </div>
        )
      })}
      {files.map((file, fi) => (
        <div
          key={file.path}
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-xs truncate font-mono ${
            selectedFile?.path === file.path ? 'bg-[#33ff00]/10 text-[#33ff00]' : 'text-[#22aa00] hover:bg-[#0f0f0f]'
          }`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => onSelect(file)}
        >
          <span className="text-[#1a6b1a]">{fi === files.length - 1 ? '└──' : '├──'}</span>
          <span className="truncate">{file.filename}</span>
        </div>
      ))}
    </>
  )
}

export default function Builder() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [features, setFeatures] = useState([])
  const [buildsMap, setBuildsMap] = useState({})
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [currentBuild, setCurrentBuild] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [repoLoading, setRepoLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const [featRes, buildsRes] = await Promise.all([
      apiCall(API_BASE_REFINERY, `/${project_id}/features`),
      apiCall(API_BASE_BUILDER, `/${project_id}/builds`)
    ])
    setFeatures(featRes.features || [])
    const bMap = {}
    for (const b of (buildsRes.builds || [])) {
      bMap[b.feature_id] = b
    }
    setBuildsMap(bMap)
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const hasGenerating = Object.values(buildsMap).some(b => b.status === 'generating')
    if (!hasGenerating) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [buildsMap, fetchData])

  const fetchBuild = async (featureId) => {
    const res = await apiCall(API_BASE_BUILDER, `/${project_id}/builds/${featureId}`)
    if (res.build) {
      setCurrentBuild(res.build)
      const files = res.build.files || []
      if (files.length > 0 && !selectedFile) {
        setSelectedFile(files[0])
      }
    } else {
      setCurrentBuild(null)
    }
    return res.build
  }

  const selectFeature = async (f) => {
    setSelectedFeature(f)
    setSelectedFile(null)
    setShowLogs(false)
    await fetchBuild(f.id)
  }

  const generateCode = async (featureId) => {
    setAiLoading(true)
    try {
      const res = await apiCall(API_BASE_BUILDER, '/generate-code', {
        method: 'POST',
        body: JSON.stringify({ feature_id: featureId, project_id })
      })
      if (res.build) {
        setCurrentBuild(res.build)
        setBuildsMap(prev => ({
          ...prev,
          [featureId]: { build_id: res.build.id, feature_id: featureId, status: res.build.status, file_count: (res.build.files || []).length }
        }))
        const files = res.build.files || []
        if (files.length > 0) setSelectedFile(files[0])
      }
    } catch (err) {
      console.error('Generate code failed:', err)
    }
    setAiLoading(false)
  }

  const [batchProgress, setBatchProgress] = useState(null)

  const generateAll = async () => {
    const eligible = features.filter(f => !buildsMap[f.id])
    if (eligible.length === 0) return
    setAiLoading(true)
    let completed = 0
    const CONCURRENCY = 3

    // Process in batches of 3
    for (let i = 0; i < eligible.length; i += CONCURRENCY) {
      const batch = eligible.slice(i, i + CONCURRENCY)
      setBatchProgress({ current: completed + 1, total: eligible.length, featureName: batch.map(f => f.name).join(', ') })

      const results = await Promise.allSettled(
        batch.map(f =>
          apiCall(API_BASE_BUILDER, '/generate-code', {
            method: 'POST',
            body: JSON.stringify({ feature_id: f.id, project_id })
          }).then(res => ({ feature: f, res }))
        )
      )

      for (const r of results) {
        completed++
        if (r.status === 'fulfilled' && r.value.res.build) {
          const { feature, res } = r.value
          setBuildsMap(prev => ({
            ...prev,
            [feature.id]: { build_id: res.build.id, feature_id: feature.id, status: res.build.status, file_count: (res.build.files || []).length }
          }))
        }
      }
      setBatchProgress({ current: completed, total: eligible.length, featureName: 'batch complete' })
    }
    setBatchProgress(null)
    setAiLoading(false)
    await fetchData()
  }

  const createRepo = async () => {
    if (!repoName.trim()) return
    setRepoLoading(true)
    try {
      const res = await apiCall(API_BASE_BUILDER, '/create-repo', {
        method: 'POST',
        body: JSON.stringify({ project_id, repo_name: repoName.trim(), description: '' })
      })
      if (res.repo_url) {
        alert(`Repository created: ${res.repo_url}\n${res.files_committed} files committed.`)
        setShowRepoModal(false)
        await fetchData()
      } else {
        alert(`Error: ${res.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
    setRepoLoading(false)
  }

  const fileTree = useMemo(() => currentBuild ? buildFileTree(currentBuild.files) : null, [currentBuild])
  const hasBuilds = Object.keys(buildsMap).length > 0
  const eligibleCount = features.filter(f => !buildsMap[f.id]).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      <style>{`
        .code-keyword { color: #33ff00; font-weight: bold; }
        .code-string { color: #ffb000; }
        .code-comment { color: #1a6b1a; font-style: italic; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
          <span className="text-[#1a6b1a]">/</span>
          <span className="text-sm text-[#22aa00] uppercase">Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {hasBuilds && (
            <button
              onClick={() => setShowRepoModal(true)}
              className="px-3 py-1.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] text-xs font-medium transition-colors uppercase"
            >
              [ CREATE GITHUB REPO ]
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
          >
            [ DASHBOARD ]
          </button>
        </div>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-8 flex flex-col items-center gap-3">
            <div className="text-[#33ff00] terminal-blink text-lg">[GENERATING...]</div>
            {batchProgress ? (
              <p className="text-sm text-[#22aa00]">Building {batchProgress.current}/{batchProgress.total}: {batchProgress.featureName}</p>
            ) : (
              <p className="text-sm text-[#22aa00]">AI is generating code...</p>
            )}
          </div>
        </div>
      )}

      {/* Repo modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-4 uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>CREATE GITHUB REPOSITORY</h3>
            <input
              className="w-full bg-[#0d0d0d] border border-[#1f521f] px-3 py-2 text-sm text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] mb-4 font-mono"
              style={{ caretColor: '#33ff00' }}
              placeholder="Repository name (e.g. my-app)"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createRepo() }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRepoModal(false)}
                className="px-4 py-2 text-sm text-[#22aa00] hover:text-[#33ff00] border border-[#1f521f] transition-colors uppercase"
              >
                [ CANCEL ]
              </button>
              <button
                onClick={createRepo}
                disabled={repoLoading || !repoName.trim()}
                className="px-4 py-2 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-sm font-medium transition-colors uppercase"
              >
                {repoLoading ? '[ CREATING... ]' : '[ CREATE ]'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - Features (35%) */}
        <div className="w-[35%] border-r border-[#1f521f] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>FEATURES</h3>
            {eligibleCount > 0 && (
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-3 py-1.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-xs font-medium transition-colors uppercase"
              >
                [ BUILD ALL ({eligibleCount}) ]
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-[#1a6b1a] text-center mt-8">
              No features found. Go to Refinery first.
            </p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => {
                const build = buildsMap[f.id]
                const priority = PRIORITY_LABELS[f.priority] || PRIORITY_LABELS.medium
                const status = build ? (STATUS_LABELS[build.status] || STATUS_LABELS.pending) : null
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
                      {status ? (
                        <span className={`text-[10px] font-bold ${status.cls}`}>
                          {status.text} {build.file_count > 0 ? `(${build.file_count} files)` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#1a6b1a] font-bold">
                          [NO BUILD]
                        </span>
                      )}
                    </div>
                    {!build && (
                      <button
                        onClick={(e) => { e.stopPropagation(); generateCode(f.id) }}
                        disabled={aiLoading}
                        className="mt-2 px-3 py-1 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-[10px] font-medium transition-colors uppercase"
                      >
                        [ BUILD ]
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Build (65%) */}
        <div className="w-[65%] overflow-hidden flex flex-col">
          {!selectedFeature ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#1a6b1a] text-sm">Select a feature to view its build</p>
            </div>
          ) : !currentBuild ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-[#22aa00] text-sm">No build for &quot;{selectedFeature.name}&quot;</p>
              <p className="text-[#1a6b1a] text-xs">Make sure a blueprint exists in Foundry first.</p>
              <button
                onClick={() => generateCode(selectedFeature.id)}
                disabled={aiLoading}
                className="px-6 py-3 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-sm font-medium transition-colors uppercase"
              >
                [ GENERATE CODE ]
              </button>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b border-[#1f521f] ${
                currentBuild.status === 'generating' ? 'bg-[#ffb000]/10 text-[#ffb000]' :
                currentBuild.status === 'review' ? 'bg-[#33ff00]/10 text-[#33ff00]' :
                currentBuild.status === 'done' ? 'bg-[#33ff00]/10 text-[#33ff00]' :
                currentBuild.status === 'failed' ? 'bg-[#ff3333]/10 text-[#ff3333]' :
                'bg-[#1a6b1a]/10 text-[#1a6b1a]'
              }`}>
                {currentBuild.status === 'generating' && <span className="terminal-blink">●</span>}
                STATUS: [{currentBuild.status.toUpperCase()}]
                {currentBuild.github_url && (
                  <a href={currentBuild.github_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[#33ff00] hover:underline">
                    View on GitHub →
                  </a>
                )}
              </div>

              {/* File tree + code viewer */}
              <div className="flex flex-1 overflow-hidden">
                {/* File tree sidebar */}
                <div className="w-[200px] border-r border-[#1f521f] overflow-y-auto py-2 shrink-0 bg-[#0a0a0a]">
                  {fileTree && <FileTreeNode node={fileTree} selectedFile={selectedFile} onSelect={setSelectedFile} />}
                </div>

                {/* Code viewer + details */}
                <div className="flex-1 overflow-y-auto">
                  {selectedFile ? (
                    <div>
                      {/* File header */}
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1f521f] bg-[#0a0a0a]">
                        <span className="text-xs text-[#33ff00] font-mono">{selectedFile.path}</span>
                        <span className="text-[10px] px-2 py-0.5 text-[#22aa00] bg-[#33ff00]/10 border border-[#1f521f]">
                          {selectedFile.language || selectedFile.path.split('.').pop()}
                        </span>
                      </div>

                      {/* Code */}
                      <div className="bg-[#0d0d0d] overflow-x-auto">
                        <pre className="p-4 text-xs leading-5 font-mono">
                          {(selectedFile.content || '').split('\n').map((line, i) => (
                            <div key={i} className="flex">
                              <span className="text-[#1a6b1a] select-none w-10 text-right pr-4 shrink-0">{i + 1}</span>
                              <span dangerouslySetInnerHTML={{ __html: highlightCode(line, selectedFile.language) }} />
                            </div>
                          ))}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-[#1a6b1a] text-xs">Select a file to view</p>
                    </div>
                  )}

                  {/* Build Log */}
                  {currentBuild.logs && currentBuild.logs.length > 0 && (
                    <div className="border-t border-[#1f521f] p-4 space-y-3">
                      <div>
                        <h4 className="text-xs text-[#1a6b1a] uppercase mb-1">BUILD LOG</h4>
                        <button
                          onClick={() => setShowLogs(!showLogs)}
                          className="text-[10px] text-[#33ff00] hover:underline uppercase"
                        >
                          [{showLogs ? 'HIDE' : 'SHOW'} LOGS ({currentBuild.logs.length})]
                        </button>
                        {showLogs && (
                          <div className="mt-2 space-y-1 bg-[#0d0d0d] border border-[#1f521f] p-3">
                            {currentBuild.logs.map((log, i) => (
                              <div key={i} className="text-xs text-[#22aa00] font-mono">
                                <span className="text-[#1a6b1a]">$</span>{' '}
                                <span className="text-[#1a6b1a]">{new Date(log.ts).toLocaleTimeString()}</span>{' '}
                                {log.msg}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
