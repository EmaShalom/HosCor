import client from './client'
import type { AtRiskPatient, DashboardOverview } from '../types'

export const fetchOverview = async (): Promise<DashboardOverview> => {
  const res = await client.get('/dashboard/overview')
  return res.data.data
}

export const fetchDeteriorationRisk = async (): Promise<AtRiskPatient[]> => {
  const res = await client.get('/analytics/deterioration-risk')
  return (res.data.data as AtRiskPatient[]) ?? []
}

export interface ShiftReportRow {
  mrdNumber?: string
  firstName?: string
  lastName?: string
  age?: number
  gender?: string
  diagnosis?: string
  unit?: string
  bedNumber?: string
  admissionDate?: string
  dischargeDate?: string
  dischargeReason?: string
  stretcherNumber?: string
  riskLevel?: string
  waitSince?: string
  targetUnit?: string
  waitMinutes?: number
  transferType?: string
  status?: string
  scheduledAt?: string
  originHospital?: string
  destinationHospital?: string
  transportType?: string
}

export interface ShiftReportData {
  date: string
  shift: string
  shiftLabel: string
  startTime: string
  endTime: string
  admissions: ShiftReportRow[]
  discharges: ShiftReportRow[]
  transfers: ShiftReportRow[]
  waitingPatients: ShiftReportRow[]
  admissionCount: number
  dischargeCount: number
  transferCount: number
  waitingCount: number
}

export const fetchShiftReport = async (date: string, shift: string): Promise<ShiftReportData> => {
  const res = await client.get('/reports/shift', { params: { date, shift } })
  return res.data.data
}
