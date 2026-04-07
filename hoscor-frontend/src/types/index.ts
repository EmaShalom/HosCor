export interface Bed {
  id: number
  unit: string
  bedNumber: string
  state: 'AVAILABLE' | 'READY' | 'OCCUPIED' | 'CLEANING'
  lastUpdated: string
  patientName?: string
  reservedUntil?: string
}

export interface Patient {
  id: number
  mrdNumber: string
  firstName: string
  lastName: string
  age: number
  gender: string
  diagnosis: string
  status: 'ADMITTED' | 'CONGEDIE'
  bedNumber?: string
  unit?: string
  admissionDate: string
  dischargeDate?: string
  dischargeReason?: string
}

export interface Stretcher {
  id: number
  stretcherNumber: string
  status: 'WAITING' | 'ASSIGNED' | 'TRANSFERRED'
  riskLevel: 'ELEVE' | 'MOYEN' | 'FAIBLE'
  patient: Patient
  waitSince: string
  targetUnit?: string
  waitMinutes?: number
  priorityScore?: number
}

export interface Transfer {
  id: number
  patient: Patient
  transferType: 'ENTRANT' | 'SORTANT'
  originHospital?: string
  destinationHospital?: string
  scheduledAt: string
  status: 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET'
  transportType?: string
  notes?: string
}

export interface UnitSummary {
  unit: string
  name: string
  available: number
  occupied: number
  cleaning: number
  total: number
  rate: number
  saturationLevel: 'NORMALE' | 'MODEREE' | 'ELEVEE' | 'CRITIQUE'
}

export interface Alert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  details: string
  unit?: string
}

export interface DashboardOverview {
  totalBeds: number
  availableBeds: number
  occupiedBeds: number
  cleaningBeds: number
  occupancyRate: number
  waitingPatients: number
  highRiskWaiting: number
  activeTransfers: number
  criticalAlerts: number
  perUnit: UnitSummary[]
  forecastDischarges24h?: number
  weeklyAdmissions?: { day: string; admissions: number }[]
  diagnosisMix?: { label: string; count: number; pct: number; color: string }[]
}

export interface AtRiskPatient {
  patientId: number
  mrdNumber: string
  firstName: string
  lastName: string
  age: number
  diagnosis: string | null
  unit: string | null
  riskScore: number
  reasons: string[]
}
