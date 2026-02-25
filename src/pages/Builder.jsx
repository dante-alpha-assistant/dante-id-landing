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

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'nice-to-have': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

const STATUS_BADGES = {
  pending: 'bg-gray-500/20 text-gray-400',
  generating: 'bg-yellow-500/20 text-yellow-400 animate-pulse',
  review: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400'
}

// Simple syntax highlight
function highlightCode(content, language) {
  if (!content) return ''
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    // Comments
    .replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
    .replace(/(#.*$)/gm, '<span class="code-comment">$1</span>')
    // Strings
    .replace(/(&quot;|")((?:[^"\\]|\\.)*)(&quot;|")/g, '<span class="code-string">"$2"</span>')
    .replace(/(&#x27;|')((?:[^'\\]|\\.)*)('|&#x27;)/g, "<span class='code-string'>'$2'</span>")
    .replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="code-string">$1</span>')
    // Keywords
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

function FileTreeNode({ node, depth = 0, selectedFile, onSelect }) {
  const [open, setOpen] = useState(true)
  const folders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))
  const files = (node.files || []).sort((a, b) => a.filename.localeCompare(b.filename))

  return (
    <>
      {folders.map(folder => (
        <div key={folder.name}>
          <div
            className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[#1a1a1a] text-xs text-gray-300"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => setOpen(prev => {
              const next = { ...prev }
              next[folder.name] = !prev[folder.name]
              return next
            })}
          >
            <span>{open ? '📂' : '📁'}</span>
            <span>{folder.name}</span>
          </div>
          {open && <FileTreeNode node={folder} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />}
        </div>
      ))}
      {files.map(file => (
        <div
          key={file.path}
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-xs truncate ${
            selectedFile?.path === file.path ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-[#1a1a1a]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onSelect(file)}
        >
          <span>📄</span>
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
  const [buildsMap, setBuildsMap] = useState({}) // feature_id -> build info
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

  // Poll while generating
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

  const generateAll = async () => {
    const eligible = features.filter(f => !buildsMap[f.id])
    if (eligible.length === 0) return
    setAiLoading(true)
    for (const f of eligible) {
      try {
        const res = await apiCall(API_BASE_BUILDER, '/generate-code', {
          method: 'POST',
          body: JSON.stringify({ feature_id: f.id, project_id })
        })
        if (res.build) {
          setBuildsMap(prev => ({
            ...prev,
            [f.id]: { build_id: res.build.id, feature_id: f.id, status: res.build.status, file_count: (res.build.files || []).length }
          }))
        }
      } catch (err) {
        console.error(`Generate code for ${f.name} failed:`, err)
      }
    }
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
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .code-keyword { color: #c084fc; }
        .code-string { color: #4ade80; }
        .code-comment { color: #6b7280; font-style: italic; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight">dante.</span>
          <span className="text-gray-500">/</span>
          <span className="text-sm text-gray-400">Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {hasBuilds && (
            <button
              onClick={() => setShowRepoModal(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-medium transition-colors"
            >
              🚀 Create GitHub Repo
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">AI is generating code...</p>
          </div>
        </div>
      )}

      {/* Repo modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-4">Create GitHub Repository</h3>
            <input
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-4"
              placeholder="Repository name (e.g. my-app)"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createRepo() }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRepoModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createRepo}
                disabled={repoLoading || !repoName.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-lg text-sm font-medium"
              >
                {repoLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - Features (35%) */}
        <div className="w-[35%] border-r border-[#222] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Features</h3>
            {eligibleCount > 0 && (
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors"
              >
                Build All ({eligibleCount})
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-gray-600 text-center mt-8">
              No features found. Go to Refinery first.
            </p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => {
                const build = buildsMap[f.id]
                return (
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
                      {build ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGES[build.status] || STATUS_BADGES.pending}`}>
                          {build.status} {build.file_count > 0 ? `(${build.file_count} files)` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
                          No build
                        </span>
                      )}
                    </div>
                    {!build && (
                      <button
                        onClick={(e) => { e.stopPropagation(); generateCode(f.id) }}
                        disabled={aiLoading}
                        className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-[10px] font-medium transition-colors"
                      >
                        Build
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
              <p className="text-gray-600 text-sm">Select a feature to view its build</p>
            </div>
          ) : !currentBuild ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-gray-500 text-sm">No build for "{selectedFeature.name}"</p>
              <p className="text-gray-600 text-xs">Make sure a blueprint exists in Foundry first.</p>
              <button
                onClick={() => generateCode(selectedFeature.id)}
                disabled={aiLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
              >
                Generate Code
              </button>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b border-[#222] ${
                currentBuild.status === 'generating' ? 'bg-yellow-500/10 text-yellow-400' :
                currentBuild.status === 'review' ? 'bg-blue-500/10 text-blue-400' :
                currentBuild.status === 'done' ? 'bg-green-500/10 text-green-400' :
                currentBuild.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                'bg-gray-500/10 text-gray-400'
              }`}>
                {currentBuild.status === 'generating' && <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />}
                Status: {currentBuild.status}
                {currentBuild.github_url && (
                  <a href={currentBuild.github_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-indigo-400 hover:text-indigo-300">
                    View on GitHub →
                  </a>
                )}
              </div>

              {/* File tree + code viewer */}
              <div className="flex flex-1 overflow-hidden">
                {/* File tree sidebar */}
                <div className="w-[200px] border-r border-[#222] overflow-y-auto py-2 shrink-0">
                  {fileTree && <FileTreeNode node={fileTree} selectedFile={selectedFile} onSelect={setSelectedFile} />}
                </div>

                {/* Code viewer + details */}
                <div className="flex-1 overflow-y-auto">
                  {selectedFile ? (
                    <div>
                      {/* File header */}
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                        <span className="text-xs text-gray-200 font-mono">{selectedFile.path}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                          {selectedFile.language || selectedFile.path.split('.').pop()}
                        </span>
                      </div>

                      {/* Code */}
                      <div className="bg-[#0d0d0d] overflow-x-auto">
                        <pre className="p-4 text-xs leading-5 font-mono">
                          {(selectedFile.content || '').split('\n').map((line, i) => (
                            <div key={i} className="flex">
                              <span className="text-gray-700 select-none w-10 text-right pr-4 shrink-0">{i + 1}</span>
                              <span dangerouslySetInnerHTML={{ __html: highlightCode(line, selectedFile.language) }} />
                            </div>
                          ))}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-600 text-xs">Select a file to view</p>
                    </div>
                  )}

                  {/* Summary + Setup */}
                  {currentBuild.logs && currentBuild.logs.length > 0 && (
                    <div className="border-t border-[#222] p-4 space-y-3">
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase mb-1">Build Log</h4>
                        <button
                          onClick={() => setShowLogs(!showLogs)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300"
                        >
                          {showLogs ? 'Hide' : 'Show'} logs ({currentBuild.logs.length})
                        </button>
                        {showLogs && (
                          <div className="mt-2 space-y-1">
                            {currentBuild.logs.map((log, i) => (
                              <div key={i} className="text-xs text-gray-400 font-mono">
                                <span className="text-gray-600">{new Date(log.ts).toLocaleTimeString()}</span>{' '}
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
