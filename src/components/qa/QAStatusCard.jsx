export default function QAStatusCard({ title, value, status, icon, tooltip }) {
  const borderColor = status === 'pass' ? 'border-emerald-500' : status === 'warn' ? 'border-amber-500' : status === 'fail' ? 'border-red-500' : 'border-[#333]'
  const statusColor = status === 'pass' ? 'text-[#33ff00]' : status === 'warn' ? 'text-amber-500' : status === 'fail' ? 'text-red-400' : 'text-zinc-400'

  return (
    <div className={`bg-[#111] border ${borderColor} rounded-none p-4`} title={tooltip || ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-400 text-xs uppercase tracking-wider font-mono">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold font-mono ${statusColor}`}>{value}</div>
      <div className={`text-xs mt-1 font-mono ${statusColor}`}>
        {status === 'pass' ? '● Healthy' : status === 'warn' ? '● Warning' : status === 'fail' ? '● Critical' : '● Unknown'}
      </div>
    </div>
  )
}
