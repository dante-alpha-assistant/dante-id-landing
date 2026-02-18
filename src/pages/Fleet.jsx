import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusDot = (online) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-500'}`} />
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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-xl font-bold tracking-tight">dante.</span>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Agent Fleet</h1>
            <span className="text-sm text-gray-400">Internal operations view</span>
          </div>
          <button
            onClick={() => setShowQuickTask(true)}
            className="text-xs px-4 py-2 rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
          >
            Quick Task
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 animate-pulse">Loading agents...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const stats = statsMap[agent.id] || { backlog: 0, in_progress: 0, done: 0 }
              const online = statusMap[agent.id]
              return (
                <button
                  key={agent.id}
                  onClick={() => navigate(`/fleet/${agent.id}`)}
                  className="text-left bg-white/5 border border-[#333] rounded-2xl p-5 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-2xl">{agent.emoji}</span>
                        {agent.name}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{agent.role}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {statusDot(online)}
                      {online ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-gray-400">
                    <div>Model: <span className="text-gray-200">{agent.model}</span></div>
                    <div>Host: <span className="text-gray-200">{agent.host}</span></div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-black/30 border border-[#333] rounded-lg p-2">
                      <div className="text-gray-400">Backlog</div>
                      <div className="text-lg font-semibold text-white">{stats.backlog}</div>
                    </div>
                    <div className="bg-black/30 border border-[#333] rounded-lg p-2">
                      <div className="text-gray-400">In Progress</div>
                      <div className="text-lg font-semibold text-white">{stats.in_progress}</div>
                    </div>
                    <div className="bg-black/30 border border-[#333] rounded-lg p-2">
                      <div className="text-gray-400">Done</div>
                      <div className="text-lg font-semibold text-white">{stats.done}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showQuickTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-[#333] rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Quick Task</h2>
              <button
                onClick={() => setShowQuickTask(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleQuickTask} className="space-y-3">
              <select
                className="w-full bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                value={quickForm.agentId}
                onChange={(e) => setQuickForm((p) => ({ ...p, agentId: e.target.value }))}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <input
                className="w-full bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                placeholder="Task title"
                value={quickForm.title}
                onChange={(e) => setQuickForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="w-full bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm min-h-[100px]"
                placeholder="Description"
                value={quickForm.description}
                onChange={(e) => setQuickForm((p) => ({ ...p, description: e.target.value }))}
              />
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
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
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500"
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
