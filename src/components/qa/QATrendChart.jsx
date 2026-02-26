import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function QATrendChart({ data, dataKey, title }) {
  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 font-mono">
      <h3 className="text-[#33ff00] text-sm uppercase tracking-wider mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} stroke="#27272a" />
          <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} stroke="#27272a" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', fontFamily: 'monospace', fontSize: 12 }}
            labelStyle={{ color: '#33ff00' }}
            itemStyle={{ color: '#33ff00' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke="#33ff00" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
