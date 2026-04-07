export type ResponseType = 'TEXT' | 'METRIC' | 'TABLE' | 'ALERT' | 'PATIENT_CARDS' | 'CHART_DATA' | 'ACTION_CONFIRM' | 'GUIDE'

export interface ChatbotResponse {
  type: ResponseType
  message: string
  data?: unknown
  actionType?: string
  params?: Record<string, unknown>
  summary?: string
}

export interface GuideResponse {
  title: string
  section: string
  sectionRoute: string
  context?: string
  steps: string[]
  tip: string
  smartSuggestions?: string[]
  decisionRules?: string[]
  warnings?: string[]
  troubleshooting?: string[]
  relatedActions: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: ChatbotResponse
  timestamp: Date
}
