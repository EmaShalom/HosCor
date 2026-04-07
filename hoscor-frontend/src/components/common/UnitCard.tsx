import { useNavigate } from 'react-router-dom'
import type { UnitSummary } from '../../types'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

interface Props {
  unit: UnitSummary
}

export default function UnitCard({ unit }: Props) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/gestion-lits?unit=${unit.unit}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-gray-900">{unit.unit}</span>
          <p className="text-sm text-gray-500">{unit.name}</p>
        </div>
        <StatusBadge variant={unit.saturationLevel} />
      </div>

      <ProgressBar value={unit.rate} showPercent height="h-2.5" />

      <div className="flex gap-4 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span>{unit.available} dispo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span>{unit.occupied} occupés</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
          <span>{unit.cleaning} nettoyage</span>
        </div>
      </div>
    </div>
  )
}
