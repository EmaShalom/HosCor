import { useState } from 'react'
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUnitBeds, updateBedState } from '../api/beds'
import KPICard from '../components/common/KPICard'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import { Trash2, Clock, CheckCircle } from 'lucide-react'
import { Bed } from '../types'

const CLEANING_STATES = ['À nettoyer', 'En cours', 'Prêt'] as const
type CleaningState = typeof CLEANING_STATES[number]

const STATE_MAP: Record<CleaningState, string> = {
  'À nettoyer': 'CLEANING',
  'En cours': 'OCCUPIED',
  'Prêt': 'READY',
}

const BADGE_MAP: Record<string, CleaningState> = {
  CLEANING: 'À nettoyer',
  OCCUPIED: 'En cours',
  READY: 'Prêt',
}

const BADGE_STYLE: Record<CleaningState, string> = {
  'À nettoyer': 'bg-red-100 text-red-800 border border-red-200',
  'En cours': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Prêt': 'bg-green-100 text-green-800 border border-green-200',
}

const UNIT_FULL: Record<string, string> = {
  '2N': '2e Nord — Cardiologie',
  '3N': '3e Nord — Néphrologie',
  '2S': '2e Sud — Soins intensifs',
  '3S': '3e Sud — Médecine générale',
  URG: 'Urgence',
  CHIR: 'Chirurgie',
}

const UNITS = ['2N', '2S', '3N', '3S', 'URG', 'CHIR']

function useCombinedBeds() {
  const queries = useQueries({
    queries: UNITS.map(unit => ({
      queryKey: ['unit-beds', unit],
      queryFn: () => fetchUnitBeds(unit),
      refetchInterval: 60_000,
    }))
  })
  const isLoading = queries.some(q => q.isLoading)
  const beds: Array<Bed & { unit: string }> = queries.flatMap((q, i) =>
    (q.data ?? []).map(b => ({ ...b, unit: b.unit || UNITS[i] }))
  )
  const dirtyBeds = beds.filter(b => ['CLEANING', 'READY', 'OCCUPIED'].includes(b.state) && b.patientName == null)
  const cleaningBeds = beds.filter(b => b.state === 'CLEANING')
  const readyBeds = beds.filter(b => b.state === 'READY')
  return { beds: dirtyBeds, isLoading, cleaningBeds, readyBeds, allBeds: beds }
}

export default function Hygiene() {
  const qc = useQueryClient()
  const { beds, isLoading, cleaningBeds, readyBeds } = useCombinedBeds()

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: string }) => updateBedState(id, state),
    onSuccess: () => UNITS.forEach(u => qc.invalidateQueries({ queryKey: ['unit-beds', u] })),
  })

  const aNettoyer = beds.filter(b => b.state === 'CLEANING').length
  const enCours = beds.filter(b => b.state === 'OCCUPIED' && !b.patientName).length

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="À nettoyer" value={aNettoyer} subtitle="Lits en attente" icon={<Trash2 className="w-5 h-5" />} color="red" />
        <KPICard label="En cours" value={enCours} subtitle="Nettoyage actif" icon={<Clock className="w-5 h-5" />} color="orange" />
        <KPICard label="Prêts" value={readyBeds.length} subtitle="Disponibles" icon={<CheckCircle className="w-5 h-5" />} color="green" />
      </div>

      {/* Bed list */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#111827]">✏️ Suivi des lits — Post-congé</h2>
          <span className="text-xs font-semibold text-[#EA580C] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
            {aNettoyer + enCours + readyBeds.length} lits à traiter
          </span>
        </div>

        {beds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm text-[#6B7280]">Tous les lits sont propres et disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {beds.map(bed => {
              const displayStatus: CleaningState = BADGE_MAP[bed.state] ?? 'À nettoyer'
              return (
                <div key={bed.id} className="flex items-center justify-between py-3 px-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-[#9CA3AF] font-mono w-16">
                      {bed.unit}·L{bed.bedNumber?.replace(/[^0-9]/g, '') ?? '?'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#111827]">
                        Lit {bed.bedNumber}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        {UNIT_FULL[bed.unit] ?? bed.unit}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BADGE_STYLE[displayStatus]}`}>
                      {displayStatus}
                    </span>
                    <select
                      value={displayStatus}
                      onChange={e => {
                        const newBackendState = STATE_MAP[e.target.value as CleaningState]
                        if (newBackendState) mutation.mutate({ id: bed.id, state: newBackendState })
                      }}
                      className="text-xs border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                    >
                      {CLEANING_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
