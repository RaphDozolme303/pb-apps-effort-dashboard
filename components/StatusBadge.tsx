export default function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null

  const normalized = status.toLowerCase()
  let bg = '#f3f4f6'
  let text = '#374151'

  if (normalized === 'new idea')        { bg = '#f0fdf4'; text = '#166534' }
  else if (normalized === 'candidate')  { bg = '#f3e8ff'; text = '#7e22ce' }
  else if (normalized === 'planned')    { bg = '#eff6ff'; text = '#1d4ed8' }
  else if (normalized === 'in progress'){ bg = '#fff7ed'; text = '#c2410c' }
  else if (normalized === 'in qa')      { bg = '#1f2937'; text = '#f9fafb' }
  else if (normalized === 'released')   { bg = '#f0fdf4'; text = '#15803d' }
  else if (normalized === 'upcoming')   { bg = '#eff6ff'; text = '#1d4ed8' }
  else if (normalized === 'completed')  { bg = '#f0fdf4'; text = '#15803d' }
  else if (normalized === "won't do")   { bg = '#f9fafb'; text = '#6b7280' }

  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      {status}
    </span>
  )
}
