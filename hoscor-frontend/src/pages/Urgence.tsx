import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWaitingStretchers } from '../api/patients'
import { fetchUnitBeds, assignBed } from '../api/beds'
import { Stretcher, Bed } from '../types'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import { Clock, Users, X } from 'lucide-react'
import { formatWaitTime } from '../utils/format'

const UNIT_FULL: Record<string, string> = {
  '2N': '2e Nord — Cardiologie', '3N': '3e Nord — Néphrologie',
  '2S': '2e Sud — Soins int.', '3S': '3e Sud — Méd. gén.',
  URG: 'Urgence', CHIR: 'Chirurgie',
}
const UNITS = ['2N', '2S', '3N', '3S', 'URG', 'CHIR']

const RISK_BORDER: Record<string, string> = {
  ELEVE: 'border-[#DC2626] bg-[#FFF5F5]',
  MOYEN: 'border-[#CA8A04] bg-[#FFFBEB]',
  FAIBLE: 'border-[#16A34A] bg-[#F0FDF4]',
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#111827]">{title}</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827] p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function BedAssignModal({ stretcher, onClose, onAssigned }: {
  stretcher: Stretcher
  onClose: () => void
  onAssigned: () => void
}) {
  const qc = useQueryClient()
  const [selectedUnit, setSelectedUnit] = useState(stretcher.targetUnit ?? '2N')
  const [error, setError] = useState('')

  const { data: beds = [], isLoading } = useQuery({
    queryKey: ['unit-beds', selectedUnit],
    queryFn: () => fetchUnitBeds(selectedUnit),
  })

  const availableBeds = beds.filter(b => b.state === 'AVAILABLE' || b.state === 'READY')

  const mutation = useMutation({
    mutationFn: ({ bedId }: { bedId: number }) =>
      assignBed(bedId, stretcher.patient.mrdNumber, stretcher.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stretchers'] })
      qc.invalidateQueries({ queryKey: ['unit-beds', selectedUnit] })
      onAssigned()
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Erreur lors de l\'attribution'),
  })

  const patient = stretcher.patient
  const wait = formatWaitTime(stretcher.waitSince)

  return (
    <Modal title="Attribuer un lit" onClose={onClose}>
      {/* Patient summary */}
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-[#111827]">{patient.firstName} {patient.lastName}</span>
          <StatusBadge variant={stretcher.riskLevel} />
        </div>
        <div className="text-xs text-[#6B7280]">{patient.mrdNumber} · {patient.age} ans · {patient.diagnosis}</div>
        <div className="text-xs text-[#6B7280] mt-1">Civière {stretcher.stretcherNumber} · Attente: {wait.text}</div>
      </div>

      {/* Unit selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Unité</label>
        <div className="flex flex-wrap gap-2">
          {UNITS.map(u => (
            <button
              key={u}
              onClick={() => setSelectedUnit(u)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${selectedUnit === u ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Available beds */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
          Lits disponibles — {UNIT_FULL[selectedUnit] ?? selectedUnit}
        </label>
        {isLoading ? (
          <div className="text-center py-4 text-xs text-[#6B7280]">Chargement…</div>
        ) : availableBeds.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#DC2626] bg-[#FEF2F2] rounded-lg">Aucun lit disponible dans cette unité</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {availableBeds.map(bed => (
              <button
                key={bed.id}
                onClick={() => mutation.mutate({ bedId: bed.id })}
                disabled={mutation.isPending}
                className={`border-2 rounded-xl p-3 text-left transition-all hover:border-[#2563EB] hover:bg-blue-50 disabled:opacity-50 ${bed.state === 'READY' ? 'border-[#2563EB]' : 'border-[#D1D5DB]'}`}
              >
                <div className="text-xs font-bold text-[#111827]">Lit {bed.bedNumber}</div>
                <div className={`text-xs mt-1 ${bed.state === 'READY' ? 'text-[#2563EB]' : 'text-[#16A34A]'}`}>
                  {bed.state === 'READY' ? '✓ Prêt' : '✓ Disponible'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-4 py-2.5 text-sm text-[#DC2626] mb-3">{error}</div>
      )}

      {mutation.isPending && (
        <div className="text-center text-sm text-[#6B7280]">Attribution en cours…</div>
      )}
    </Modal>
  )
}

function StretcherCard({ s, onAssign }: { s: Stretcher; onAssign: () => void }) {
  const wait = formatWaitTime(s.waitSince)
  const border = RISK_BORDER[s.riskLevel] ?? 'border-gray-300 bg-white'
  return (
    <div className={`border-2 ${border} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">Civière {s.stretcherNumber}</span>
        <span className="text-xs text-[#9CA3AF]">{s.patient?.mrdNumber}</span>
      </div>
      <div>
        <div className="text-sm font-semibold text-[#111827]">
          {s.patient?.firstName} {s.patient?.lastName} · {s.patient?.age} ans
        </div>
        <div className="text-sm font-bold text-[#111827] mt-0.5">{s.patient?.diagnosis}</div>
        <div className="text-xs text-[#6B7280] mt-0.5">{UNIT_FULL[s.targetUnit ?? ''] ?? s.targetUnit}</div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge variant={s.riskLevel} />
        <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-[#92400E] text-xs font-medium px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" />
          {wait.text}
        </span>
      </div>
      <button
        onClick={onAssign}
        className="mt-1 w-full bg-[#2563EB] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Attribuer un lit →
      </button>
    </div>
  )
}

export default function Urgence() {
  const qc = useQueryClient()
  const { data: stretchers = [], isLoading } = useQuery({
    queryKey: ['stretchers'],
    queryFn: fetchWaitingStretchers,
    refetchInterval: 30_000,
  })

  const [assigningStretcher, setAssigningStretcher] = useState<Stretcher | null>(null)

  const eleve = stretchers.filter(s => s.riskLevel === 'ELEVE')
  const moyen = stretchers.filter(s => s.riskLevel === 'MOYEN')
  const faible = stretchers.filter(s => s.riskLevel === 'FAIBLE')
  const sorted = [...eleve, ...moyen, ...faible]

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {assigningStretcher && (
        <BedAssignModal
          stretcher={assigningStretcher}
          onClose={() => setAssigningStretcher(null)}
          onAssigned={() => {
            setAssigningStretcher(null)
            qc.invalidateQueries({ queryKey: ['stretchers'] })
          }}
        />
      )}

      {/* Status bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl px-5 py-3 flex items-center gap-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#DC2626]">
          <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full inline-block" />{eleve.length} ÉLEVÉ
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold text-[#CA8A04]">
          <span className="w-2.5 h-2.5 bg-[#CA8A04] rounded-full inline-block" />{moyen.length} MOYEN
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
          <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-full inline-block" />{faible.length} FAIBLE
        </span>
        <span className="ml-auto text-sm text-[#6B7280]">
          {stretchers.length} patient{stretchers.length !== 1 ? 's' : ''} sur civière
        </span>
      </div>

      {/* Stretcher Grid */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#111827]">Zone civière — Patients en attente de lit</h2>
        </div>
        {stretchers.length === 0 ? (
          <div className="text-center py-12 text-[#6B7280] text-sm">Aucun patient en attente</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {sorted.map(s => (
              <StretcherCard key={s.id} s={s} onAssign={() => setAssigningStretcher(s)} />
            ))}
          </div>
        )}
      </div>

      {/* Priority Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#111827] mb-4">Liste triée par priorité</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['CIVIÈRE', 'MRD', 'PATIENT', 'DIAGNOSTIC', 'RISQUE', 'ATTENTE', 'UNITÉ CIBLE', 'ACTION'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[#9CA3AF] font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const wait = formatWaitTime(s.waitSince)
              return (
                <tr key={s.id} className={`border-b border-[#F3F4F6] ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''} hover:bg-[#F0F9FF]`}>
                  <td className="py-2.5 px-3 font-medium text-[#374151]">{s.stretcherNumber}</td>
                  <td className="py-2.5 px-3 text-[#6B7280]">{s.patient?.mrdNumber}</td>
                  <td className="py-2.5 px-3 text-[#374151]">{s.patient?.firstName} {s.patient?.lastName}</td>
                  <td className="py-2.5 px-3 text-[#374151] font-medium">{s.patient?.diagnosis}</td>
                  <td className="py-2.5 px-3"><StatusBadge variant={s.riskLevel} /></td>
                  <td className="py-2.5 px-3">
                    <span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-medium">{wait.text}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#6B7280]">{UNIT_FULL[s.targetUnit ?? ''] ?? s.targetUnit ?? '—'}</td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => setAssigningStretcher(s)}
                      className="bg-[#2563EB] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Attribuer
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
