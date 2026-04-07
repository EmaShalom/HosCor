import clsx from 'clsx'

interface Props {
  value: number
  label?: string
  showPercent?: boolean
  height?: string
}

function getColor(value: number): string {
  if (value >= 95) return 'bg-red-500'
  if (value >= 85) return 'bg-orange-400'
  if (value >= 70) return 'bg-yellow-400'
  return 'bg-green-500'
}

function getTextColor(value: number): string {
  if (value >= 95) return 'text-red-700'
  if (value >= 85) return 'text-orange-700'
  if (value >= 70) return 'text-yellow-700'
  return 'text-green-700'
}

export default function ProgressBar({ value, label, showPercent = false, height = 'h-2' }: Props) {
  const clamped = Math.min(100, Math.max(0, value))
  const color = getColor(clamped)
  const textColor = getTextColor(clamped)

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-600">{label}</span>}
          {showPercent && (
            <span className={clsx('text-xs font-semibold', textColor)}>{clamped.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', height)}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
