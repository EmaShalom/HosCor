import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchHygieneBeds, updateBedState } from '../api/beds'
import KPICard from '../components/common/KPICard'
import Spinner from '../components/common/Spinner'
import { Trash2, Clock, CheckCircle } from 'lucide-react'
import type { HygieneBed } from '../types'

const CLEANING_STATES = ['À nettoyer', 'En cours', 'Prêt'] as const
type CleaningState = typeof CLEANING_STATES[number]

const STATE_MAP: Record<CleaningState, string> = {
  'À nettoyer': 'CLEANING',
  'En cours':   'OCCUPIED',
  'Prêt':       'READY',
}

const BADGE_MAP: Record<string, CleaningState> = {
  CLEANING: 'À nettoyer',
  OCCUPIED: 'En cours',
  READY:    'Prêt',
}

const BADGE_STYLE: Record<CleaningState, string> = {
  'À nettoyer': 'bg-red-100 text-red-800 border border-red-200',
  'En cours':   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Prêt':       'bg-green-100 text-green-800 border border-green-200',
}

const UNIT_FULL: Record<string, string> = {
  '2N': '2e Nord — Cardiologie',
  '3N': '3e Nord — Néphrologie',
  '2S': '2e Sud — Soins intensifs',
  '3S': '3e Sud — Médecine générale',
  URG:  'Urgence',
  CHIR: 'Chirurgie',
}

export default function Hygiene() {
  const qc = useQueryClient()

  const { data: beds = [], isLoading } = useQuery({
    queryKey: ['hygiene-beds'],
    queryFn: fetchHygieneBeds,
    refetchInterval: 60_000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: string }) => updateBedState(id, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hygiene-beds'] }),
  })

  const aNettoyer = beds.filter((b: HygieneBed) => b.state === 'CLEANING').length
  const enCours   = beds.filter((b: HygieneBed) => b.state === 'OCCUPIED').length
  const prets     = beds.filter((b: HygieneBed) => b.state === 'READY').length

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="À nettoyer" value={aNettoyer} subtitle="Lits en attente"   icon={<Trash2      className="w-5 h-5" />} color="red"    />
        <KPICard label="En cours"   value={enCours}   subtitle="Nettoyage actif"   icon={<Clock       className="w-5 h-5" />} color="orange" />
        <KPICard label="Prêts"      value={prets}     subtitle="Disponibles"       icon={<CheckCircle className="w-5 h-5" />} color="green"  />
      </div>

      {/* Bed list */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#111827]">✏️ Suivi des lits — Post-congé</h2>
          <span className="text-xs font-semibold text-[#EA580C] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
            {beds.length} lits à traiter
          </span>
        </div>

        {beds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm text-[#6B7280]">Tous les lits sont propres et disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {beds.map((bed: HygieneBed) => {
              const displayStatus: CleaningState = BADGE_MAP[bed.state] ?? 'À nettoyer'
              const bedCode = `${bed.unit}·L${bed.bedNumber?.replace(/[^0-9]/g, '') ?? '?'}`
              return (
                <div
                  key={bed.id}
                  className="flex items-center justify-between py-3 px-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-colors"
                >
                  {/* Left: bed code + patient info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-xs text-[#9CA3AF] font-mono w-16 flex-shrink-0">
                      {bedCode}
                    </div>
                    <div className="min-w-0">
                      {bed.mrdNumber ? (
                        <>
                          <div className="text-sm font-semibold text-[#111827] truncate">
                            {bed.mrdNumber}
                            {bed.patientAge != null && <span className="font-normal text-[#374151]"> · {bed.patientAge}a</span>}
                            {bed.dischargeDate && <span className="font-normal text-[#6B7280]"> · Congé {bed.dischargeDate}</span>}
                          </div>
                          <div className="text-xs text-[#6B7280] mt-0.5 truncate">
                            {UNIT_FULL[bed.unit] ?? bed.unit}
                            {bed.diagnosis && <span> · Diagnostic&nbsp;: {bed.diagnosis}</span>}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-[#111827]">Lit {bed.bedNumber}</div>
                          <div className="text-xs text-[#6B7280] mt-0.5">{UNIT_FULL[bed.unit] ?? bed.unit}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: badge + dropdown */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BADGE_STYLE[displayStatus]}`}>
                      {displayStatus}
                    </span>
                    <select
                      value={displayStatus}
                      onChange={e => {
                        const newState = STATE_MAP[e.target.value as CleaningState]
                        if (newState) mutation.mutate({ id: bed.id, state: newState })
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
