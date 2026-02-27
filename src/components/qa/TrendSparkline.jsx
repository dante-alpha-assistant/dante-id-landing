export default function TrendSparkline({ data = [], width = 100, height = 30, color = 'emerald' }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const colors = { emerald: '#10b981', red: '#ef4444', amber: '#f59e0b' }
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={colors[color] || colors.emerald} strokeWidth="1.5" />
    </svg>
  )
}
