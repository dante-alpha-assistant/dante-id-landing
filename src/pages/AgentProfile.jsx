import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const statusDot = (online) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-500'}`} />
)

const priorityStyles = {
  P0: 'text-red-400',
  P1: 'text-orange-400',
  P2: 'text-yellow-300',
  P3: 'text-emerald-400'
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

function formatRelative(iso) {
  if (!iso) return '—'
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return iso
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function buildScheduleSummary(schedule) {
  if (!schedule) return '—'
  if (typeof schedule === 'string') return schedule
  if (schedule.kind === 'cron') return schedule.expr || 'cron'
  if (schedule.kind === 'every') return `every ${schedule.everyMs || '—'}ms`
  if (schedule.kind === 'at') return `at ${schedule.at || '—'}`
  return JSON.stringify(schedule)
}

export default function AgentProfile() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [agents, setAgents] = useState([])
  const [online, setOnline] = useState(false)
  const [tasks, setTasks] = useState([])
  const [expanded, setExpanded] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'P2', agentId: '' })
  const [memory, setMemory] = useState(null)
  const [memoryEdits, setMemoryEdits] = useState({ soul: '', memory: '' })
  const [memorySaved, setMemorySaved] = useState('')
  const [dailyNotes, setDailyNotes] = useState([])
  const [cronJobs, setCronJobs] = useState([])
  const [cronLoading, setCronLoading] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [showCron, setShowCron] = useState(false)
  const [metrics, setMetrics] = useState({ tasksCompleted: 0, messagesSent: 0, lastSeen: null, uptime: 0 })
  const [activity, setActivity] = useState([])
  const [activityLimit, setActivityLimit] = useState(10)
  const [cronForm, setCronForm] = useState({
    name: '',
    scheduleKind: 'cron',
    expr: '',
    everyMs: '',
    at: '',
    payloadText: '',
    sessionTarget: 'main'
  })
  const [editingCron, setEditingCron] = useState(null)
  const [cronHistory, setCronHistory] = useState({})

  const stats = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        if (t.status === 'backlog') acc.backlog += 1
        if (t.status === 'in_progress') acc.in_progress += 1
        if (t.status === 'done') acc.done += 1
        return acc
      },
      { backlog: 0, in_progress: 0, done: 0 }
    )
  }, [tasks])

  const weeklyBars = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const key = date.toISOString().slice(0, 10)
      return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }), count: 0 }
    })
    tasks.forEach((task) => {
      if (task.status !== 'done') return
      const ts = task.updatedAt || task.createdAt
      if (!ts) return
      const key = ts.slice(0, 10)
      const bucket = days.find((d) => d.key === key)
      if (bucket) bucket.count += 1
    })
    const max = Math.max(1, ...days.map((d) => d.count))
    return { days, max }
  }, [tasks])

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/fleet/agents')
        const data = await res.json()
        setAgents(Array.isArray(data) ? data : [])
      } catch (e) {
        setAgents([])
      }
    }
    loadAgents()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/fleet/agents/${agentId}`)
        const data = await res.json()
        setAgent(res.ok ? data : null)
      } catch (e) {
        setAgent(null)
      }
    }
    load()
  }, [agentId])

  useEffect(() => {
    if (!agentId) return
    const load = async () => {
      try {
        const [statusRes, tasksRes, memoryRes, metricsRes] = await Promise.all([
          fetch(`/api/fleet/agents/${agentId}/status`),
          fetch(`/api/fleet/tasks?agent=${agentId}`),
          fetch(`/api/fleet/agents/${agentId}/memory`),
          fetch(`/api/fleet/agents/${agentId}/metrics`)
        ])
        const statusData = await statusRes.json()
        const tasksData = await tasksRes.json()
        const memoryData = await memoryRes.json()
        const metricsData = await metricsRes.json()
        setOnline(!!statusData?.online)
        setTasks(Array.isArray(tasksData) ? tasksData : [])
        setMemory(memoryData)
        setMetrics(metricsData || { tasksCompleted: 0, messagesSent: 0, lastSeen: null, uptime: 0 })
        if (memoryData?.available) {
          setMemoryEdits({ soul: memoryData.soul || '', memory: memoryData.memory || '' })
        }
      } catch (e) {
        setOnline(false)
      }
    }
    load()
  }, [agentId])

  useEffect(() => {
    if (!agentId) return
    setFormData((prev) => ({ ...prev, agentId }))
  }, [agentId])

  const refreshTasks = async () => {
    const res = await fetch(`/api/fleet/tasks?agent=${agentId}`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    await fetch('/api/fleet/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        agentId: formData.agentId || agentId
      })
    })
    setFormData((prev) => ({ ...prev, title: '', description: '', priority: 'P2' }))
    setShowForm(false)
    refreshTasks()
  }

  const updateTask = async (id, patch) => {
    await fetch(`/api/fleet/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
    refreshTasks()
  }

  const loadCron = async () => {
    setCronLoading(true)
    try {
      const res = await fetch(`/api/fleet/agents/${agentId}/cron`)
      const data = await res.json()
      setCronJobs(Array.isArray(data?.jobs) ? data.jobs : Array.isArray(data) ? data : [])
    } catch (e) {
      setCronJobs([])
    }
    setCronLoading(false)
  }

  useEffect(() => {
    if (showCron) loadCron()
  }, [showCron])

  const handleToggleCron = async (job) => {
    await fetch(`/api/fleet/agents/${agentId}/cron/${job.id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !job.enabled })
    })
    loadCron()
  }

  const handleRunCron = async (job) => {
    await fetch(`/api/fleet/agents/${agentId}/cron/${job.id}/run`, { method: 'POST' })
    loadCron()
  }

  const handleCreateCron = async (e) => {
    e.preventDefault()
    if (!cronForm.name.trim()) return
    const schedule = { kind: cronForm.scheduleKind }
    if (cronForm.scheduleKind === 'cron') schedule.expr = cronForm.expr
    if (cronForm.scheduleKind === 'every') schedule.everyMs = Number(cronForm.everyMs)
    if (cronForm.scheduleKind === 'at') schedule.at = cronForm.at
    const job = {
      name: cronForm.name,
      schedule,
      payload: { kind: 'text', text: cronForm.payloadText },
      sessionTarget: cronForm.sessionTarget
    }
    await fetch(`/api/fleet/agents/${agentId}/cron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    })
    setCronForm({ name: '', scheduleKind: 'cron', expr: '', everyMs: '', at: '', payloadText: '', sessionTarget: 'main' })
    loadCron()
  }

  const handleUpdateCron = async (jobId, patch) => {
    await fetch(`/api/fleet/agents/${agentId}/cron/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
    setEditingCron(null)
    loadCron()
  }

  const handleDeleteCron = async (jobId) => {
    const confirmDelete = window.confirm('Delete this cron job?')
    if (!confirmDelete) return
    await fetch(`/api/fleet/agents/${agentId}/cron/${jobId}`, { method: 'DELETE' })
    loadCron()
  }

  const loadCronHistory = async (jobId) => {
    const res = await fetch(`/api/fleet/agents/${agentId}/cron/${jobId}/history`)
    const data = await res.json()
    setCronHistory((prev) => ({ ...prev, [jobId]: data?.runs || [] }))
  }

  const handleSaveMemory = async (file, content) => {
    const res = await fetch(`/api/fleet/agents/${agentId}/memory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, content })
    })
    if (res.ok) {
      setMemorySaved(`${file} saved`)
      setTimeout(() => setMemorySaved(''), 2000)
    }
  }

  const loadDailyNotes = async () => {
    try {
      const res = await fetch(`/api/fleet/agents/${agentId}/memory/daily`)
      const data = await res.json()
      setDailyNotes(Array.isArray(data?.files) ? data.files : [])
    } catch (e) {
      setDailyNotes([])
    }
  }

  useEffect(() => {
    if (showMemory) loadDailyNotes()
  }, [showMemory])

  useEffect(() => {
    if (!agentId) return
    let timer
    const loadActivity = async () => {
      try {
        const res = await fetch(`/api/fleet/agents/${agentId}/activity`)
        const data = await res.json()
        setActivity(Array.isArray(data) ? data : [])
      } catch (e) {
        setActivity([])
      }
    }
    loadActivity()
    timer = setInterval(loadActivity, 30000)
    return () => clearInterval(timer)
  }, [agentId])

  const columns = [
    { key: 'backlog', title: 'Backlog' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'done', title: 'Done' }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-xl font-bold tracking-tight">dante.</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fleet')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Fleet
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {agent ? (
          <div className="bg-white/5 border border-[#333] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-3xl">{agent.emoji}</span>
                  {agent.name}
                </div>
                <p className="text-gray-400 mt-1">{agent.role}</p>
                <div className="text-sm text-gray-400 mt-3 space-y-1">
                  <div>Model: <span className="text-gray-200">{agent.model}</span></div>
                  <div>Host: <span className="text-gray-200">{agent.host}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {statusDot(online)}
                <span className={`px-3 py-1 rounded-full border ${online ? 'border-emerald-500/40 text-emerald-300' : 'border-red-500/40 text-red-300'}`}>
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">Tasks Done</div>
                <div className="text-xl font-semibold">{metrics.tasksCompleted}</div>
              </div>
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">Messages (24h)</div>
                <div className="text-xl font-semibold">{metrics.messagesSent}</div>
              </div>
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">Uptime %</div>
                <div className="text-xl font-semibold">{metrics.uptime}%</div>
              </div>
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">Last Seen</div>
                <div className="text-xl font-semibold">{formatRelative(metrics.lastSeen)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">Tasks completed (7d)</div>
              <div className="grid grid-cols-7 gap-2 items-end h-24">
                {weeklyBars.days.map((day) => (
                  <div key={day.key} className="flex flex-col items-center gap-2">
                    <div className="w-full bg-black/40 border border-[#333] rounded-md h-16 flex items-end">
                      <div
                        className="w-full bg-emerald-500/70 rounded-md"
                        style={{ height: `${(day.count / weeklyBars.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">Backlog</div>
                <div className="text-xl font-semibold">{stats.backlog}</div>
              </div>
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">In Progress</div>
                <div className="text-xl font-semibold">{stats.in_progress}</div>
              </div>
              <div className="bg-black/30 border border-[#333] rounded-lg p-3">
                <div className="text-gray-400">Done</div>
                <div className="text-xl font-semibold">{stats.done}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">Loading agent...</div>
        )}

        <div className="bg-white/5 border border-[#333] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Task Board</h2>
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
            >
              {showForm ? 'Close' : 'New Task'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateTask} className="mb-6 grid gap-3 md:grid-cols-4">
              <input
                className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                placeholder="Short description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
              <select
                className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                value={formData.agentId || agentId}
                onChange={(e) => setFormData((p) => ({ ...p, agentId: e.target.value }))}
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                  value={formData.priority}
                  onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}
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
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => (
              <div key={col.key} className="bg-black/30 border border-[#333] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">{col.title}</h3>
                <div className="space-y-3">
                  {tasks.filter((t) => t.status === col.key).map((task) => {
                    const isOpen = !!expanded[task.id]
                    return (
                      <div key={task.id} className="bg-white/5 border border-[#333] rounded-lg p-3">
                        <button
                          onClick={() => setExpanded((p) => ({ ...p, [task.id]: !isOpen }))}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{task.title}</p>
                              <p className={`text-xs ${priorityStyles[task.priority] || 'text-gray-400'}`}>{task.priority}</p>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(task.createdAt)}</span>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="mt-3 text-xs text-gray-300 space-y-2">
                            <p>{task.description || 'No description provided.'}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Status:</span>
                              <select
                                className="bg-black/40 border border-[#333] rounded px-2 py-1 text-xs"
                                value={task.status}
                                onChange={(e) => updateTask(task.id, { status: e.target.value })}
                              >
                                <option value="backlog">Backlog</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {tasks.filter((t) => t.status === col.key).length === 0 && (
                    <div className="text-xs text-gray-500">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-[#333] rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">Activity Feed</h2>
          <div className="space-y-3">
            {activity.slice(0, activityLimit).map((item) => (
              <div key={item.id} className="bg-black/30 border border-[#333] rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{formatRelative(item.timestamp)}</span>
                  <span>#{item.channel}</span>
                </div>
                <div className="text-gray-200 text-sm">
                  {(item.content || '').slice(0, 200)}
                  {(item.content || '').length > 200 ? '…' : ''}
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="bg-black/30 border border-[#333] rounded-lg p-4 text-sm text-gray-400">
                No activity yet.
              </div>
            )}
          </div>
          {activity.length > activityLimit && (
            <button
              onClick={() => setActivityLimit((prev) => prev + 10)}
              className="mt-4 text-xs px-3 py-1.5 rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
            >
              Load more
            </button>
          )}
        </div>

        <div className="bg-white/5 border border-[#333] rounded-2xl p-6">
          <button
            onClick={() => setShowMemory((prev) => !prev)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-lg font-semibold">Memory Viewer</h2>
            <span className="text-sm text-gray-400">{showMemory ? 'Hide' : 'Show'}</span>
          </button>
          {showMemory && (
            <div className="mt-4 text-sm text-gray-300 space-y-6">
              {memory?.available ? (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-200 mb-2">SOUL.md</h3>
                      <button
                        onClick={() => handleSaveMemory('SOUL.md', memoryEdits.soul)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
                      >
                        Save
                      </button>
                    </div>
                    <textarea
                      className="w-full min-h-[160px] bg-black/30 border border-[#333] rounded-lg p-3 text-xs text-gray-300"
                      value={memoryEdits.soul}
                      onChange={(e) => setMemoryEdits((p) => ({ ...p, soul: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-200 mb-2">MEMORY.md</h3>
                      <button
                        onClick={() => handleSaveMemory('MEMORY.md', memoryEdits.memory)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
                      >
                        Save
                      </button>
                    </div>
                    <textarea
                      className="w-full min-h-[160px] bg-black/30 border border-[#333] rounded-lg p-3 text-xs text-gray-300"
                      value={memoryEdits.memory}
                      onChange={(e) => setMemoryEdits((p) => ({ ...p, memory: e.target.value }))}
                    />
                  </div>
                  {memorySaved && (
                    <div className="text-xs text-emerald-400">{memorySaved}</div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">Daily Notes</h3>
                    <div className="space-y-3">
                      {dailyNotes.map((note) => (
                        <div key={note.file} className="bg-black/30 border border-[#333] rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-2">{note.file}</div>
                          <pre className="whitespace-pre-wrap text-xs text-gray-300">{note.content || 'Empty.'}</pre>
                        </div>
                      ))}
                      {dailyNotes.length === 0 && (
                        <div className="text-xs text-gray-500">No daily notes found.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-black/30 border border-[#333] rounded-lg p-4 text-sm text-gray-400">
                  Remote agent — connect via gateway API.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-[#333] rounded-2xl p-6">
          <button
            onClick={() => setShowCron((prev) => !prev)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-lg font-semibold">Cron Jobs</h2>
            <span className="text-sm text-gray-400">{showCron ? 'Hide' : 'Show'}</span>
          </button>
          {showCron && (
            <div className="mt-4 space-y-4">
              <form onSubmit={handleCreateCron} className="grid gap-3 md:grid-cols-6">
                <input
                  className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm md:col-span-2"
                  placeholder="Job name"
                  value={cronForm.name}
                  onChange={(e) => setCronForm((p) => ({ ...p, name: e.target.value }))}
                />
                <select
                  className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                  value={cronForm.scheduleKind}
                  onChange={(e) => setCronForm((p) => ({ ...p, scheduleKind: e.target.value }))}
                >
                  <option value="cron">Cron</option>
                  <option value="every">Every</option>
                  <option value="at">At</option>
                </select>
                <input
                  className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm md:col-span-2"
                  placeholder={cronForm.scheduleKind === 'cron' ? 'Cron expression' : cronForm.scheduleKind === 'every' ? 'Every (ms)' : 'At (ISO)'}
                  value={cronForm.scheduleKind === 'cron' ? cronForm.expr : cronForm.scheduleKind === 'every' ? cronForm.everyMs : cronForm.at}
                  onChange={(e) => {
                    const value = e.target.value
                    setCronForm((p) => ({
                      ...p,
                      expr: p.scheduleKind === 'cron' ? value : p.expr,
                      everyMs: p.scheduleKind === 'every' ? value : p.everyMs,
                      at: p.scheduleKind === 'at' ? value : p.at
                    }))
                  }}
                />
                <input
                  className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm"
                  placeholder="Session target"
                  value={cronForm.sessionTarget}
                  onChange={(e) => setCronForm((p) => ({ ...p, sessionTarget: e.target.value }))}
                />
                <input
                  className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-sm md:col-span-4"
                  placeholder="Payload text"
                  value={cronForm.payloadText}
                  onChange={(e) => setCronForm((p) => ({ ...p, payloadText: e.target.value }))}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 md:col-span-2"
                >
                  Create
                </button>
              </form>

              {cronLoading ? (
                <div className="text-sm text-gray-400">Loading cron jobs...</div>
              ) : (
                <div className="space-y-3">
                  {cronJobs.length === 0 && (
                    <div className="text-sm text-gray-500">No cron jobs found.</div>
                  )}
                  {cronJobs.map((job) => (
                    <div key={job.id || job.name} className="bg-black/30 border border-[#333] rounded-lg p-3 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-100">{job.name || job.id}</div>
                          <div className="text-xs text-gray-400">Schedule: {buildScheduleSummary(job.schedule || job.scheduleText)}</div>
                          <div className="text-xs text-gray-500">Last run: {job.lastRun || job.last_run || '—'}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleToggleCron(job)}
                            className={`px-3 py-1.5 text-xs rounded-full border ${job.enabled ? 'border-emerald-500/40 text-emerald-300' : 'border-red-500/40 text-red-300'}`}
                          >
                            {job.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          <button
                            onClick={() => handleRunCron(job)}
                            className="px-3 py-1.5 text-xs rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
                          >
                            Run Now
                          </button>
                          <button
                            onClick={() => setEditingCron(job)}
                            className="px-3 py-1.5 text-xs rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCron(job.id)}
                            className="px-3 py-1.5 text-xs rounded-full border border-red-500/40 text-red-300"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => loadCronHistory(job.id)}
                            className="px-3 py-1.5 text-xs rounded-full border border-[#333] text-gray-200 hover:bg-white/10"
                          >
                            History
                          </button>
                        </div>
                      </div>

                      {editingCron?.id === job.id && (
                        <div className="grid gap-2 md:grid-cols-5">
                          <input
                            className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-xs md:col-span-2"
                            placeholder="Name"
                            value={editingCron.name || ''}
                            onChange={(e) => setEditingCron((p) => ({ ...p, name: e.target.value }))}
                          />
                          <input
                            className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-xs md:col-span-2"
                            placeholder="Payload text"
                            value={editingCron?.payload?.text || ''}
                            onChange={(e) => setEditingCron((p) => ({ ...p, payload: { ...(p.payload || {}), kind: 'text', text: e.target.value } }))}
                          />
                          <input
                            className="bg-black/40 border border-[#333] rounded-lg px-3 py-2 text-xs"
                            placeholder="Session target"
                            value={editingCron.sessionTarget || ''}
                            onChange={(e) => setEditingCron((p) => ({ ...p, sessionTarget: e.target.value }))}
                          />
                          <button
                            onClick={() => handleUpdateCron(job.id, { name: editingCron.name, payload: editingCron.payload, sessionTarget: editingCron.sessionTarget })}
                            className="px-3 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 md:col-span-1"
                          >
                            Save
                          </button>
                        </div>
                      )}

                      {cronHistory[job.id] && (
                        <div className="bg-black/40 border border-[#333] rounded-lg p-3 text-xs text-gray-300">
                          <div className="text-gray-400 mb-2">Run history</div>
                          <div className="space-y-1">
                            {cronHistory[job.id].map((run, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span>{formatRelative(run?.timestamp || run?.ts)}</span>
                                <span className="text-gray-500">{run?.status || run?.result || '—'}</span>
                              </div>
                            ))}
                            {cronHistory[job.id].length === 0 && (
                              <div className="text-gray-500">No runs.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
