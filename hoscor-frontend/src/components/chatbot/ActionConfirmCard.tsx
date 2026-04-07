import { AlertTriangle, Check, X } from 'lucide-react'

interface Props {
  actionType: string
  params: Record<string, unknown>
  summary: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ActionConfirmCard({ summary, onConfirm, onCancel }: Props) {
  return (
    <div className="mt-2 rounded-lg border border-yellow-200 overflow-hidden">
      <div className="bg-yellow-50 px-4 py-3 flex items-start gap-2">
        <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800">{summary}</p>
      </div>
      <div className="flex gap-2 px-4 py-3 bg-white">
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
        >
          <Check size={14} />
          Confirmer
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-lg transition-colors"
        >
          <X size={14} />
          Annuler
        </button>
      </div>
    </div>
  )
}
