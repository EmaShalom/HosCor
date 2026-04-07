import client from './client'
import type { Alert } from '../types'

export const fetchAlerts = async (): Promise<Alert[]> => {
  const res = await client.get('/alerts/active')
  return res.data.data ?? []
}
