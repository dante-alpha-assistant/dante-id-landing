import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function QATrendChart({ data, dataKey, title }) {
  return (
    <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-4 shadow-sm">
      <h3 className="text-md-on-surface text-sm font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant, #cac4d0)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--md-on-surface-variant, #79747e)', fontSize: 10 }} stroke="var(--md-outline-variant, #cac4d0)" />
          <YAxis tick={{ fill: 'var(--md-on-surface-variant, #79747e)', fontSize: 10 }} stroke="var(--md-outline-variant, #cac4d0)" />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--md-surface-container, #f3edf7)', border: '1px solid var(--md-outline-variant, #cac4d0)', borderRadius: '12px', fontSize: 12 }}
            labelStyle={{ color: 'var(--md-on-surface, #1d1b20)' }}
            itemStyle={{ color: 'var(--md-primary, #6750a4)' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke="var(--md-primary, #6750a4)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
