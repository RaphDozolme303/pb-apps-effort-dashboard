interface Props {
  value: number
  max: number
  height?: 'sm' | 'xs'
}

export default function EffortBar({ value, max, height = 'sm' }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const h = height === 'xs' ? 'h-1' : 'h-1.5'

  return (
    <div className={`${h} rounded-full bg-gray-200 overflow-hidden w-32`}>
      <div
        className={`${h} rounded-full`}
        style={{ width: `${pct}%`, backgroundColor: 'var(--pb-blue)' }}
      />
    </div>
  )
}
