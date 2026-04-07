import clsx from 'clsx'

interface KPICardProps {
  label: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal'
  subtitle?: string
}

const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  teal: 'bg-teal-100 text-teal-600',
}

export default function KPICard({
  label,
  value,
  delta,
  deltaPositive,
  icon,
  color = 'blue',
  subtitle,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className={clsx('rounded-full p-3 flex-shrink-0', COLOR_MAP[color])}>
          {icon}
        </div>
      </div>
      {delta && (
        <p className={clsx('text-xs', deltaPositive ? 'text-green-600' : 'text-red-600')}>
          {delta}
        </p>
      )}
    </div>
  )
}
