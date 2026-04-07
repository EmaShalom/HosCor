import client from './client'
import type { Transfer } from '../types'

export const fetchTransfers = async (): Promise<Transfer[]> => {
  const res = await client.get('/transfers')
  return res.data.data
}

export const updateTransferStatus = async (id: number, status: string): Promise<Transfer> => {
  const res = await client.patch(`/transfers/${id}/status`, { status })
  return res.data.data
}

export interface CreateTransferPayload {
  patientMrd: string
  transferType: 'ENTRANT' | 'SORTANT'
  originHospital?: string
  destinationHospital?: string
  scheduledAt: string
  transportType?: string
  notes?: string
  status?: string
}

export const createTransfer = async (data: CreateTransferPayload): Promise<Transfer> => {
  const res = await client.post('/transfers', data)
  return res.data.data
}
