interface StatCardsProps {
  total: number
  signals: number
  topScore: number
  lastScan: string
}

export default function StatCards({ total, signals, topScore, lastScan }: StatCardsProps) {
  const stats = [
    { label: 'Opportunities',    value: total,              sub: '+12 today',      subColor: 'text-accent-teal' },
    { label: 'Signals processed',value: signals.toLocaleString(), sub: 'from 5 sources', subColor: 'text-text-tertiary' },
    { label: 'Top signal score', value: topScore,           sub: 'this scan',      subColor: 'text-text-tertiary' },
    { label: 'Last scan',        value: lastScan,           sub: 'all sources active', subColor: 'text-accent-teal', small: true },
  ]
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, sub, subColor, small }) => (
        <div key={label} className="card px-4 py-3.5">
          <p className="text-xs text-text-secondary mb-1.5">{label}</p>
          <p className={`font-medium tracking-tight ${small ? 'text-xl mt-1' : 'text-3xl'}`}>{value}</p>
          <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
        </div>
      ))}
    </div>
  )
}
