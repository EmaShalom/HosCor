import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types/chatbot'
import ResponseRenderer from './ResponseRenderer'
import { format } from 'date-fns'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
  onRelatedClick: (question: string) => void
  onConfirmAction: (actionType: string, params: Record<string, unknown>) => void
  onCancelAction: () => void
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white rounded-xl shadow-sm max-w-[80px]">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default function ChatbotMessages({
  messages,
  isLoading,
  onRelatedClick,
  onConfirmAction,
  onCancelAction,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 text-xs mt-8">
          <p className="font-medium mb-1">Assistant IA HosCor</p>
          <p>Posez vos questions sur les lits, patients, transferts...</p>
        </div>
      )}

      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[88%] rounded-xl px-3 py-2.5 ${
              msg.role === 'user'
                ? 'bg-brand text-white text-sm'
                : 'bg-white shadow-sm text-gray-800'
            }`}
          >
            {msg.role === 'user' ? (
              <p className="text-sm">{msg.content}</p>
            ) : (
              <div>
                {msg.response ? (
                  <ResponseRenderer
                    response={msg.response}
                    onRelatedClick={onRelatedClick}
                    onConfirmAction={onConfirmAction}
                    onCancelAction={onCancelAction}
                  />
                ) : (
                  <p className="text-sm text-gray-700">{msg.content}</p>
                )}
              </div>
            )}
            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
              {format(msg.timestamp, 'HH:mm')}
            </p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <TypingIndicator />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
