import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { Alert } from '../../types'

interface Props {
  alerts: Alert[]
}

export default function AlertBanner({ alerts }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || alerts.length === 0) return null

  const first = alerts[0]

  return (
    <div className="bg-red-600 text-white px-6 py-2 flex items-center gap-3 flex-shrink-0">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span className="font-semibold text-sm">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} critique{alerts.length > 1 ? 's' : ''}</span>
      <span className="text-white/80 text-sm flex-1">— {first.title}: {first.details}</span>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/80 hover:text-white transition-colors ml-auto"
      >
        <X size={16} />
      </button>
    </div>
  )
}
