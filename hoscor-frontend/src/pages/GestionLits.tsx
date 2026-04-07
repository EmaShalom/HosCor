import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useBedsSummary } from '../hooks/useBeds'
import { fetchUnitBeds, updateBedState, assignBed } from '../api/beds'
import { fetchPatient } from '../api/patients'
import KPICard from '../components/common/KPICard'
import Spinner from '../components/common/Spinner'
import { Bed, CheckCircle, Clock, AlertTriangle, Users, X, UserPlus } from 'lucide-react'
import { Bed as BedType } from '../types'

const UNITS = [
  { code: '2N', label: '🩺 2e Nord — Cardiologie' },
  { code: '2S', label: '🏥 2e Sud — Soins int.' },
  { code: '3N', label: '🔬 3e Nord — Néphro' },
  { code: '3S', label: '💊 3e Sud — Méd. gén.' },
  { code: 'URG', label: '🚨 Urgence' },
  { code: 'CHIR', label: '✂️ Chirurgie' },
]

const STATE_STYLES: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  OCCUPIED: { bg: 'bg-[#FEE2E2]', dot: '#DC2626', text: 'text-[#DC2626]', label: 'Occupé' },
  AVAILABLE: { bg: 'bg-[#DCFCE7]', dot: '#16A34A', text: 'text-[#16A34A]', label: 'Disponible' },
  READY: { bg: 'bg-[#DBEAFE]', dot: '#2563EB', text: 'text-[#2563EB]', label: 'Prêt' },
  CLEANING: { bg: 'bg-[#FEF9C3]', dot: '#CA8A04', text: 'text-[#CA8A04]', label: 'Nettoyage' },
}

const STATES: Array<BedType['state']> = ['AVAILABLE', 'READY', 'OCCUPIED', 'CLEANING']

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#111827]">{title}</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827] p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AssignPatientModal({ bed, onClose, onAssigned }: {
  bed: BedType
  onClose: () => void
  onAssigned: () => void
}) {
  const qc = useQueryClient()
  const [mrd, setMrd] = useState('')
  const [patientInfo, setPatientInfo] = useState<{ name: string; diagnosis: string } | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [assignError, setAssignError] = useState('')

  async function lookupPatient() {
    if (!mrd.trim()) return
    setLookupError('')
    setPatientInfo(null)
    try {
      const p = await fetchPatient(mrd.trim())
      setPatientInfo({ name: `${p.firstName} ${p.lastName}`, diagnosis: p.diagnosis })
    } catch {
      setLookupError('Patient introuvable. Vérifiez le numéro MRD.')
    }
  }

  const mutation = useMutation({
    mutationFn: () => assignBed(bed.id, mrd.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unit-beds'] })
      qc.invalidateQueries({ queryKey: ['beds-summary'] })
      onAssigned()
    },
    onError: (err: any) => setAssignError(err?.response?.data?.error ?? 'Erreur lors de l\'attribution'),
  })

  return (
    <Modal title={`Attribuer un patient — Lit ${bed.bedNumber}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">No. MRD du patient</label>
          <div className="flex gap-2">
            <input
              value={mrd}
              onChange={e => { setMrd(e.target.value); setPatientInfo(null); setLookupError('') }}
              onKeyDown={e => e.key === 'Enter' && lookupPatient()}
              placeholder="Ex: MRD-2024-001"
              className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <button
              type="button"
              onClick={lookupPatient}
              className="px-3 py-2 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded-lg hover:bg-[#E5E7EB] transition-colors whitespace-nowrap"
            >
              Rechercher
            </button>
          </div>
          {lookupError && <p className="text-xs text-[#DC2626] mt-1">{lookupError}</p>}
        </div>

        {patientInfo && (
          <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-[#111827]">{patientInfo.name}</div>
            <div className="text-xs text-[#6B7280] mt-1">{patientInfo.diagnosis}</div>
            <div className="text-xs text-[#16A34A] mt-1">✓ Patient trouvé · MRD {mrd}</div>
          </div>
        )}

        {assignError && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-4 py-2.5 text-sm text-[#DC2626]">{assignError}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-[#D1D5DB] text-[#374151] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors">
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!patientInfo || mutation.isPending}
            className="flex-1 bg-[#2563EB] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Attribution…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function BedTile({ bed, onStateChange, onAssign }: {
  bed: BedType
  onStateChange: (id: number, state: string) => void
  onAssign: (bed: BedType) => void
}) {
  const s = STATE_STYLES[bed.state] ?? STATE_STYLES.AVAILABLE
  const canAssign = bed.state === 'AVAILABLE' || bed.state === 'READY'
  return (
    <div className={`${s.bg} rounded-xl p-3 border border-white relative flex flex-col items-center justify-center min-h-[140px] gap-1.5`}>
      <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dot }} />
      <div className="text-xs text-[#6B7280]">Lit {bed.bedNumber}</div>
      {bed.state === 'AVAILABLE' || bed.state === 'READY' ? (
        <div className={`text-sm font-bold ${s.text}`}>{s.label}</div>
      ) : (
        <>
          <div className="text-sm font-bold text-[#111827] text-center leading-tight">{bed.patientName ?? '—'}</div>
          <div className="text-xs text-[#6B7280]">{s.label}</div>
        </>
      )}
      {canAssign ? (
        <button
          onClick={() => onAssign(bed)}
          className="mt-1 w-full bg-[#2563EB] text-white text-xs font-semibold py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          <UserPlus className="w-3 h-3" /> Attribuer
        </button>
      ) : (
        <select
          className="mt-1 text-xs border border-[#D1D5DB] rounded-md px-1.5 py-1 bg-white text-[#374151] cursor-pointer w-full"
          value={bed.state}
          onChange={e => onStateChange(bed.id, e.target.value)}
          onClick={e => e.stopPropagation()}
        >
          {STATES.map(st => (
            <option key={st} value={st}>{STATE_STYLES[st]?.label ?? st}</option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function GestionLits() {
  const [activeUnit, setActiveUnit] = useState('2N')
  const [assigningBed, setAssigningBed] = useState<BedType | null>(null)
  const queryClient = useQueryClient()
  const { data: summary = [], isLoading: summaryLoading } = useBedsSummary()

  const { data: beds = [], isLoading: bedsLoading } = useQuery({
    queryKey: ['unit-beds', activeUnit],
    queryFn: () => fetchUnitBeds(activeUnit),
    refetchInterval: 30_000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: string }) => updateBedState(id, state),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unit-beds', activeUnit] }),
  })

  const totalOccupied = summary.reduce((a, u) => a + u.occupied, 0)
  const totalAvailable = summary.reduce((a, u) => a + u.available, 0)
  const totalCleaning = summary.reduce((a, u) => a + u.cleaning, 0)

  if (summaryLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {assigningBed && (
        <AssignPatientModal
          bed={assigningBed}
          onClose={() => setAssigningBed(null)}
          onAssigned={() => {
            setAssigningBed(null)
            queryClient.invalidateQueries({ queryKey: ['unit-beds', activeUnit] })
          }}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard label="Lits occupés" value={totalOccupied} subtitle={`sur ${summary.reduce((a, u) => a + u.total, 0)} total`} icon={<Bed className="w-5 h-5" />} color="blue" />
        <KPICard label="Lits disponibles" value={totalAvailable} subtitle="Prêts à accueillir" icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <KPICard label="Arrivées prévues" value={9} subtitle="Depuis l'urgence" icon={<Users className="w-5 h-5" />} color="blue" />
        <KPICard label="Risque élevé" value={1} subtitle="Patients critiques" icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <KPICard label="En nettoyage" value={totalCleaning} subtitle="En cours" icon={<Clock className="w-5 h-5" />} color="orange" />
      </div>

      {/* Unit Tabs */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex gap-1 border-b border-[#E5E7EB] mb-5 overflow-x-auto">
          {UNITS.map(u => {
            const us = summary.find(s => s.unit === u.code)
            return (
              <button
                key={u.code}
                onClick={() => setActiveUnit(u.code)}
                className={`pb-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${activeUnit === u.code ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
              >
                {u.label}
                {us && <span className="text-xs text-[#9CA3AF] ml-1">{us.occupied}/{us.total}</span>}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-5 text-xs text-[#6B7280]">
          {Object.entries(STATE_STYLES).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: v.dot, opacity: 0.4 }} />
              {v.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[#2563EB]">
            <UserPlus className="w-3.5 h-3.5" /> Cliquez "Attribuer" sur un lit libre pour assigner un patient
          </span>
        </div>

        {/* Bed Grid */}
        {bedsLoading ? <Spinner /> : (
          beds.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280] text-sm">Aucun lit dans cette unité</div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {beds.map(bed => (
                <BedTile
                  key={bed.id}
                  bed={bed}
                  onStateChange={(id, state) => mutation.mutate({ id, state })}
                  onAssign={setAssigningBed}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
