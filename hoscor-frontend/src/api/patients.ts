import client from './client'
import type { Patient, Stretcher } from '../types'

export const fetchWaitingStretchers = async (): Promise<Stretcher[]> => {
  const res = await client.get('/patients/waiting')
  return res.data.data
}

export const fetchAdmittedPatients = async (): Promise<Patient[]> => {
  const res = await client.get('/patients/admitted')
  return res.data.data
}

export const fetchPatient = async (mrd: string): Promise<Patient> => {
  const res = await client.get(`/patients/${mrd}`)
  return res.data.data
}

export const createPatient = async (data: Partial<Patient>): Promise<Patient> => {
  const res = await client.post('/patients', data)
  return res.data.data
}

export const updatePatient = async (mrd: string, data: Partial<Patient>): Promise<Patient> => {
  const res = await client.put(`/patients/${mrd}`, data)
  return res.data.data
}

export const dischargePatient = async (mrd: string, reason: string): Promise<Patient> => {
  const res = await client.patch(`/patients/${mrd}/discharge`, { dischargeReason: reason })
  return res.data.data
}

export const addToStretcher = async (
  patientMrd: string,
  riskLevel: 'ELEVE' | 'MOYEN' | 'FAIBLE',
  targetUnit?: string
): Promise<Stretcher> => {
  const res = await client.post('/patients/stretcher', { patientMrd, riskLevel, targetUnit })
  return res.data.data
}
