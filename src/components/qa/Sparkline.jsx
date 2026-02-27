import { useMemo } from 'react'

function getColor(value, invert) {
  if (invert) return value === 0 ? '#10b981' : value <= 5 ? '#f59e0b' : '#ef4444'
  return value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
}

export default function Sparkline({ data = [], width = 120, height = 40, color, invert = false }) {
  const id = useMemo(() => `sp-${Math.random().toString(36).slice(2, 8)}`, [])

  if (!data.length) return null

  const resolvedColor = color || getColor(data[data.length - 1], invert)

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1 || 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }))

  // Build quadratic bezier path
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    const cpx = (prev.x + cur.x) / 2
    d += ` Q${cpx},${prev.y} ${cur.x},${cur.y}`
  }

  const last = points[points.length - 1]
  const fillD = `${d} L${last.x},${height} L${points[0].x},${height} Z`

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={resolvedColor} strokeWidth="1.5" />
    </svg>
  )
}
