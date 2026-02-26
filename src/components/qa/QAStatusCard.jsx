export default function QAStatusCard({ title, value, status, icon }) {
  const borderColor = status === 'pass' ? 'border-green-500' : status === 'fail' ? 'border-red-500' : 'border-zinc-800'
  const statusColor = status === 'pass' ? 'text-green-400' : status === 'fail' ? 'text-red-400' : 'text-zinc-500'

  return (
    <div className={`bg-[#0a0a0a] border ${borderColor} rounded-none p-4 font-mono`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-500 text-xs uppercase tracking-wider">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${statusColor}`}>{value}</div>
      <div className={`text-xs mt-1 ${statusColor} uppercase`}>
        {status === 'pass' ? '● PASSING' : status === 'fail' ? '● FAILING' : '● UNKNOWN'}
      </div>
    </div>
  )
}
