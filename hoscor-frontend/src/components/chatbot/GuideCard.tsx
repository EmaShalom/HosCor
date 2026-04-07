import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, ExternalLink, Info, Lightbulb, Sparkles, Wrench, Zap } from 'lucide-react'
import type { GuideResponse } from '../../types/chatbot'

interface Props {
  guide: GuideResponse
  onRelatedClick: (question: string) => void
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function GuideCard({ guide, onRelatedClick }: Props) {
  const navigate = useNavigate()

  return (
    <div className="mt-2 rounded-lg border border-blue-100 overflow-hidden text-sm">
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-blue-900">{guide.title}</span>
        <button
          onClick={() => navigate(guide.sectionRoute)}
          className="flex items-center gap-1 text-brand text-xs hover:underline"
        >
          <ExternalLink size={12} />
          Aller à {guide.section}
        </button>
      </div>

      {/* Context */}
      {guide.context && (
        <div className="px-4 py-2.5 bg-blue-50/50 border-t border-blue-100 flex items-start gap-2">
          <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 text-xs italic">{guide.context}</p>
        </div>
      )}

      {/* Steps */}
      <div className="px-4 py-3 bg-white">
        <ol className="space-y-1.5 list-decimal list-inside text-gray-700">
          {guide.steps.map((step, i) => (
            <li key={i}>{renderBold(step)}</li>
          ))}
        </ol>
      </div>

      {/* Decision Rules */}
      {guide.decisionRules && guide.decisionRules.length > 0 && (
        <div className="px-4 py-2.5 bg-purple-50 border-t border-purple-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={12} className="text-purple-500" />
            <p className="text-xs font-medium text-purple-700">Règles de décision :</p>
          </div>
          <ul className="space-y-1">
            {guide.decisionRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-purple-800">
                <CheckCircle size={11} className="text-purple-400 flex-shrink-0 mt-0.5" />
                {renderBold(rule)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {guide.warnings && guide.warnings.length > 0 && (
        <div className="px-4 py-2.5 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={12} className="text-red-500" />
            <p className="text-xs font-medium text-red-700">Attention :</p>
          </div>
          <ul className="space-y-1">
            {guide.warnings.map((w, i) => (
              <li key={i} className="text-xs text-red-700">{renderBold(w)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Troubleshooting */}
      {guide.troubleshooting && guide.troubleshooting.length > 0 && (
        <div className="px-4 py-2.5 bg-orange-50 border-t border-orange-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench size={12} className="text-orange-500" />
            <p className="text-xs font-medium text-orange-700">Dépannage :</p>
          </div>
          <ul className="space-y-1">
            {guide.troubleshooting.map((t, i) => (
              <li key={i} className="text-xs text-orange-800">{renderBold(t)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tip */}
      <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
        <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800 text-xs">{guide.tip}</p>
      </div>

      {/* Smart Suggestions */}
      {guide.smartSuggestions && guide.smartSuggestions.length > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-green-500" />
            <p className="text-xs text-green-700 font-medium">Questions suggérées :</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {guide.smartSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onRelatedClick(s)}
                className="text-xs bg-white border border-green-200 text-green-700 px-2.5 py-1 rounded-full hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related actions */}
      {guide.relatedActions.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Actions associées :</p>
          <div className="flex flex-wrap gap-1.5">
            {guide.relatedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onRelatedClick(action)}
                className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full hover:bg-brand hover:text-white hover:border-brand transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
