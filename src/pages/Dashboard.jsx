import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DeliverableCard from '../components/DeliverableCard'
import CofounderChat from '../components/CofounderChat'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import DomainManager from '../components/DomainManager'
import PipelineTimeline from '../components/PipelineTimeline'
import GitHubIntegrationCard from '../components/GitHubIntegrationCard'

async function apiCall(base, path) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return res.json()
}

const PIPELINE_STEPS = [
  { key: 'refinery', label: 'Refinery', route: (id) => `/refinery/${id}` },
  { key: 'foundry', label: 'Foundry', route: (id) => `/foundry/${id}` },
  { key: 'planner', label: 'Planner', route: (id) => `/planner/${id}` },
  { key: 'builder', label: 'Builder', route: (id) => `/builder/${id}` },
  { key: 'inspector', label: 'Inspector', route: (id) => `/inspector/${id}` },
  { key: 'deployer', label: 'Deployer', route: (id) => `/deployer/${id}` },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { project_id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deliverables, setDeliverables] = useState([])
  const [expanded, setExpanded] = useState({})
  const [deliverablesLoaded, setDeliverablesLoaded] = useState(false)
  const [legacyOpen, setLegacyOpen] = useState(false)
  const [pipelineSteps, setPipelineSteps] = useState([])
  const [resuming, setResuming] = useState(false)
  const [usage, setUsage] = useState(null)

  const [pipelineStatus, setPipelineStatus] = useState({
    refinery: { status: 'waiting', text: 'Waiting...' },
    foundry: { status: 'waiting', text: 'Waiting...' },
    planner: { status: 'waiting', text: 'Waiting...' },
    builder: { status: 'waiting', text: 'Waiting...' },
    inspector: { status: 'waiting', text: 'Waiting...' },
    deployer: { status: 'waiting', text: 'Waiting...' },
  })

  useEffect(() => {
    if (!user) return
    if (project_id) {
      supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) navigate('/dashboard')
          else setProject(data)
          setLoading(false)
        })
    } else {
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (!data || data.length === 0) navigate('/onboarding')
          else navigate(`/dashboard/${data[0].id}`, { replace: true })
        })
    }
  }, [user, navigate, project_id])

  const fetchDeliverables = useCallback(async () => {
    if (!project) return
    const { data } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at')
    if (data) setDeliverables(data)
    return data
  }, [project])

  const fetchPipelineStatus = useCallback(async () => {
    if (!project) return
    const id = project.id
    try {
      const [prdRes, featuresRes, blueprintsRes, plannerRes, buildsRes, resultsRes, deploymentsRes] = await Promise.allSettled([
        apiCall('/api/refinery', `/${id}/prd`),
        apiCall('/api/refinery', `/${id}/features`),
        apiCall('/api/foundry', `/${id}/blueprints`),
        apiCall('/api/planner', `/${id}/work-orders`),
        apiCall('/api/builder', `/${id}/builds`),
        apiCall('/api/inspector', `/${id}/results`),
        apiCall('/api/deployer', `/${id}/deployments`),
      ])

      const prd = prdRes.status === 'fulfilled' ? prdRes.value : null
      const features = featuresRes.status === 'fulfilled' ? (featuresRes.value.features || []) : []
      const blueprints = blueprintsRes.status === 'fulfilled' ? (blueprintsRes.value.blueprints || []) : []
      const workOrders = plannerRes.status === 'fulfilled' ? (plannerRes.value.work_orders || []) : []
      const builds = buildsRes.status === 'fulfilled' ? (buildsRes.value.builds || []) : []
      const results = resultsRes.status === 'fulfilled' ? (resultsRes.value.results || []) : []
      const deployments = deploymentsRes.status === 'fulfilled' ? (deploymentsRes.value.deployments || []) : []

      const hasPrd = !!(prd?.prd?.id || prd?.id)
      const featureCount = features.length
      const blueprintCount = blueprints.length
      const buildCount = builds.length
      const resultCount = results.length
      const passedCount = results.filter(r => r.status === 'passed').length
      const failedCount = results.filter(r => r.status === 'failed').length
      const liveDeployment = deployments.some(d => d.status === 'live')

      const allBlueprintsReady = featureCount > 0 && blueprintCount >= featureCount
      const allBuildsReady = featureCount > 0 && buildCount >= featureCount
      const allResultsReady = featureCount > 0 && resultCount >= featureCount

      const newStatus = {}

      if (hasPrd) {
        newStatus.refinery = { status: 'done', text: `PRD generated, ${featureCount} features` }
      } else {
        newStatus.refinery = { status: 'in-progress', text: 'Generate your PRD' }
      }

      if (!hasPrd) {
        newStatus.foundry = { status: 'waiting', text: 'Waiting...' }
      } else if (allBlueprintsReady) {
        newStatus.foundry = { status: 'done', text: `${blueprintCount} blueprints ready` }
      } else {
        newStatus.foundry = { status: featureCount > 0 ? 'in-progress' : 'waiting', text: featureCount > 0 ? `${blueprintCount}/${featureCount} blueprints` : 'Waiting...' }
      }

      const woCount = workOrders.length
      const allWOsReady = featureCount > 0 && woCount > 0
      if (!allBlueprintsReady) {
        newStatus.planner = { status: 'waiting', text: 'Waiting...' }
      } else if (allWOsReady) {
        const doneWOs = workOrders.filter(w => w.status === 'done').length
        newStatus.planner = { status: 'done', text: `${woCount} work orders (${doneWOs} done)` }
      } else {
        newStatus.planner = { status: 'in-progress', text: 'Generate work orders' }
      }

      if (!allBlueprintsReady) {
        newStatus.builder = { status: 'waiting', text: 'Waiting...' }
      } else if (allBuildsReady) {
        newStatus.builder = { status: 'done', text: `${buildCount} builds complete` }
      } else {
        newStatus.builder = { status: 'in-progress', text: `${buildCount}/${featureCount} built` }
      }

      if (!allBuildsReady) {
        newStatus.inspector = { status: 'waiting', text: 'Waiting...' }
      } else if (allResultsReady) {
        newStatus.inspector = { status: failedCount > 0 ? 'in-progress' : 'done', text: `${passedCount} passed, ${failedCount} failed` }
      } else {
        newStatus.inspector = { status: 'in-progress', text: `${resultCount}/${featureCount} tested` }
      }

      if (!allResultsReady) {
        newStatus.deployer = { status: 'waiting', text: 'Waiting...' }
      } else if (liveDeployment) {
        newStatus.deployer = { status: 'done', text: 'Live ✓' }
      } else {
        newStatus.deployer = { status: 'in-progress', text: 'Ready to deploy' }
      }

      setPipelineStatus(newStatus)
    } catch {
      // silently fail
    }
  }, [project])

  const fetchPipelineSteps = useCallback(async () => {
    if (!project) return
    try {
      const data = await apiCall('', `/api/projects/${project.id}/pipeline-steps`)
      if (data?.steps) setPipelineSteps(data.steps)
    } catch {}
  }, [project])

  useEffect(() => {
    fetchPipelineStatus()
    fetchPipelineSteps()
    if (project?.id) {
      apiCall('', `/api/projects/${project.id}/usage`).then(d => { if (d && !d.error) setUsage(d) }).catch(() => {})
    }
  }, [fetchPipelineStatus, fetchPipelineSteps, project?.id])

  useEffect(() => {
    const hasRunning = pipelineSteps.some(s => s.status === 'running')
    if (!hasRunning) return
    const interval = setInterval(fetchPipelineSteps, 5000)
    return () => clearInterval(interval)
  }, [pipelineSteps, fetchPipelineSteps])

  useEffect(() => {
    if (!project || deliverablesLoaded) return
    fetchDeliverables().then((data) => {
      setDeliverablesLoaded(true)
      if (!data || data.length === 0) {
        import('../lib/api.js').then(({ apiPost }) => {
          apiPost('/api/generate', { project_id: project.id }).catch(() => {})
        })
      }
    })
  }, [project, deliverablesLoaded, fetchDeliverables])

  useEffect(() => {
    const hasPending = deliverables?.some(d => ['pending', 'generating'].includes(d.status))
    if (!hasPending && deliverablesLoaded && deliverables.length > 0) return
    if (!deliverablesLoaded) return
    const interval = setInterval(fetchDeliverables, 5000)
    return () => clearInterval(interval)
  }, [deliverables, fetchDeliverables, deliverablesLoaded])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const toggleCard = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary font-sans text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!project) return null

  const isLive = project?.stage === 'launched' || project?.status === 'live'
  const doneCount = isLive ? PIPELINE_STEPS.length : Object.values(pipelineStatus).filter(s => s.status === 'done').length
  const totalSteps = PIPELINE_STEPS.length
  const progressPct = Math.round((doneCount / totalSteps) * 100)

  const nextStepIdx = isLive ? -1 : PIPELINE_STEPS.findIndex(s => pipelineStatus[s.key]?.status !== 'done')
  const nextStep = nextStepIdx >= 0 ? PIPELINE_STEPS[nextStepIdx] : null

  const statusIcon = (status) => {
    if (status === 'done') return <span className="text-emerald-500">✓</span>
    if (status === 'in-progress') return <span className="text-amber-500">→</span>
    return <span className="text-md-on-surface-variant">○</span>
  }

  const statusColor = (status) => {
    if (status === 'done') return 'text-emerald-500'
    if (status === 'in-progress') return 'text-amber-500'
    return 'text-md-on-surface-variant'
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background font-sans">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-border/20 bg-md-surface-container">
        <span className="text-xl font-bold tracking-tight text-md-on-background">
          dante<span className="text-md-primary">.id</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-md-on-surface-variant hidden sm:inline">
            {project.name || project.company_name || project.full_name || 'Project'}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm rounded-full bg-md-surface-variant text-md-on-surface-variant px-4 py-1.5 hover:bg-md-secondary-container transition-colors"
          >
            ← Projects
          </button>
          <button
            onClick={() => navigate('/fleet')}
            className="text-sm rounded-full bg-md-surface-variant text-md-on-surface-variant px-4 py-1.5 hover:bg-md-secondary-container transition-colors"
          >
            Fleet
          </button>
          <button
            onClick={handleSignOut}
            className="text-sm rounded-full bg-md-surface-variant text-md-on-surface-variant px-4 py-1.5 hover:bg-md-secondary-container transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-10 px-4 pb-16">

        {/* Pipeline Timeline */}
        <PipelineTimeline steps={pipelineSteps} projectId={project.id} onRefresh={fetchPipelineSteps} project={project} />

        {/* Pipeline Card */}
        <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-md-on-background mb-1">
            Software Factory
          </h2>
          <p className="text-sm text-md-on-surface-variant mb-4">
            {(project.name || project.company_name || project.full_name || 'Project')}
          </p>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-md-on-surface-variant mb-2">
              <span>Pipeline Progress</span>
              <span>Step {Math.min(doneCount + 1, totalSteps)} of {totalSteps} · {progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-md-surface-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-md-primary rounded-full transition-all duration-500 ease-md-standard"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {PIPELINE_STEPS.map((step, idx) => {
              const st = isLive ? { status: 'done', text: 'Complete' } : (pipelineStatus[step.key] || { status: 'waiting', text: 'Waiting...' })
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <span className="text-md-on-surface-variant text-sm w-6 text-right">{idx + 1}.</span>
                  <button
                    onClick={() => navigate(step.route(project.id))}
                    className="text-sm rounded-full bg-md-surface-variant text-md-on-surface-variant px-4 py-1.5 hover:bg-md-secondary-container hover:text-md-on-secondary-container transition-all duration-300 ease-md-standard min-w-[120px] text-left"
                  >
                    {step.label}
                  </button>
                  <span className="flex items-center gap-2">
                    {statusIcon(st.status)}
                    <span className={`text-sm ${statusColor(st.status)}`}>{st.text}</span>
                  </span>
                </div>
              )
            })}
          </div>

          {/* Primary CTA */}
          {nextStep && (
            <button
              onClick={() => navigate(nextStep.route(project.id))}
              className="w-full py-3 rounded-full bg-md-primary text-md-on-primary text-lg font-medium hover:shadow-md active:scale-95 transition-all duration-300 ease-md-standard"
            >
              Continue → {nextStep.label}
            </button>
          )}
          {!nextStep && (
            <div className="text-center py-3 rounded-full bg-emerald-500/10 text-emerald-600 text-lg font-medium">
              All Systems Operational ✓
            </div>
          )}

          {/* Resume Pipeline button */}
          {project.status && project.status !== 'live' && project.status !== 'completed' && (
            <button
              disabled={resuming}
              onClick={async () => {
                setResuming(true)
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  await fetch(`/api/projects/${project.id}/resume`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                  })
                  const { data } = await supabase.from('projects').select('*').eq('id', project.id).single()
                  if (data) setProject(data)
                  fetchPipelineSteps()
                } catch (e) { console.error('Resume failed:', e) }
                setResuming(false)
              }}
              className="w-full mt-3 py-2.5 rounded-full border-2 border-amber-500 text-amber-600 text-sm font-medium hover:bg-amber-500 hover:text-white active:scale-95 transition-all duration-300 ease-md-standard disabled:opacity-50"
            >
              {resuming ? 'Resuming...' : '⚡ Resume Pipeline'}
            </button>
          )}
        </div>

        {/* GitHub Integration */}
        <GitHubIntegrationCard projectId={project.id} />

        {/* Legacy Deliverables — collapsible */}
        <div className="bg-md-surface-container rounded-md-lg mb-8 shadow-sm overflow-hidden">
          <button
            onClick={() => setLegacyOpen(!legacyOpen)}
            className="w-full px-6 py-4 text-left flex justify-between items-center text-sm text-md-on-surface-variant hover:bg-md-surface-variant/50 transition-colors"
          >
            <span className="font-medium">Legacy Deliverables</span>
            <span className="text-md-on-surface-variant">{legacyOpen ? '−' : '+'}</span>
          </button>
          {legacyOpen && (
            <div className="px-6 pb-6">
              {deliverables.length === 0 ? (
                <p className="text-md-on-surface-variant text-center py-8 animate-pulse">
                  Assembling AI team...
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliverables.map((d) => (
                    <DeliverableCard
                      key={d.id}
                      deliverable={d}
                      isExpanded={!!expanded[d.id]}
                      onToggle={() => toggleCard(d.id)}
                      onRetry={() => {
                        import('../lib/api.js').then(({ apiPost }) => {
                          apiPost('/api/retry-deliverable', { deliverable_id: d.id, project_id: project.id })
                        })
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* What's Next — post-launch growth */}
        {project?.stage === 'launched' && (() => {
          const NEED_META = {
            brand_identity: { icon: '🎨', label: 'Brand Identity', desc: 'Logo, colors, typography, brand guidelines' },
            landing_page: { icon: '🌐', label: 'Landing Page', desc: 'Marketing site with hero, features, CTA' },
            business_plan: { icon: '📊', label: 'Business Plan', desc: 'Market analysis, revenue model, projections' },
            legal_docs: { icon: '⚖️', label: 'Legal Docs', desc: 'Terms of service, privacy policy, disclaimers' },
            growth_strategy: { icon: '🚀', label: 'Growth Strategy', desc: 'Acquisition channels, retention loops, metrics' },
            pitch_deck: { icon: '📈', label: 'Pitch Deck', desc: 'Investor-ready slides with financials' },
            competitor_analysis: { icon: '🔍', label: 'Competitor Analysis', desc: 'Market landscape, differentiation, SWOT' },
            personal_brand: { icon: '👤', label: 'Personal Brand', desc: 'Founder positioning, social presence' },
          }
          const deliverableMap = {}
          for (const d of (deliverables || [])) { deliverableMap[d.type] = d }
          const ALL_TYPES = Object.keys(NEED_META)
          const incomplete = ALL_TYPES.filter(t => deliverableMap[t]?.status !== 'completed')
          const completed = ALL_TYPES.filter(t => deliverableMap[t]?.status === 'completed')
          return incomplete.length > 0 ? (
            <div className="bg-md-surface-container rounded-md-lg p-6 mt-6 shadow-sm">
              <h3 className="text-md-on-background font-bold mb-1 text-base">What's Next</h3>
              <p className="text-md-on-surface-variant text-sm mb-4">Your app is live. Now build your company. ({completed.length}/{ALL_TYPES.length} complete)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {incomplete.map(need => {
                  const meta = NEED_META[need]
                  const del = deliverableMap[need]
                  const isGenerating = del?.status === 'pending' || del?.status === 'generating'
                  const isFailed = del?.status === 'failed'
                  return (
                    <button
                      key={need}
                      disabled={isGenerating}
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          const r = await fetch(`/api/projects/${project.id}/generate-need`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                            body: JSON.stringify({ need_type: need }),
                          })
                          if (r.ok) {
                            const { data: refreshed } = await supabase.from('deliverables').select('*').eq('project_id', project.id)
                            if (refreshed) setDeliverables(refreshed)
                          }
                        } catch (e) { console.error('Generate need failed:', e) }
                      }}
                      className={`rounded-md-sm p-4 transition-all duration-300 ease-md-standard group text-left disabled:opacity-50 ${isFailed ? 'bg-red-50 hover:bg-red-100 border border-red-200' : 'bg-md-surface-variant hover:bg-md-secondary-container hover:scale-[1.02]'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-lg mr-2">{meta.icon}</span>
                          <span className="text-sm text-md-on-background font-medium">{meta.label}</span>
                        </div>
                        {isGenerating ? (
                          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-0.5 text-xs animate-pulse">Generating...</span>
                        ) : isFailed ? (
                          <span className="rounded-full bg-red-100 text-red-600 px-3 py-0.5 text-xs group-hover:bg-red-500 group-hover:text-white transition-colors">Retry →</span>
                        ) : (
                          <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-3 py-0.5 text-xs group-hover:bg-md-primary group-hover:text-md-on-primary transition-colors">Start →</span>
                        )}
                      </div>
                      <p className="text-md-on-surface-variant text-xs mt-1.5">{meta.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-md-surface-container rounded-md-lg p-6 mt-6 shadow-sm text-center">
              <p className="text-md-on-background text-base font-medium">All caught up! 🎉</p>
              <p className="text-md-on-surface-variant text-sm mt-1">Every deliverable has been generated.</p>
            </div>
          )
        })()}

        {/* Cost Summary */}
        {usage && usage.total_calls > 0 && (
          <div className="bg-md-surface-container rounded-md-lg p-6 mt-6 shadow-sm">
            <h3 className="text-md-on-background font-bold mb-4 text-base">AI Costs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-md-surface-variant rounded-md-sm p-3">
                <div className="text-md-on-surface-variant text-xs">Total Cost</div>
                <div className="text-md-on-background text-xl font-bold">${usage.total_cost_usd?.toFixed(2)}</div>
              </div>
              <div className="bg-md-surface-variant rounded-md-sm p-3">
                <div className="text-md-on-surface-variant text-xs">AI Calls</div>
                <div className="text-md-on-background text-xl font-bold">{usage.total_calls}</div>
              </div>
              <div className="bg-md-surface-variant rounded-md-sm p-3">
                <div className="text-md-on-surface-variant text-xs">Input Tokens</div>
                <div className="text-md-on-background text-xl font-bold">{(usage.total_input_tokens / 1000).toFixed(1)}K</div>
              </div>
              <div className="bg-md-surface-variant rounded-md-sm p-3">
                <div className="text-md-on-surface-variant text-xs">Output Tokens</div>
                <div className="text-md-on-background text-xl font-bold">{(usage.total_output_tokens / 1000).toFixed(1)}K</div>
              </div>
            </div>
            {usage.by_module && Object.keys(usage.by_module).length > 0 && (
              <div className="text-xs space-y-1.5">
                {Object.entries(usage.by_module).sort((a,b) => b[1].cost - a[1].cost).map(([mod, d]) => (
                  <div key={mod} className="flex justify-between text-md-on-surface-variant">
                    <span>{mod}</span>
                    <span>${d.cost?.toFixed(4)} ({d.calls} calls)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom links */}
        <div className="flex gap-3 text-sm mt-6 flex-wrap">
          <button onClick={() => navigate(`/analytics/${project.id}`)} className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-4 py-1.5 hover:shadow-md transition-all duration-300 ease-md-standard">
            Analytics
          </button>
          <button onClick={() => navigate(`/domains/${project.id}`)} className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-4 py-1.5 hover:shadow-md transition-all duration-300 ease-md-standard">
            Domains
          </button>
          <a href={`/qa/${project.id}`} className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-4 py-1.5 hover:shadow-md transition-all duration-300 ease-md-standard inline-block">
            QA Dashboard →
          </a>
        </div>
      </div>

      {/* AI Co-founder Chat */}
      {project && (
        <CofounderChat
          projectId={project.id}
          context={{
            project: { name: project.name || project.company_name, idea: project.idea, stage: project.stage },
            deliverables: deliverables.filter(d => d.status === 'completed').map(d => ({ type: d.type, summary: d.type }))
          }}
        />
      )}
    </div>
  )
}
