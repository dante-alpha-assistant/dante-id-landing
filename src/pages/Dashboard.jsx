import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DeliverableCard from '../components/DeliverableCard'
import CofounderChat from '../components/CofounderChat'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import DomainManager from '../components/DomainManager'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deliverables, setDeliverables] = useState([])
  const [expanded, setExpanded] = useState({})
  const [deliverablesLoaded, setDeliverablesLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('deliverables')

  useEffect(() => {
    if (!user) return
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          navigate('/onboarding')
        } else {
          setProject(data)
        }
        setLoading(false)
      })
  }, [user, navigate])

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

  const needs = Array.isArray(project.needs) ? project.needs : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <span className="text-xl font-bold tracking-tight" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/fleet')}
            className="text-sm text-[#22aa00] hover:text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
          >
            [ FLEET ]
          </button>
          <button
            onClick={handleSignOut}
            className="text-sm text-[#22aa00] hover:text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-10 px-4 pb-16">
        <h1 className="text-2xl font-semibold mb-8 uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>
          {'>'} WELCOME, {(project.full_name || 'OPERATOR').toUpperCase()}
        </h1>

        {/* Project card */}
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-6 space-y-4 mb-10">
          <div className="border-b border-[#1f521f] pb-2 mb-2 text-xs text-[#1a6b1a]">┌── PROJECT_INFO ──┐</div>
          {project.company_name && (
            <div className="text-lg font-medium text-[#33ff00]">{project.company_name}</div>
          )}
          {project.idea && (
            <p className="text-[#22aa00] text-sm leading-relaxed">
              {project.idea.length > 200 ? project.idea.slice(0, 200) + '…' : project.idea}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {project.stage && (
              <span className="px-3 py-1 text-sm bg-[#0a0a0a] text-[#33ff00] border border-[#1f521f]">
                [{project.stage.toUpperCase()}]
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/refinery/${project.id}`)}
              className="px-4 py-2 border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm font-medium transition-colors uppercase"
            >
              [ REFINERY ]
            </button>
            <button
              onClick={() => navigate(`/foundry/${project.id}`)}
              className="px-4 py-2 border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm font-medium transition-colors uppercase"
            >
              [ FOUNDRY ]
            </button>
            <button
              onClick={() => navigate(`/builder/${project.id}`)}
              className="px-4 py-2 border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm font-medium transition-colors uppercase"
            >
              [ BUILDER ]
            </button>
            <button
              onClick={() => navigate(`/inspector/${project.id}`)}
              className="px-4 py-2 border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm font-medium transition-colors uppercase"
            >
              [ INSPECTOR ]
            </button>
          </div>
          {needs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {needs.map((need) => (
                <span key={need} className="px-3 py-1 text-xs bg-[#0a0a0a] text-[#1a6b1a] border border-[#1f521f]">
                  {need}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-[#1a6b1a]">└──────────────────┘</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#1f521f]">
          {[
            { key: 'deliverables', label: 'DELIVERABLES' },
            { key: 'analytics', label: 'ANALYTICS' },
            { key: 'domains', label: 'DOMAINS' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border border-b-0 ${
                activeTab === tab.key
                  ? 'bg-[#33ff00] text-[#0a0a0a] border-[#33ff00]'
                  : 'text-[#22aa00] border-[#1f521f] hover:text-[#33ff00] bg-transparent'
              }`}
            >
              [ {tab.label} ]
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'deliverables' && (
          <>
            <h2 className="text-lg font-semibold mb-4 uppercase text-[#33ff00]">YOUR DELIVERABLES</h2>
            {deliverables.length === 0 ? (
              <p className="text-[#22aa00] text-center py-8 terminal-blink">
                [ASSEMBLING AI TEAM...]
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
            <AnalyticsDashboard projectId={project.id} />
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
            <DomainManager projectId={project.id} />
          </div>
        )}
      </div>

      {/* AI Co-founder Chat */}
      {project && (
        <CofounderChat 
          projectId={project.id} 
          context={{
            project: { name: project.company_name, idea: project.idea, stage: project.stage },
            deliverables: deliverables.filter(d => d.status === 'completed').map(d => ({ type: d.type, summary: d.type }))
          }}
        />
      )}
    </div>
  )
}
