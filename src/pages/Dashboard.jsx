import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DeliverableCard from '../components/DeliverableCard'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deliverables, setDeliverables] = useState([])
  const [expanded, setExpanded] = useState({})
  const [triggered, setTriggered] = useState(false)

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
  }, [project])

  useEffect(() => {
    fetchDeliverables()
  }, [fetchDeliverables])

  // Auto-refresh while pending/generating
  useEffect(() => {
    const hasPending = deliverables?.some(d => ['pending', 'generating'].includes(d.status))
    if (!hasPending) return
    const interval = setInterval(fetchDeliverables, 5000)
    return () => clearInterval(interval)
  }, [deliverables, fetchDeliverables])

  // Trigger generation if no deliverables
  useEffect(() => {
    if (project && deliverables.length === 0 && !triggered) {
      setTriggered(true)
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id })
      }).catch(() => {})
    }
  }, [project, deliverables, triggered])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const toggleCard = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!project) return null

  const needs = Array.isArray(project.needs) ? project.needs : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-xl font-bold tracking-tight">dante.</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-10 px-4 pb-16">
        <h1 className="text-2xl font-semibold mb-8">
          Welcome, {project.full_name || 'there'}
        </h1>

        {/* Project card */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4 mb-10">
          {project.company_name && (
            <div className="text-lg font-medium">{project.company_name}</div>
          )}
          {project.idea && (
            <p className="text-gray-400 text-sm leading-relaxed">
              {project.idea.length > 200 ? project.idea.slice(0, 200) + '…' : project.idea}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {project.stage && (
              <span className="rounded-full px-3 py-1 text-sm bg-white/10 text-gray-300">
                {project.stage}
              </span>
            )}
          </div>
          {needs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {needs.map((need) => (
                <span key={need} className="rounded-full px-3 py-1 text-xs bg-white/5 text-gray-400 border border-[#333]">
                  {need}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <h2 className="text-lg font-semibold mb-4">Your Deliverables</h2>
        {deliverables.length === 0 ? (
          <p className="text-gray-400 animate-pulse text-center py-8">
            ✨ Your AI team is being assembled...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliverables.map((d) => (
              <DeliverableCard
                key={d.id}
                deliverable={d}
                isExpanded={!!expanded[d.id]}
                onToggle={() => toggleCard(d.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
