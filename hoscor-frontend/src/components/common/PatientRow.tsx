import clsx from 'clsx'
import type { Stretcher } from '../../types'
import StatusBadge from './StatusBadge'
import { formatWaitTime } from '../../utils/format'

interface Props {
  stretcher: Stretcher
}

function isOverdue(stretcher: Stretcher, waitMinutes: number): boolean {
  if (stretcher.riskLevel === 'ELEVE' && waitMinutes > 30) return true
  if (stretcher.riskLevel === 'MOYEN' && waitMinutes > 120) return true
  if (stretcher.riskLevel === 'FAIBLE' && waitMinutes > 240) return true
  return false
}

export default function PatientRow({ stretcher }: Props) {
  const { text: waitText, minutes } = formatWaitTime(stretcher.waitSince)
  const overdue = isOverdue(stretcher, minutes)
  const critical = stretcher.riskLevel === 'ELEVE' && overdue

  return (
    <tr className={clsx(critical && 'bg-red-50')}>
      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
        {stretcher.stretcherNumber}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">
          {stretcher.patient.firstName} {stretcher.patient.lastName}
        </div>
        <div className="text-xs text-gray-500">MRD: {stretcher.patient.mrdNumber}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{stretcher.patient.age} ans</td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
        {stretcher.patient.diagnosis}
      </td>
      <td className="px-4 py-3">
        <StatusBadge variant={stretcher.riskLevel} />
      </td>
      <td className="px-4 py-3">
        <span className={clsx('text-sm font-medium', overdue ? 'text-red-600' : 'text-gray-700')}>
          {waitText}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {stretcher.targetUnit ?? <span className="text-gray-400">—</span>}
      </td>
    </tr>
  )
}
