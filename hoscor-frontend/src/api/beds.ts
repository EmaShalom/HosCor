import client from './client'
import type { Bed, UnitSummary } from '../types'

export const fetchBedsSummary = async (): Promise<UnitSummary[]> => {
  const res = await client.get('/beds')
  return res.data.data
}

export const fetchUnitBeds = async (unit: string): Promise<Bed[]> => {
  const res = await client.get(`/beds/${unit}`)
  return res.data.data
}

export const updateBedState = async (id: number, state: string): Promise<Bed> => {
  const res = await client.patch(`/beds/${id}/state`, { state })
  return res.data.data
}

export const assignBed = async (bedId: number, patientMrd: string, stretcherId?: number): Promise<Bed> => {
  const res = await client.post(`/beds/${bedId}/assign`, { patientMrd, stretcherId })
  return res.data.data
}
