import { useState } from 'react'

export default function AreaChart({ data = [], xKey = 'date', yKey = 'coverage', color = '#a78bfa', width = 800, height = 250 }) {
  const [hover, setHover] = useState(null)

  if (!data.length) return null

  const pad = { top: 20, right: 20, bottom: 40, left: 50 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom

  const xs = (i) => pad.left + (i / (data.length - 1 || 1)) * w
  const ys = (v) => pad.top + h - (v / 100) * h

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(d[yKey])}`).join(' ')
  const area = `${line} L${xs(data.length - 1)},${pad.top + h} L${pad.left},${pad.top + h} Z`

  const gridLines = [0, 25, 50, 75, 100]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {gridLines.map((v) => (
        <g key={v}>
          <line x1={pad.left} y1={ys(v)} x2={pad.left + w} y2={ys(v)} stroke="currentColor" className="text-md-outline-variant" strokeOpacity="0.3" />
          <text x={pad.left - 8} y={ys(v) + 4} textAnchor="end" className="fill-md-on-surface-variant" fontSize="11">{v}%</text>
        </g>
      ))}

      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />

      {data.map((d, i) => {
        const showLabel = i % 5 === 0 || i === data.length - 1
        const label = typeof d[xKey] === 'string' ? d[xKey].slice(5) : d[xKey]
        return (
          <g key={i}>
            {showLabel && (
              <text x={xs(i)} y={height - 8} textAnchor="middle" className="fill-md-on-surface-variant" fontSize="10">{label}</text>
            )}
            <rect
              x={xs(i) - (w / data.length) / 2}
              y={pad.top}
              width={w / data.length}
              height={h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        )
      })}

      {hover !== null && data[hover] && (
        <g>
          <line x1={xs(hover)} y1={pad.top} x2={xs(hover)} y2={pad.top + h} stroke={color} strokeOpacity="0.5" strokeDasharray="4" />
          <circle cx={xs(hover)} cy={ys(data[hover][yKey])} r="4" fill={color} />
          <rect x={xs(hover) - 45} y={ys(data[hover][yKey]) - 28} width="90" height="22" rx="4" className="fill-md-surface-container" stroke={color} strokeOpacity="0.5" />
          <text x={xs(hover)} y={ys(data[hover][yKey]) - 13} textAnchor="middle" className="fill-md-on-background" fontSize="11" fontWeight="600">
            {data[hover][xKey]}: {data[hover][yKey]}%
          </text>
        </g>
      )}
    </svg>
  )
}
