import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useBedsSummary } from '../hooks/useBeds'
import { fetchTransfers } from '../api/transfers'
import { fetchWaitingStretchers } from '../api/patients'
import Spinner from '../components/common/Spinner'
import { formatDateFr } from '../utils/format'
import { Sun, ArrowDownCircle, ArrowUpCircle, Clock, AlertTriangle, Sparkles, Droplets, ClipboardList, CheckCircle2, Plus, Trash2 } from 'lucide-react'

const UNIT_COLORS: Record<string, string> = {
  '2N': '#EC4899', '3N': '#F97316', '2S': '#EF4444', '3S': '#16A34A',
  'URG': '#DC2626', 'CHIR': '#0D9488',
}
const UNIT_FULL: Record<string, string> = {
  '2N': '2e Nord — Cardiologie',
  '3N': '3e Nord — Néphro',
  '2S': '2e Sud — Soins Int.',
  '3S': '3e Sud — Méd. Gén.',
  'URG': 'Urgence',
  'CHIR': 'Chirurgie',
}

const ALL_UNITS = ['2N', '3N', '2S', '3S', 'URG', 'CHIR']

type IssueEntry = { id: number; text: string; priority: 'CRITIQUE' | 'MODÉRÉE' | 'FAIBLE'; time: string }
type UnitIssues = Record<string, IssueEntry[]>

export default function StationMatinale() {
  const { data: dashboard, isLoading } = useDashboard()
  const { data: summary = [] } = useBedsSummary()
  const { data: transfers = [] } = useQuery({ queryKey: ['transfers'], queryFn: fetchTransfers })
  const { data: stretchers = [] } = useQuery({ queryKey: ['stretchers'], queryFn: fetchWaitingStretchers })

  // Operational issues per unit (local meeting state)
  const [unitIssues, setUnitIssues] = useState<UnitIssues>(() =>
    ALL_UNITS.reduce((acc, u) => ({ ...acc, [u]: [] }), {})
  )
  const [activeIssueUnit, setActiveIssueUnit] = useState('2N')
  const [newIssueText, setNewIssueText] = useState('')
  const [newIssuePriority, setNewIssuePriority] = useState<IssueEntry['priority']>('MODÉRÉE')
  const [issueCounter, setIssueCounter] = useState(1)

  function addIssue() {
    if (!newIssueText.trim()) return
    const entry: IssueEntry = {
      id: issueCounter,
      text: newIssueText.trim(),
      priority: newIssuePriority,
      time: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
    }
    setUnitIssues(prev => ({ ...prev, [activeIssueUnit]: [...(prev[activeIssueUnit] ?? []), entry] }))
    setIssueCounter(c => c + 1)
    setNewIssueText('')
  }

  function removeIssue(unit: string, id: number) {
    setUnitIssues(prev => ({ ...prev, [unit]: prev[unit].filter(i => i.id !== id) }))
  }

  const totalIssues = Object.values(unitIssues).reduce((a, arr) => a + arr.length, 0)
  const criticalIssues = Object.values(unitIssues).flat().filter(i => i.priority === 'CRITIQUE').length

  const today = new Date()
  const dateStr = formatDateFr(today).charAt(0).toUpperCase() + formatDateFr(today).slice(1)
  const highRisk = stretchers.filter(s => s.riskLevel === 'ELEVE').length

  // Transfer census
  const entrants = transfers.filter(t => t.transferType === 'ENTRANT')
  const sortants = transfers.filter(t => t.transferType === 'SORTANT')
  const pending = transfers.filter(t => t.status === 'EN_ATTENTE')
  const inProgress = transfers.filter(t => t.status === 'EN_COURS')
  const completed = transfers.filter(t => t.status === 'COMPLET')
  const pendingEntrants = entrants.filter(t => t.status === 'EN_ATTENTE')
  const pendingSortants = sortants.filter(t => t.status === 'EN_ATTENTE')
  // Delayed = EN_ATTENTE scheduled more than 1h ago
  const now = Date.now()
  const delayed = pending.filter(t => {
    const scheduled = new Date(t.scheduledAt).getTime()
    return now - scheduled > 60 * 60 * 1000
  })

  // Hygiene / cleaning data
  const totalCleaning = summary.reduce((a, u) => a + u.cleaning, 0)
  const totalReady = summary.reduce((a, u) => a + (u.available || 0), 0)
  const totalOccupied = summary.reduce((a, u) => a + u.occupied, 0)
  const totalBeds = summary.reduce((a, u) => a + u.total, 0)

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Blue gradient banner */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-6 h-6 text-yellow-300" />
          <h1 className="text-2xl font-bold">Réunion de coordination matinale</h1>
        </div>
        <p className="text-sm text-white/75 mb-6">
          {dateStr} · 08h00 · CISSS de l'Outaouais
        </p>
        <div className="grid grid-cols-4 gap-8">
          {[
            { value: dashboard?.totalBeds ?? 60, label: 'Patients (capacité)' },
            { value: dashboard?.occupiedBeds ?? 0, label: 'Présents aujourd\'hui' },
            { value: `${dashboard?.occupancyRate?.toFixed(0) ?? 0}%`, label: 'Taux d\'occupation' },
            { value: completed.length, label: 'Transferts complétés' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-bold">{value}</div>
              <div className="text-xs text-white/75 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bed availability */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#111827]">🛏 Disponibilité des lits — État actuel</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#16A34A] bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              {dashboard?.availableBeds ?? 0} lits libres au total
            </span>
            <span className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              {dashboard?.waitingPatients ?? 0} en attente urgence
            </span>
          </div>
        </div>

        {/* Unit cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {summary.filter(u => ['2N', '3N', '2S', '3S'].includes(u.unit)).map(unit => {
            const color = UNIT_COLORS[unit.unit] ?? '#6B7280'
            const pct = unit.total > 0 ? (unit.occupied / unit.total) * 100 : 0
            const isWarning = unit.available <= 3
            return (
              <div key={unit.unit} className="border border-[#E5E7EB] rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color }}>
                  {UNIT_FULL[unit.unit] ?? unit.unit}
                </div>
                <div className="text-4xl font-bold mb-1" style={{ color }}>
                  {unit.available}{isWarning && <span className="text-lg ml-1">⚠️</span>}
                </div>
                <div className="text-xs text-[#6B7280] mb-3">lits disponibles</div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <div className="text-xs text-[#9CA3AF]">{unit.occupied} occupés · {unit.total} total</div>
              </div>
            )
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4 text-sm font-semibold text-[#16A34A]">
            {dashboard?.availableBeds ?? 0} Lits libres total
            <div className="text-xs text-[#6B7280] font-normal mt-1">sur {dashboard?.totalBeds ?? 0} lits dans l'hôpital</div>
          </div>
          <div className="bg-[#FEFCE8] border border-yellow-200 rounded-xl p-4 text-sm font-semibold text-[#CA8A04]">
            {dashboard?.waitingPatients ?? 0} Patients en attente
            <div className="text-xs text-[#6B7280] font-normal mt-1">Sur civière à l'urgence</div>
          </div>
          <div className="bg-[#FEF2F2] border border-red-200 rounded-xl p-4 text-sm font-semibold text-[#DC2626]">
            {highRisk} Priorité ÉLEVÉE
            <div className="text-xs text-[#6B7280] font-normal mt-1">Attribution urgente requise</div>
          </div>
        </div>
      </div>

      {/* Transfer / Repatriation Census */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#111827]">🔄 Recensement des transferts et rapatriements</h2>
          <span className="text-xs bg-[#DBEAFE] text-[#2563EB] px-2 py-0.5 rounded-full font-medium">{transfers.length} au total</span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Rapatriements attendus</span>
            </div>
            <div className="text-3xl font-bold text-[#2563EB]">{pendingEntrants.length}</div>
            <div className="text-xs text-[#6B7280]">Rapatriements en attente d'arrivée</div>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[#CA8A04]" />
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Rapatriements en cours</span>
            </div>
            <div className="text-3xl font-bold text-[#CA8A04]">{inProgress.filter(t => t.transferType === 'ENTRANT').length}</div>
            <div className="text-xs text-[#6B7280]">Acheminement en cours vers l'établissement</div>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Transferts sortants</span>
            </div>
            <div className="text-3xl font-bold text-[#7C3AED]">{sortants.length}</div>
            <div className="text-xs text-[#6B7280]">{pendingSortants.length} en attente · {inProgress.filter(t => t.transferType === 'SORTANT').length} en cours</div>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Mouvements retardés</span>
            </div>
            <div className="text-3xl font-bold text-[#DC2626]">{delayed.length}</div>
            <div className="text-xs text-[#6B7280]">En attente depuis plus d'1h</div>
          </div>
        </div>

        {/* Transfer table */}
        {transfers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {['TYPE', 'PATIENT', 'PROVENANCE / DESTINATION', 'TRANSPORT', 'PRÉVU', 'STATUT'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[#9CA3AF] font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map((t, i) => {
                  const statusStyle =
                    t.status === 'COMPLET' ? 'bg-green-100 text-green-700' :
                    t.status === 'EN_COURS' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  const statusLabel =
                    t.status === 'COMPLET' ? 'Complété' :
                    t.status === 'EN_COURS' ? 'En cours' : 'En attente'
                  return (
                    <tr key={t.id} className={`border-b border-[#F3F4F6] ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''}`}>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${t.transferType === 'ENTRANT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {t.transferType === 'ENTRANT' ? '↓ Entrant' : '↑ Sortant'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#374151]">
                        {t.patient?.firstName} {t.patient?.lastName}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280]">
                        {t.transferType === 'ENTRANT' ? (t.originHospital ?? '—') : (t.destinationHospital ?? '—')}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280]">{t.transportType ?? '—'}</td>
                      <td className="py-2.5 px-3 text-[#6B7280]">
                        {new Date(t.scheduledAt).toLocaleString('fr-CA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#9CA3AF]">Aucun transfert enregistré pour aujourd'hui.</div>
        )}
      </div>

      {/* Hygiene & Cleaning Report */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-4 h-4 text-[#0D9488]" />
          <h2 className="text-sm font-semibold text-[#111827]">🧹 Rapport hygiène et salubrité</h2>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Lits nettoyés</div>
            <div className="text-3xl font-bold text-[#16A34A]">{totalReady}</div>
            <div className="text-xs text-[#6B7280] mt-1">État PRÊT — disponibles à l'attribution</div>
          </div>

          <div className="bg-[#FEFCE8] border border-yellow-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">En nettoyage</div>
            <div className="text-3xl font-bold text-[#CA8A04]">{totalCleaning}</div>
            <div className="text-xs text-[#6B7280] mt-1">Nettoyage en cours — non disponibles</div>
          </div>

          <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Disponibles après nettoyage</div>
            <div className="text-3xl font-bold text-[#2563EB]">{totalCleaning}</div>
            <div className="text-xs text-[#6B7280] mt-1">Libérations attendues en cours de journée</div>
          </div>

          <div className="bg-[#F5F3FF] border border-purple-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Charge de travail</div>
            <div className="text-3xl font-bold text-[#7C3AED]">{totalCleaning + totalReady}</div>
            <div className="text-xs text-[#6B7280] mt-1">Lits traités ou en traitement aujourd'hui</div>
          </div>
        </div>

        {/* Per-unit hygiene breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['UNITÉ', 'TOTAL LITS', 'OCCUPÉS', 'NETTOYAGE EN COURS', 'PRÊTS (NETTOYÉS)', 'DISPONIBLES', 'TAUX OCCUPATION'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[#9CA3AF] font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((u, i) => {
                const pct = u.total > 0 ? Math.round((u.occupied / u.total) * 100) : 0
                const pctColor = pct >= 95 ? 'text-[#DC2626]' : pct >= 85 ? 'text-[#CA8A04]' : 'text-[#16A34A]'
                return (
                  <tr key={u.unit} className={`border-b border-[#F3F4F6] ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''}`}>
                    <td className="py-2.5 px-3 font-semibold text-[#374151]">{u.unit}</td>
                    <td className="py-2.5 px-3 text-[#374151]">{u.total}</td>
                    <td className="py-2.5 px-3 text-[#374151]">{u.occupied}</td>
                    <td className="py-2.5 px-3">
                      {u.cleaning > 0 ? (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{u.cleaning}</span>
                      ) : (
                        <span className="text-[#9CA3AF]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {u.available > 0 ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{u.available}</span>
                      ) : (
                        <span className="text-[#9CA3AF]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#374151]">{u.available}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden w-16">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 95 ? '#DC2626' : pct >= 85 ? '#CA8A04' : '#16A34A' }}
                          />
                        </div>
                        <span className={`font-semibold ${pctColor}`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalCleaning > 0 && (
          <div className="mt-4 bg-[#FEFCE8] border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#CA8A04] flex-shrink-0" />
            <p className="text-xs text-[#92400E]">
              <span className="font-semibold">{totalCleaning} lit{totalCleaning > 1 ? 's' : ''} en nettoyage</span> — Alerter l'équipe d'hygiène pour accélérer la rotation.
              Ces lits seront disponibles après validation par le responsable hygiène.
            </p>
          </div>
        )}
      </div>

      {/* ── Operational Issues per Unit ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="text-sm font-semibold text-[#111827]">Points opérationnels — Rapport des chefs d'unité</h2>
          </div>
          <div className="flex items-center gap-3">
            {criticalIssues > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                {criticalIssues} critique{criticalIssues > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-[#6B7280]">{totalIssues} point{totalIssues !== 1 ? 's' : ''} enregistré{totalIssues !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Unit selector */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {ALL_UNITS.map(u => {
            const count = unitIssues[u]?.length ?? 0
            const hasCritical = unitIssues[u]?.some(i => i.priority === 'CRITIQUE')
            const color = UNIT_COLORS[u] ?? '#6B7280'
            return (
              <button
                key={u}
                onClick={() => setActiveIssueUnit(u)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-colors relative ${activeIssueUnit === u ? 'text-white' : 'bg-white text-[#374151] border-[#E5E7EB]'}`}
                style={activeIssueUnit === u ? { backgroundColor: color, borderColor: color } : {}}
              >
                {UNIT_FULL[u]}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${hasCritical ? 'bg-red-500 text-white' : 'bg-white/30 text-inherit'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Input form */}
          <div>
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
              Ajouter un point — {UNIT_FULL[activeIssueUnit]}
            </div>
            <textarea
              value={newIssueText}
              onChange={e => setNewIssueText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addIssue() }}
              rows={3}
              placeholder="Décrivez l'enjeu opérationnel observé dans l'unité…"
              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB] mb-2"
            />
            <div className="flex gap-2">
              <select
                value={newIssuePriority}
                onChange={e => setNewIssuePriority(e.target.value as IssueEntry['priority'])}
                className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="CRITIQUE">🔴 Critique</option>
                <option value="MODÉRÉE">🟡 Modérée</option>
                <option value="FAIBLE">🟢 Faible</option>
              </select>
              <button
                onClick={addIssue}
                disabled={!newIssueText.trim()}
                className="flex items-center gap-1 bg-[#7C3AED] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">Ctrl+Entrée pour soumettre rapidement</p>
          </div>

          {/* Issues list for active unit */}
          <div>
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
              Points de {UNIT_FULL[activeIssueUnit]} ({unitIssues[activeIssueUnit]?.length ?? 0})
            </div>
            {(unitIssues[activeIssueUnit]?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-28 text-xs text-[#9CA3AF] bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB]">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#16A34A]" />
                Aucun point signalé pour cette unité
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {unitIssues[activeIssueUnit].map(issue => (
                  <div
                    key={issue.id}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2.5 border text-xs ${
                      issue.priority === 'CRITIQUE' ? 'bg-[#FEF2F2] border-red-200' :
                      issue.priority === 'MODÉRÉE'  ? 'bg-[#FEFCE8] border-yellow-200' :
                      'bg-[#F0FDF4] border-green-200'
                    }`}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {issue.priority === 'CRITIQUE' ? '🔴' : issue.priority === 'MODÉRÉE' ? '🟡' : '🟢'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#374151] leading-snug">{issue.text}</p>
                      <p className="text-[#9CA3AF] mt-0.5">{issue.time}</p>
                    </div>
                    <button onClick={() => removeIssue(activeIssueUnit, issue.id)} className="text-[#9CA3AF] hover:text-[#DC2626] flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary across all units */}
        {totalIssues > 0 && (
          <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Récapitulatif — Tous les unités</div>
            <div className="space-y-2">
              {ALL_UNITS.filter(u => (unitIssues[u]?.length ?? 0) > 0).map(u => (
                <div key={u} className="flex items-start gap-3">
                  <span className="text-xs font-bold min-w-[80px]" style={{ color: UNIT_COLORS[u] ?? '#6B7280' }}>
                    {u}
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {unitIssues[u].map(issue => (
                      <span
                        key={issue.id}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          issue.priority === 'CRITIQUE' ? 'bg-red-100 text-red-700' :
                          issue.priority === 'MODÉRÉE'  ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        {issue.priority === 'CRITIQUE' ? '🔴' : issue.priority === 'MODÉRÉE' ? '🟡' : '🟢'}
                        {issue.text.length > 40 ? issue.text.slice(0, 40) + '…' : issue.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Night report */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">🌙 Bilan de la nuit</h2>
          <div className="space-y-3">
            {[
              { label: 'Admissions', value: 7, pct: 80, color: '#2563EB' },
              { label: 'Congés', value: 5, pct: 50, color: '#16A34A' },
              { label: 'Transferts', value: completed.length, pct: Math.min(completed.length * 20, 100), color: '#0D9488' },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-xs text-[#374151] font-medium w-24">{r.label}</span>
                <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                </div>
                <span className="text-xs font-semibold text-[#374151] w-8 text-right">+{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#F0FDF4] border border-green-200 rounded-lg px-4 py-3 text-xs text-[#16A34A] font-medium">
            ✅ Bilan stable. Aucune saturation critique enregistrée la nuit.
          </div>
        </div>

        {/* Issues */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">⚠️ Points d'attention</h2>
          <div className="space-y-3">
            {summary.find(u => u.unit === '3N') && (
              <div className="bg-[#FFF5F5] border border-red-200 rounded-lg px-4 py-3 text-xs text-[#DC2626]">
                3e Nord Néphro — {summary.find(u => u.unit === '3N')?.rate?.toFixed(0)}% d'occupation.
                Seulement {summary.find(u => u.unit === '3N')?.available} lits disponibles.
              </div>
            )}
            <div className="bg-[#FEFCE8] border border-yellow-200 rounded-lg px-4 py-3 text-xs text-[#CA8A04]">
              {dashboard?.waitingPatients ?? 0} patients sur civière à l'urgence.{' '}
              {highRisk > 0 && `${highRisk} priorité élevée — attribution urgente requise.`}
            </div>
            {delayed.length > 0 && (
              <div className="bg-[#FFF5F5] border border-red-200 rounded-lg px-4 py-3 text-xs text-[#DC2626]">
                {delayed.length} transfert{delayed.length > 1 ? 's' : ''} retardé{delayed.length > 1 ? 's' : ''} — suivi requis.
              </div>
            )}
            <div className="bg-[#F0FDF4] border border-green-200 rounded-lg px-4 py-3 text-xs text-[#16A34A]">
              7 congés planifiés aujourd'hui. Libérations prévues en cours de journée — alerter l'équipe d'hygiène.
            </div>
          </div>

          {/* Transfers summary */}
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#111827]">🔄 Transferts du jour</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{entrants.length} rapatriements</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">{sortants.length} sortants</span>
              {delayed.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{delayed.length} retardé{delayed.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
