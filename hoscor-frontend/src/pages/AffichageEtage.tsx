import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUnitBeds } from '../api/beds'
import { formatTimeHHMM, formatDateFr } from '../utils/format'
import { Bed as BedType } from '../types'

const UNITS = [
  { code: '2N', label: '2e Nord' },
  { code: '2S', label: '2e Sud' },
  { code: '3N', label: '3e Nord' },
  { code: '3S', label: '3e Sud' },
]

const BED_DARK_STYLES: Record<string, { bg: string; dot: string; dotColor: string }> = {
  OCCUPIED:  { bg: 'bg-[#1E3A5F]', dot: '●', dotColor: '#60A5FA' },
  AVAILABLE: { bg: 'bg-[#14532D]', dot: '●', dotColor: '#86EFAC' },
  CLEANING:  { bg: 'bg-[#3D2B00]', dot: '●', dotColor: '#F97316' },
  READY:     { bg: 'bg-[#2D1B5E]', dot: '●', dotColor: '#7C3AED' },
}

function DarkBedCard({ bed }: { bed: BedType }) {
  const s = BED_DARK_STYLES[bed.state] ?? BED_DARK_STYLES.AVAILABLE
  const isAvail = bed.state === 'AVAILABLE'

  return (
    <div className={`${s.bg} rounded-xl p-4 relative flex flex-col items-center justify-center min-h-[130px]`}>
      <div className="absolute top-3 right-3 text-xs" style={{ color: s.dotColor }}>{s.dot}</div>
      <div className="text-xs text-gray-400 mb-1">LIT {bed.bedNumber}</div>
      {isAvail ? (
        <>
          <div className="text-2xl mb-1">🛏</div>
          <div className="text-xs font-bold" style={{ color: s.dotColor }}>LIBRE</div>
        </>
      ) : (
        <>
          {bed.patientName && <div className="text-xs font-bold text-white text-center">{bed.patientName}</div>}
          <div className="text-xs text-gray-400 mt-1">
            {bed.state === 'CLEANING' ? 'Nettoyage' : bed.state === 'READY' ? 'Prêt' : 'Occupé'}
          </div>
        </>
      )}
    </div>
  )
}

export default function AffichageEtage() {
  const [activeUnit, setActiveUnit] = useState('2N')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: beds = [] } = useQuery({
    queryKey: ['unit-beds', activeUnit],
    queryFn: () => fetchUnitBeds(activeUnit),
    refetchInterval: 30_000,
  })

  const available = beds.filter(b => b.state === 'AVAILABLE')
  const occupied = beds.filter(b => b.state === 'OCCUPIED')

  const unitLabel = UNITS.find(u => u.code === activeUnit)?.label ?? activeUnit

  return (
    <div className="bg-[#1A2535] rounded-2xl overflow-hidden -m-1 min-h-[calc(100vh-140px)] flex flex-col">
      {/* Dark Header */}
      <div className="bg-[#1A2535] border-b border-[#2D3748] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-purple-400 font-bold text-lg">HosCor</span>
              <span className="text-gray-400 text-sm">|</span>
              <span className="text-white font-semibold">{unitLabel}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Affichage poste infirmier · Temps réel</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white font-mono">{formatTimeHHMM(time)}</div>
            <div className="text-xs text-gray-400 mt-0.5 capitalize">{formatDateFr(time)}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#16A34A] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              {available.length} LIBRES
            </span>
            <span className="bg-[#2563EB] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              {occupied.length} OCCUPÉS
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-5">
        {/* Bed Grid */}
        <div className="flex-1">
          {beds.length === 0 ? (
            <div className="text-center py-16 text-gray-500">Aucun lit dans cette unité</div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {beds.map(bed => <DarkBedCard key={bed.id} bed={bed} />)}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#14532D] rounded-sm" />Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#1E3A5F] rounded-sm" />Occupé stable</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#3D2B00] rounded-sm" />Nettoyage</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#2D1B5E] rounded-sm" />Prêt</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-56 bg-[#0F1E2E] rounded-xl p-4 flex flex-col gap-4">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">■ Lits disponibles</div>
            <div className="space-y-2">
              {available.length === 0 ? (
                <div className="text-xs text-gray-500 italic">Aucun lit disponible</div>
              ) : available.map(bed => (
                <button
                  key={bed.id}
                  className="w-full bg-[#16A34A] text-white text-xs font-semibold py-2 px-3 rounded-lg text-left hover:bg-green-700 transition-colors"
                >
                  Lit {bed.bedNumber} — Disponible
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#2D3748] pt-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">▲ Attributions</div>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="text-2xl mb-2">🛏</div>
              <div className="text-xs text-gray-500 italic">Les attributions de lits apparaîtront ici</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Navigation */}
      <div className="bg-[#0F1E2E] px-5 py-3 flex items-center gap-2">
        {UNITS.map(u => (
          <button
            key={u.code}
            onClick={() => setActiveUnit(u.code)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeUnit === u.code ? 'bg-white text-[#1A2535]' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            ● {u.label}
          </button>
        ))}
      </div>
    </div>
  )
}
