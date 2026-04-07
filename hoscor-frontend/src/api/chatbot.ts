import client from './client'
import type { ChatbotResponse } from '../types/chatbot'

export const sendMessage = async (message: string): Promise<ChatbotResponse> => {
  const res = await client.post('/chatbot/send', { message })
  return res.data.data
}

export const confirmAction = async (
  actionType: string,
  params: Record<string, unknown>
): Promise<ChatbotResponse> => {
  const res = await client.post('/chatbot/action/confirm', { actionType, params })
  return res.data.data
}
