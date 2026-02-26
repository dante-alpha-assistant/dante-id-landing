import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DeliverableCard from '../components/DeliverableCard'
import CofounderChat from '../components/CofounderChat'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import DomainManager from '../components/DomainManager'
import PipelineTimeline from '../components/PipelineTimeline'

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
  { key: 'refinery', label: 'REFINERY', route: (id) => `/refinery/${id}` },
  { key: 'foundry', label: 'FOUNDRY', route: (id) => `/foundry/${id}` },
  { key: 'planner', label: 'PLANNER', route: (id) => `/planner/${id}` },
  { key: 'builder', label: 'BUILDER', route: (id) => `/builder/${id}` },
  { key: 'inspector', label: 'INSPECTOR', route: (id) => `/inspector/${id}` },
  { key: 'deployer', label: 'DEPLOYER', route: (id) => `/deployer/${id}` },
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
      // Legacy: redirect to project list or first project
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

  // Fetch pipeline status
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

      // Refinery
      if (hasPrd) {
        newStatus.refinery = { status: 'done', text: `PRD generated, ${featureCount} features` }
      } else {
        newStatus.refinery = { status: 'in-progress', text: 'Generate your PRD' }
      }

      // Foundry
      if (!hasPrd) {
        newStatus.foundry = { status: 'waiting', text: 'Waiting...' }
      } else if (allBlueprintsReady) {
        newStatus.foundry = { status: 'done', text: `${blueprintCount} blueprints ready` }
      } else {
        newStatus.foundry = { status: featureCount > 0 ? 'in-progress' : 'waiting', text: featureCount > 0 ? `${blueprintCount}/${featureCount} blueprints` : 'Waiting...' }
      }

      // Planner
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

      // Builder
      if (!allBlueprintsReady) {
        newStatus.builder = { status: 'waiting', text: 'Waiting...' }
      } else if (allBuildsReady) {
        newStatus.builder = { status: 'done', text: `${buildCount} builds complete` }
      } else {
        newStatus.builder = { status: 'in-progress', text: `${buildCount}/${featureCount} built` }
      }

      // Inspector
      if (!allBuildsReady) {
        newStatus.inspector = { status: 'waiting', text: 'Waiting...' }
      } else if (allResultsReady) {
        newStatus.inspector = { status: failedCount > 0 ? 'in-progress' : 'done', text: `${passedCount} passed, ${failedCount} failed` }
      } else {
        newStatus.inspector = { status: 'in-progress', text: `${resultCount}/${featureCount} tested` }
      }

      // Deployer
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
  }, [fetchPipelineStatus, fetchPipelineSteps])

  // Auto-refresh pipeline steps every 5s when any step is running
  useEffect(() => {
    const hasRunning = pipelineSteps.some(s => s.status === 'running')
    if (!hasRunning) return
    const interval = setInterval(fetchPipelineSteps, 5000)
    return () => clearInterval(interval)
  }, [pipelineSteps, fetchPipelineSteps])

  // Initial fetch + trigger generation only if truly empty
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

  // Auto-refresh while pending/generating
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
      </div>
    )
  }

  if (!project) return null

  // Compute pipeline progress
  const isLive = project?.stage === 'launched' || project?.status === 'live'
  const doneCount = isLive ? PIPELINE_STEPS.length : Object.values(pipelineStatus).filter(s => s.status === 'done').length
  const totalSteps = PIPELINE_STEPS.length
  const progressPct = Math.round((doneCount / totalSteps) * 100)
  const filledBars = Math.round((doneCount / totalSteps) * 20)
  const emptyBars = 20 - filledBars
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)

  // Find next step (none if live)
  const nextStepIdx = isLive ? -1 : PIPELINE_STEPS.findIndex(s => pipelineStatus[s.key]?.status !== 'done')
  const nextStep = nextStepIdx >= 0 ? PIPELINE_STEPS[nextStepIdx] : null

  const statusIcon = (status) => {
    if (status === 'done') return <span className="text-[#33ff00]">✓</span>
    if (status === 'in-progress') return <span className="text-[#ffb000]">→</span>
    return <span className="text-[#1a6b1a]"> </span>
  }

  const statusColor = (status) => {
    if (status === 'done') return 'text-[#33ff00]'
    if (status === 'in-progress') return 'text-[#ffb000]'
    return 'text-[#1a6b1a]'
  }

  const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <span className="text-xl font-bold tracking-tight" style={glowStyle}>
          dante<span className="text-[#ffb000]">.id</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#22aa00] hidden sm:inline">
            {project.name || project.company_name || project.full_name || 'PROJECT'}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
          >
            [ ← PROJECTS ]
          </button>
          <button
            onClick={() => navigate('/fleet')}
            className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
          >
            [ FLEET ]
          </button>
          <button
            onClick={handleSignOut}
            className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-10 px-4 pb-16">

        {/* Pipeline Timeline */}
        <PipelineTimeline steps={pipelineSteps} projectId={project.id} onRefresh={fetchPipelineSteps} project={project} />

        {/* Pipeline Card */}
        <div className="border border-[#1f521f] bg-[#0f0f0f] p-6 mb-8">
          <div className="text-xs text-[#1a6b1a] mb-4">
            +--- SOFTWARE FACTORY: {(project.name || project.company_name || project.full_name || 'PROJECT').toUpperCase()} ---+
          </div>

          <div className="mb-6">
            <div className="text-sm text-[#22aa00] mb-1">
              PIPELINE STATUS: STEP {Math.min(doneCount + 1, totalSteps)} OF {totalSteps}
            </div>
            <div className="text-[#33ff00]">
              [{progressBar}] {progressPct}%
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {PIPELINE_STEPS.map((step, idx) => {
              const st = isLive ? { status: 'done', text: 'Complete' } : (pipelineStatus[step.key] || { status: 'waiting', text: 'Waiting...' })
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <span className="text-[#1a6b1a] text-sm w-4">{idx + 1}.</span>
                  <button
                    onClick={() => navigate(step.route(project.id))}
                    className="text-sm border border-[#1f521f] px-3 py-1 text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors min-w-[120px] text-left"
                  >
                    [ {step.label} ]
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
              className="w-full py-3 border-2 border-[#33ff00] text-[#33ff00] text-lg font-bold hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors"
              style={glowStyle}
            >
              [ CONTINUE → {nextStep.label} ]
            </button>
          )}
          {!nextStep && (
            <div className="text-center py-3 text-[#33ff00] text-lg font-bold" style={glowStyle}>
              [ALL SYSTEMS OPERATIONAL] ✓
            </div>
          )}

          {/* Resume Pipeline button — unstick projects */}
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
                  // Refresh project data
                  const { data } = await supabase.from('projects').select('*').eq('id', project.id).single()
                  if (data) setProject(data)
                  fetchPipelineSteps()
                } catch (e) { console.error('Resume failed:', e) }
                setResuming(false)
              }}
              className="w-full mt-3 py-2 border border-[#ffb000] text-[#ffb000] text-sm hover:bg-[#ffb000] hover:text-[#0a0a0a] transition-colors disabled:opacity-50"
            >
              {resuming ? '[ RESUMING... ]' : '[ ⚡ RESUME PIPELINE → ]'}
            </button>
          )}

          <div className="text-xs text-[#1a6b1a] mt-4">+{'─'.repeat(40)}+</div>
        </div>

        {/* Legacy Deliverables — collapsible */}
        <div className="border border-[#1f521f] bg-[#0f0f0f] mb-8">
          <button
            onClick={() => setLegacyOpen(!legacyOpen)}
            className="w-full px-6 py-3 text-left flex justify-between items-center text-sm text-[#22aa00] hover:text-[#33ff00] transition-colors"
          >
            <span>+--- LEGACY DELIVERABLES ---+</span>
            <span className="text-[#1a6b1a]">{legacyOpen ? '[-]' : '[+]'}</span>
          </button>
          {legacyOpen && (
            <div className="px-6 pb-6">
              {deliverables.length === 0 ? (
                <p className="text-[#22aa00] text-center py-8 terminal-blink">
                  [ASSEMBLING AI TEAM...]
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
          // Show all known deliverable types, driven by deliverables table not needs array
          const ALL_TYPES = Object.keys(NEED_META)
          const incomplete = ALL_TYPES.filter(t => deliverableMap[t]?.status !== 'completed')
          const completed = ALL_TYPES.filter(t => deliverableMap[t]?.status === 'completed')
          return incomplete.length > 0 ? (
            <div className="border border-[#1f521f] p-5 mt-6">
              <h3 className="text-[#33ff00] font-bold mb-1 text-sm">[ WHAT'S NEXT ]</h3>
              <p className="text-[#1a6b1a] text-xs mb-4">Your app is live. Now build your company. ({completed.length}/{ALL_TYPES.length} complete)</p>
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
                      className={`border p-3 transition-colors group text-left disabled:opacity-50 ${isFailed ? 'border-red-500/30 hover:border-red-500' : 'border-[#1f521f] hover:border-[#33ff00]'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-lg mr-2">{meta.icon}</span>
                          <span className="text-sm text-[#33ff00] font-bold">{meta.label}</span>
                        </div>
                        {isGenerating ? (
                          <span className="text-[8px] border border-[#ffb000]/40 text-[#ffb000] px-1.5 py-0.5 animate-pulse">GENERATING...</span>
                        ) : isFailed ? (
                          <span className="text-[8px] border border-red-500/40 text-red-500 px-1.5 py-0.5 group-hover:bg-red-500 group-hover:text-[#0a0a0a] transition-colors">RETRY →</span>
                        ) : (
                          <span className="text-[8px] border border-[#33ff00]/40 text-[#33ff00] px-1.5 py-0.5 group-hover:bg-[#33ff00] group-hover:text-[#0a0a0a] transition-colors">START →</span>
                        )}
                      </div>
                      <p className="text-[#1a6b1a] text-xs mt-1">{meta.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="border border-[#1f521f] p-5 mt-6 text-center">
              <p className="text-[#33ff00] text-sm">All caught up! 🎉</p>
              <p className="text-[#1a6b1a] text-xs mt-1">Every deliverable has been generated.</p>
            </div>
          )
        })()}

        {/* Bottom links */}
        <div className="flex gap-4 text-xs text-[#1a6b1a] mt-4">
          <button onClick={() => navigate(`/analytics/${project.id}`)} className="hover:text-[#33ff00] transition-colors">
            [ ANALYTICS ]
          </button>
          <button onClick={() => navigate(`/domains/${project.id}`)} className="hover:text-[#33ff00] transition-colors">
            [ DOMAINS ]
          </button>
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
