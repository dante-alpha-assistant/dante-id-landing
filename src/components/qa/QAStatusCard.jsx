export default function QAStatusCard({ title, value, status, icon }) {
  const borderColor = status === 'pass' ? 'border-emerald-500' : status === 'warn' ? 'border-amber-500' : status === 'fail' ? 'border-md-error' : 'border-md-outline-variant'
  const statusColor = status === 'pass' ? 'text-emerald-600' : status === 'warn' ? 'text-amber-500' : status === 'fail' ? 'text-md-error' : 'text-md-on-surface-variant'

  return (
    <div className={`bg-md-surface-container border ${borderColor} rounded-md-lg p-4 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-md-on-surface-variant text-xs uppercase tracking-wider">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${statusColor}`}>{value}</div>
      <div className={`text-xs mt-1 ${statusColor}`}>
        {status === 'pass' ? '● Passing' : status === 'warn' ? '● Warning' : status === 'fail' ? '● Failing' : '● Unknown'}
      </div>
    </div>
  )
}
