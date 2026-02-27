import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE_BUILDER = '/api/builder-v2'
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
  critical: { text: 'Critical', cls: 'text-red-500' },
  high: { text: 'High', cls: 'text-amber-500' },
  medium: { text: 'Medium', cls: 'text-md-primary' },
  low: { text: 'Low', cls: 'text-md-on-surface-variant' },
  'nice-to-have': { text: 'Nice', cls: 'text-md-outline' }
}

const STATUS_LABELS = {
  pending: { text: 'Pending', cls: 'text-md-outline' },
  generating: { text: 'Generating...', cls: 'text-amber-500 animate-pulse' },
  review: { text: 'Review', cls: 'text-md-primary' },
  done: { text: 'Done', cls: 'text-green-500' },
  partial: { text: 'Partial', cls: 'text-amber-500' },
  failed: { text: 'Failed', cls: 'text-red-500' }
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
              className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-md-surface-container text-xs text-md-on-surface-variant"
              style={{ paddingLeft: `${indent}px` }}
              onClick={() => setOpen(prev => {
                const next = { ...prev }
                next[folder.name] = !prev[folder.name]
                return next
              })}
            >
              <span className="text-md-outline">{isLastFolder ? '└──' : '├──'}</span>
              <span>{folder.name}/</span>
            </div>
            {open && <FileTreeNode node={folder} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />}
          </div>
        )
      })}
      {files.map((file, fi) => (
        <div
          key={file.path}
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-xs truncate ${
            selectedFile?.path === file.path ? 'bg-md-primary/10 text-md-primary' : 'text-md-on-surface-variant hover:bg-md-surface-container'
          }`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => onSelect(file)}
        >
          <span className="text-md-outline">{fi === files.length - 1 ? '└──' : '├──'}</span>
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
  const [repoUrl, setRepoUrl] = useState(null)
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [repoLoading, setRepoLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const featRes = await apiCall(API_BASE_REFINERY, `/${project_id}/features`)
    setFeatures(featRes.features || [])
    // Fetch latest build per feature from Supabase directly
    const { data: builds } = await supabase.from('builds').select('id, feature_id, status, files, metadata').eq('project_id', project_id).order('created_at', { ascending: false })
    const bMap = {}
    for (const b of (builds || [])) {
      if (!bMap[b.feature_id]) {
        bMap[b.feature_id] = { build_id: b.id, feature_id: b.feature_id, status: b.status, file_count: (b.files || []).length }
      }
    }
    setBuildsMap(bMap)
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const hasGenerating = Object.values(buildsMap).some(b => b.status === 'generating')
    if (!hasGenerating) return
    const interval = setInterval(async () => {
      // Refresh current build if generating
      if (currentBuild?.status === 'generating' && currentBuild?.id) {
        const res = await apiCall(API_BASE_BUILDER, `/${project_id}/builds/${currentBuild.id}`)
        if (res.build) {
          setCurrentBuild(res.build)
          if (res.build.status !== 'generating') {
            // Build finished, refresh all
            fetchData()
            if (res.build.files?.length > 0 && !selectedFile) setSelectedFile(res.build.files[0])
          }
        }
      } else {
        fetchData()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [buildsMap, fetchData, currentBuild, project_id, selectedFile])

  const fetchBuild = async (featureId) => {
    // Look up build ID from buildsMap
    const buildEntry = buildsMap[featureId]
    if (!buildEntry?.build_id) {
      // Try fetching latest build for this feature from Supabase
      const { data } = await supabase.from('builds').select('*').eq('feature_id', featureId).eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single()
      if (data) {
        setCurrentBuild(data)
        if (data.files?.length > 0 && !selectedFile) setSelectedFile(data.files[0])
        return data
      }
      setCurrentBuild(null)
      return null
    }
    const res = await apiCall(API_BASE_BUILDER, `/${project_id}/builds/${buildEntry.build_id}`)
    if (res.build) {
      setCurrentBuild(res.build)
      const files = res.build.files || []
      if (files.length > 0 && !selectedFile) setSelectedFile(files[0])
      // Update buildsMap with latest status
      setBuildsMap(prev => ({ ...prev, [featureId]: { ...prev[featureId], status: res.build.status, file_count: files.length } }))
    } else {
      setCurrentBuild(null)
    }
    return res.build
  }

  const [prLoading, setPrLoading] = useState(false)
  const [prUrl, setPrUrl] = useState(null)

  const createPR = async () => {
    if (!currentBuild?.id) return
    setPrLoading(true)
    try {
      const res = await apiCall(API_BASE_BUILDER, `/${project_id}/builds/${currentBuild.id}/create-pr`, { method: 'POST' })
      if (res.pr_url) {
        setPrUrl(res.pr_url)
      } else {
        alert(`PR creation failed: ${res.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert(`PR creation failed: ${err.message}`)
    }
    setPrLoading(false)
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
      if (res.build_id) {
        // v2 response: { build_id, agents_spawned, agents }
        const buildStub = { id: res.build_id, feature_id: featureId, status: 'generating', files: [], logs: [], agents_spawned: res.agents_spawned }
        setCurrentBuild(buildStub)
        setBuildsMap(prev => ({
          ...prev,
          [featureId]: { build_id: res.build_id, feature_id: featureId, status: 'generating', file_count: 0, agents_spawned: res.agents_spawned }
        }))
      } else if (res.build) {
        // v1 fallback
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
    await fetchData()

    // Auto-create GitHub repo after all builds complete
    if (completed === eligible.length) {
      setBatchProgress({ current: completed, total: eligible.length, featureName: 'Pushing to GitHub...' })
      try {
        const projectName = `project-${project_id.slice(0, 8)}`
        const res = await apiCall(API_BASE_BUILDER, '/create-repo', {
          method: 'POST',
          body: JSON.stringify({ project_id, repo_name: projectName, description: `Generated by dante.id Builder` })
        })
        if (res.repo_url) {
          setRepoUrl(res.repo_url)
        }
      } catch (err) {
        console.error('Auto GitHub push failed:', err)
      }
    }
    setBatchProgress(null)
    setAiLoading(false)
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

  // GitHub connection status
  const [ghStatus, setGhStatus] = useState(null) // { connected, github_username }
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch('/api/auth/github/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
        setGhStatus(await res.json())
      } catch (e) { setGhStatus({ connected: false }) }
    })()
  }, [])

  const connectGitHub = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/auth/github/connect', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) { console.error('GitHub connect failed:', e) }
  }

  const fileTree = useMemo(() => currentBuild ? buildFileTree(currentBuild.files) : null, [currentBuild])
  const hasBuilds = Object.keys(buildsMap).length > 0
  const eligibleCount = features.filter(f => !buildsMap[f.id]).length

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-surface">
      <style>{`
        .code-keyword { color: var(--md-primary, #6750A4); font-weight: bold; }
        .code-string { color: var(--md-tertiary, #7D5260); }
        .code-comment { color: var(--md-outline, #79747E); font-style: italic; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight">dante_</span>
          <span className="text-md-outline">/</span>
          <span className="text-sm text-md-on-surface-variant uppercase">Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {hasBuilds && (ghStatus?.connected ? (
            <button
              onClick={() => setShowRepoModal(true)}
              className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-xs font-medium transition-all ease-md-standard duration-300 uppercase"
            >
              Push to GitHub · {ghStatus.github_username}
            </button>
          ) : (
            <button
              onClick={connectGitHub}
              className="px-3 py-1.5 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-md-on-primary text-xs font-medium transition-all ease-md-standard duration-300 uppercase"
            >
              Connect GitHub
            </button>
          ))}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-md-on-surface-variant hover:bg-md-primary hover:text-md-on-primary border border-md-outline-variant px-3 py-1 transition-all ease-md-standard duration-300 uppercase"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-md-surface-container rounded-md-lg p-8 shadow-sm flex flex-col items-center gap-3">
            <div className="text-md-primary animate-pulse text-lg">Generating...</div>
            {batchProgress ? (
              <p className="text-sm text-md-on-surface-variant">Building {batchProgress.current}/{batchProgress.total}: {batchProgress.featureName}</p>
            ) : (
              <p className="text-sm text-md-on-surface-variant">AI is generating code...</p>
            )}
          </div>
        </div>
      )}

      {/* Repo modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md w-[400px]">
            <h3 className="text-lg font-semibold mb-2 uppercase">CREATE GITHUB REPOSITORY</h3>
            {ghStatus?.github_username && <p className="text-xs text-md-on-surface-variant mb-4">Pushing to <span className="text-md-primary font-bold">github.com/{ghStatus.github_username}</span></p>}
            <input
              className="w-full bg-md-surface-variant border border-md-outline-variant px-3 py-2 text-sm text-md-primary placeholder-md-outline focus:outline-none focus:border-md-primary mb-4"
              
              placeholder="Repository name (e.g. my-app)"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createRepo() }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRepoModal(false)}
                className="px-4 py-2 text-sm text-md-on-surface-variant hover:text-md-primary border border-md-outline-variant transition-all ease-md-standard duration-300 uppercase"
              >
                Cancel
              </button>
              <button
                onClick={createRepo}
                disabled={repoLoading || !repoName.trim()}
                className="px-4 py-2 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 text-sm font-medium transition-all ease-md-standard duration-300 uppercase"
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
        <div className="w-[35%] border-r border-md-outline-variant overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold uppercase">FEATURES</h3>
            {eligibleCount > 0 ? (
              <button
                onClick={generateAll}
                disabled={aiLoading}
                className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 text-xs font-medium transition-all ease-md-standard duration-300 uppercase"
              >
                Build All ({eligibleCount})
              </button>
            ) : features.length > 0 && Object.keys(buildsMap).length >= features.length ? (
              <button
                onClick={() => navigate(`/inspector/${project_id}`)}
                className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-xs font-medium transition-all ease-md-standard duration-300 uppercase"
              >
                → Run Tests
              </button>
            ) : null}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-md-outline text-center mt-8">
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
                    className={`p-3 cursor-pointer border transition-all ease-md-standard duration-300 ${
                      selectedFeature?.id === f.id
                        ? 'bg-md-surface-container border-md-primary'
                        : 'bg-md-surface-container border-md-outline-variant hover:border-md-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-md-primary flex-1 truncate">
                        {f.name}
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
                        <span className="text-[10px] text-md-outline font-bold">
                          No build
                        </span>
                      )}
                    </div>
                    {!build && (
                      <button
                        onClick={(e) => { e.stopPropagation(); generateCode(f.id) }}
                        disabled={aiLoading}
                        className="mt-2 px-3 py-1 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 text-[10px] font-medium transition-all ease-md-standard duration-300 uppercase"
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
              <p className="text-md-outline text-sm">Select a feature to view its build</p>
            </div>
          ) : !currentBuild ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-md-on-surface-variant text-sm">No build for &quot;{selectedFeature.name}&quot;</p>
              <p className="text-md-outline text-xs">Make sure a blueprint exists in Foundry first.</p>
              <button
                onClick={() => generateCode(selectedFeature.id)}
                disabled={aiLoading}
                className="px-6 py-3 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 text-sm font-medium transition-all ease-md-standard duration-300 uppercase"
              >
                Generate Code
              </button>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b border-md-outline-variant ${
                currentBuild.status === 'generating' ? 'bg-amber-500/10 text-amber-500' :
                currentBuild.status === 'done' ? 'bg-green-500/10 text-green-500' :
                currentBuild.status === 'partial' ? 'bg-amber-500/10 text-amber-500' :
                currentBuild.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                'bg-md-outline/10 text-md-outline'
              }`}>
                {currentBuild.status === 'generating' && <span className="animate-pulse">●</span>}
                STATUS: [{currentBuild.status.toUpperCase()}]
                {currentBuild.status === 'generating' && currentBuild.logs?.length > 0 && (
                  <span className="text-md-on-surface-variant ml-2">
                    {currentBuild.logs[currentBuild.logs.length - 1]?.match?.(/Progress: (\d+\/\d+)/)?.[1] || 
                     (typeof currentBuild.logs[currentBuild.logs.length - 1] === 'string' && currentBuild.logs[currentBuild.logs.length - 1].match(/Progress: (\d+\/\d+)/)?.[1]) ||
                     ''}
                  </span>
                )}
                {(currentBuild.files || []).length > 0 && (
                  <span className="text-md-on-surface-variant ml-2">{currentBuild.files.length} files</span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {(currentBuild.status === 'done' || currentBuild.status === 'partial') && (currentBuild.files || []).length > 0 && !prUrl && !currentBuild.metadata?.pr_url && (
                    <button
                      onClick={createPR}
                      disabled={prLoading}
                      className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black text-[10px] font-bold transition-all uppercase"
                    >
                      {prLoading ? 'Creating PR...' : '[ Create PR ]'}
                    </button>
                  )}
                  {(prUrl || currentBuild.metadata?.pr_url) && (
                    <a href={prUrl || currentBuild.metadata?.pr_url} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline text-[10px] font-bold">
                      View PR →
                    </a>
                  )}
                </div>
              </div>

              {/* File tree + code viewer */}
              <div className="flex flex-1 overflow-hidden">
                {/* File tree sidebar */}
                <div className="w-[200px] border-r border-md-outline-variant overflow-y-auto py-2 shrink-0 bg-md-background">
                  {fileTree && <FileTreeNode node={fileTree} selectedFile={selectedFile} onSelect={setSelectedFile} />}
                </div>

                {/* Code viewer + details */}
                <div className="flex-1 overflow-y-auto">
                  {selectedFile ? (
                    <div>
                      {/* File header */}
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-md-outline-variant bg-md-background">
                        <span className="text-xs text-md-primary">{selectedFile.path}</span>
                        <span className="text-[10px] px-2 py-0.5 text-md-on-surface-variant bg-md-primary/10 border border-md-outline-variant">
                          {selectedFile.language || selectedFile.path.split('.').pop()}
                        </span>
                      </div>

                      {/* Code */}
                      <div className="bg-md-surface-variant overflow-x-auto">
                        <pre className="p-4 text-xs leading-5">
                          {(selectedFile.content || '').split('\n').map((line, i) => (
                            <div key={i} className="flex">
                              <span className="text-md-outline select-none w-10 text-right pr-4 shrink-0">{i + 1}</span>
                              <span dangerouslySetInnerHTML={{ __html: highlightCode(line, selectedFile.language) }} />
                            </div>
                          ))}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-md-outline text-xs">Select a file to view</p>
                    </div>
                  )}

                  {/* Build Log */}
                  {currentBuild.logs && currentBuild.logs.length > 0 && (
                    <div className="border-t border-md-outline-variant p-4 space-y-3">
                      <div>
                        <h4 className="text-xs text-md-outline uppercase mb-1">BUILD LOG</h4>
                        <button
                          onClick={() => setShowLogs(!showLogs)}
                          className="text-[10px] text-md-primary hover:underline uppercase"
                        >
                          [{showLogs ? 'HIDE' : 'SHOW'} LOGS ({currentBuild.logs.length})]
                        </button>
                        {showLogs && (
                          <div className="mt-2 space-y-1 bg-md-surface-variant border border-md-outline-variant rounded-md-lg p-3">
                            {currentBuild.logs.map((log, i) => (
                              <div key={i} className="text-xs text-md-on-surface-variant font-mono">
                                <span className="text-md-outline">$</span>{' '}
                                {typeof log === 'string' ? log : `${new Date(log.ts).toLocaleTimeString()} ${log.msg}`}
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

        {/* CTA to next stage */}
        {features.length > 0 && features.every(f => buildsMap[f.id] && buildsMap[f.id].status !== "generating") && Object.keys(buildsMap).length >= features.length && (
          <button
            onClick={() => navigate(`/inspector/${project_id}`)}
            className="w-full mt-6 py-4 border-2 border-md-primary text-md-primary text-lg font-bold hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300"
          >
            Continue to Inspector →
          </button>
        )}
      </div>
    </div>
  )
}
