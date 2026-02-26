import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusDot = (online) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-400'}`} />
)

export default function Fleet() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [statsMap, setStatsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showQuickTask, setShowQuickTask] = useState(false)
  const [quickForm, setQuickForm] = useState({ agentId: '', title: '', description: '', priority: 'P2' })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/fleet/agents')
        const data = await res.json()
        setAgents(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data[0]) {
          setQuickForm((prev) => ({ ...prev, agentId: data[0].id }))
        }
      } catch (e) {
        setAgents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!agents.length) return
    agents.forEach(async (agent) => {
      try {
        const [statusRes, tasksRes] = await Promise.all([
          fetch(`/api/fleet/agents/${agent.id}/status`),
          fetch(`/api/fleet/tasks?agent=${agent.id}`)
        ])
        const statusData = await statusRes.json()
        const tasks = await tasksRes.json()
        const counts = { backlog: 0, in_progress: 0, done: 0 }
        if (Array.isArray(tasks)) {
          tasks.forEach((t) => {
            if (t.status === 'backlog') counts.backlog += 1
            if (t.status === 'in_progress') counts.in_progress += 1
            if (t.status === 'done') counts.done += 1
          })
        }
        setStatusMap((prev) => ({ ...prev, [agent.id]: !!statusData?.online }))
        setStatsMap((prev) => ({ ...prev, [agent.id]: counts }))
      } catch (e) {
        setStatusMap((prev) => ({ ...prev, [agent.id]: false }))
      }
    })
  }, [agents])

  const handleQuickTask = async (e) => {
    e.preventDefault()
    if (!quickForm.title.trim() || !quickForm.agentId) return
    await fetch('/api/fleet/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: quickForm.title,
        description: quickForm.description,
        priority: quickForm.priority,
        agentId: quickForm.agentId
      })
    })
    setQuickForm((prev) => ({ ...prev, title: '', description: '', priority: 'P2' }))
    setShowQuickTask(false)
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-border/20">
        <span className="text-xl font-semibold text-md-on-background tracking-tight">dante.</span>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-md-on-background">Agent Fleet</h1>
            <span className="text-sm text-md-on-surface-variant">Internal operations view</span>
          </div>
          <button
            onClick={() => setShowQuickTask(true)}
            className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform"
          >
            Quick Task
          </button>
        </div>

        {loading ? (
          <div className="text-md-on-surface-variant animate-pulse">Loading agents...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const stats = statsMap[agent.id] || { backlog: 0, in_progress: 0, done: 0 }
              const online = statusMap[agent.id]
              return (
                <button
                  key={agent.id}
                  onClick={() => navigate(`/fleet/${agent.id}`)}
                  className="text-left bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold flex items-center gap-2 text-md-on-background">
                        <span className="text-2xl">{agent.emoji}</span>
                        {agent.name}
                      </div>
                      <p className="text-sm text-md-on-surface-variant mt-1">{agent.role}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-md-on-surface-variant">
                      {statusDot(online)}
                      {online ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-md-on-surface-variant">
                    <div>Model: <span className="text-md-on-background">{agent.model}</span></div>
                    <div>Host: <span className="text-md-on-background">{agent.host}</span></div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-md-background rounded-md-sm p-2">
                      <div className="text-md-on-surface-variant">Backlog</div>
                      <div className="text-lg font-semibold text-md-on-background">{stats.backlog}</div>
                    </div>
                    <div className="bg-md-background rounded-md-sm p-2">
                      <div className="text-md-on-surface-variant">In Progress</div>
                      <div className="text-lg font-semibold text-md-on-background">{stats.in_progress}</div>
                    </div>
                    <div className="bg-md-background rounded-md-sm p-2">
                      <div className="text-md-on-surface-variant">Done</div>
                      <div className="text-lg font-semibold text-md-on-background">{stats.done}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showQuickTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-md-surface-container rounded-md-lg p-6 w-full max-w-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-md-on-background">Quick Task</h2>
              <button
                onClick={() => setShowQuickTask(false)}
                className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleQuickTask} className="space-y-3">
              <select
                className="w-full bg-md-background border border-md-border/30 rounded-md-sm px-3 py-2 text-sm text-md-on-background"
                value={quickForm.agentId}
                onChange={(e) => setQuickForm((p) => ({ ...p, agentId: e.target.value }))}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <input
                className="w-full bg-md-background border border-md-border/30 rounded-md-sm px-3 py-2 text-sm text-md-on-background"
                placeholder="Task title"
                value={quickForm.title}
                onChange={(e) => setQuickForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="w-full bg-md-background border border-md-border/30 rounded-md-sm px-3 py-2 text-sm min-h-[100px] text-md-on-background"
                placeholder="Description"
                value={quickForm.description}
                onChange={(e) => setQuickForm((p) => ({ ...p, description: e.target.value }))}
              />
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 bg-md-background border border-md-border/30 rounded-md-sm px-3 py-2 text-sm text-md-on-background"
                  value={quickForm.priority}
                  onChange={(e) => setQuickForm((p) => ({ ...p, priority: e.target.value }))}
                >
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
