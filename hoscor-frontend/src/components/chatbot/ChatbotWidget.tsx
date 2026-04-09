import { useState, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import type { ChatMessage } from '../../types/chatbot'
import { sendMessage, confirmAction } from '../../api/chatbot'
import ChatbotMessages from './ChatbotMessages'

let msgCounter = 0
function nextId() {
  return `msg-${++msgCounter}`
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg])

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return

    setInput('')

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setIsLoading(true)

    try {
      const response = await sendMessage(content)
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: response.message,
        response,
        timestamp: new Date(),
      }
      addMessage(assistantMsg)
    } catch {
      addMessage({
        id: nextId(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmAction = async (actionType: string, params: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const response = await confirmAction(actionType, params)
      addMessage({
        id: nextId(),
        role: 'assistant',
        content: response.message,
        response,
        timestamp: new Date(),
      })
    } catch {
      addMessage({
        id: nextId(),
        role: 'assistant',
        content: "Erreur lors de l'exécution de l'action.",
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAction = () => {
    addMessage({
      id: nextId(),
      role: 'assistant',
      content: 'Action annulée.',
      timestamp: new Date(),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-[380px] h-[520px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#1E3A5F] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white font-semibold text-sm">Assistant IA — HosCor</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <ChatbotMessages
            messages={messages}
            isLoading={isLoading}
            onRelatedClick={q => handleSend(q)}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
          />

          {/* Input area */}
          <div className="border-t border-gray-200 px-3 py-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-brand text-white rounded-lg px-3 py-2 hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-brand text-white rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-lg hover:bg-brand-dark transition-colors"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && <span className="text-[9px] font-semibold mt-0.5">IA</span>}
      </button>
    </div>
  )
}
