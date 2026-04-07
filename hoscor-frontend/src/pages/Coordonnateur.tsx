import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDashboard } from '../hooks/useDashboard'
import { useBedsSummary } from '../hooks/useBeds'
import { fetchTransfers, createTransfer, CreateTransferPayload } from '../api/transfers'
import { fetchWaitingStretchers } from '../api/patients'
import KPICard from '../components/common/KPICard'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import { Bed, Users, AlertTriangle, TrendingUp, RefreshCw, X } from 'lucide-react'
import { formatDateTime } from '../utils/format'
import { UnitSummary, Transfer } from '../types'

const UNIT_ICONS: Record<string, string> = { '2N': '🩺', '3N': '🔬', '2S': '🏥', '3S': '💊', URG: '🚨', CHIR: '✂️' }
const UNIT_FULL: Record<string, string> = {
  '2N': '2e Nord — Cardiologie', '3N': '3e Nord — Néphrologie',
  '2S': '2e Sud — Soins intensifs', '3S': '3e Sud — Médecine gén.',
  URG: 'Urgence', CHIR: 'Chirurgie',
}
const UNIT_BAR_COLOR: Record<string, string> = {
  '2N': '#2563EB', '3N': '#7C3AED', '2S': '#EF4444', '3S': '#16A34A', URG: '#EA580C', CHIR: '#0D9488',
}
const UNIT_BADGE_BG: Record<string, string> = {
  '2N': 'bg-blue-100 text-blue-800', '3N': 'bg-purple-100 text-purple-800',
  '2S': 'bg-red-100 text-red-800', '3S': 'bg-green-100 text-green-800',
  URG: 'bg-orange-100 text-orange-800', CHIR: 'bg-teal-100 text-teal-800',
}

const EMPTY_FORM: CreateTransferPayload = {
  patientMrd: '', transferType: 'ENTRANT', originHospital: '', destinationHospital: '',
  scheduledAt: '', transportType: '', notes: '', status: 'EN_ATTENTE',
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

function UnitGridCard({ unit }: { unit: UnitSummary }) {
  const pct = unit.total > 0 ? Math.round((unit.occupied / unit.total) * 100) : 0
  const color = UNIT_BAR_COLOR[unit.unit] ?? '#6B7280'
  const badgeClass = UNIT_BADGE_BG[unit.unit] ?? 'bg-gray-100 text-gray-700'
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{UNIT_ICONS[unit.unit] ?? '🏥'}</span>
          <span className="text-sm font-semibold text-[#111827]">{UNIT_FULL[unit.unit] ?? unit.name}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {unit.occupied}/{unit.total} occupés
        </span>
      </div>
      <p className="text-xs text-[#6B7280] mb-3">{unit.available} lit{unit.available !== 1 ? 's' : ''} disponible{unit.available !== 1 ? 's' : ''}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>Occupation</span>
          <span className="font-semibold" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  )
}

function TransferRow({ t, tab, onStatusChange }: { t: Transfer; tab: 'ENTRANT' | 'SORTANT'; onStatusChange: (id: number, status: string) => void }) {
  const hosp = tab === 'ENTRANT' ? t.originHospital : t.destinationHospital
  return (
    <tr className="border-b border-[#F3F4F6] hover:bg-[#F0F9FF]">
      <td className="py-3 px-3 text-xs text-[#2563EB] font-medium">{hosp ?? '—'}</td>
      <td className="py-3 px-3 text-xs text-[#374151]">{t.patient?.mrdNumber}</td>
      <td className="py-3 px-3 text-xs text-[#6B7280]">{t.patient?.age} ans</td>
      <td className="py-3 px-3 text-xs text-[#374151] font-medium">{t.patient?.diagnosis}</td>
      <td className="py-3 px-3 text-xs text-[#6B7280]">{formatDateTime(t.scheduledAt)}</td>
      <td className="py-3 px-3"><StatusBadge variant={t.status} /></td>
      <td className="py-3 px-3">
        <select
          value={t.status}
          onChange={e => onStatusChange(t.id, e.target.value)}
          className="text-xs border border-[#D1D5DB] rounded-md px-2 py-1 text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        >
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
          <option value="COMPLET">Complété</option>
        </select>
      </td>
    </tr>
  )
}

export default function Coordonnateur() {
  const qc = useQueryClient()
  const { data: dashboard, isLoading } = useDashboard()
  const { data: summary = [] } = useBedsSummary()
  const { data: stretchers = [] } = useQuery({ queryKey: ['stretchers'], queryFn: fetchWaitingStretchers, refetchInterval: 30_000 })
  const { data: transfers = [] } = useQuery({ queryKey: ['transfers'], queryFn: fetchTransfers, refetchInterval: 30_000 })

  const [tab, setTab] = useState<'ENTRANT' | 'SORTANT'>('ENTRANT')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateTransferPayload>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const filtered = transfers.filter(t => t.transferType === tab)
  const entrantCount = transfers.filter(t => t.transferType === 'ENTRANT').length
  const sortantCount = transfers.filter(t => t.transferType === 'SORTANT').length

  const createMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      setShowModal(false)
      setForm(EMPTY_FORM)
      setFormError('')
    },
    onError: (err: any) => setFormError(err?.response?.data?.error ?? 'Erreur lors de la création'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      import('../api/transfers').then(m => m.updateTransferStatus(id, status)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  })

  function setField(k: keyof CreateTransferPayload, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patientMrd.trim()) { setFormError('MRD patient requis'); return }
    if (!form.scheduledAt) { setFormError('Date prévue requise'); return }
    setFormError('')
    createMutation.mutate(form)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Modal */}
      {showModal && (
        <Modal title="Nouveau transfert / rapatriement" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Type de mouvement</label>
              <div className="flex gap-3">
                {(['ENTRANT', 'SORTANT'] as const).map(t => (
                  <label key={t} className={`flex-1 flex items-center gap-2 border-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${form.transferType === t ? 'border-[#2563EB] bg-blue-50' : 'border-[#E5E7EB]'}`}>
                    <input type="radio" name="type" value={t} checked={form.transferType === t} onChange={() => setField('transferType', t)} className="sr-only" />
                    <span className="text-sm font-medium text-[#374151]">{t === 'ENTRANT' ? '🔄 Rapatriement entrant' : '➡️ Transfert sortant'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Patient MRD */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">No. MRD du patient *</label>
              <input
                value={form.patientMrd}
                onChange={e => setField('patientMrd', e.target.value)}
                placeholder="Ex: MRD-2024-001"
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                required
              />
            </div>

            {/* Hospital fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                  {form.transferType === 'ENTRANT' ? 'Hôpital d\'origine' : 'Hôpital de destination'}
                </label>
                <input
                  value={form.transferType === 'ENTRANT' ? form.originHospital : form.destinationHospital}
                  onChange={e => setField(form.transferType === 'ENTRANT' ? 'originHospital' : 'destinationHospital', e.target.value)}
                  placeholder="Ex: Hôpital Gatineau"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Transport</label>
                <select
                  value={form.transportType}
                  onChange={e => setField('transportType', e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">— Sélectionner —</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Hélicoptère">Hélicoptère</option>
                  <option value="Transport adapté">Transport adapté</option>
                  <option value="Véhicule personnel">Véhicule personnel</option>
                </select>
              </div>
            </div>

            {/* Scheduled at + status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Date / heure prévue *</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setField('scheduledAt', e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Statut initial</label>
                <select
                  value={form.status}
                  onChange={e => setField('status', e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="COMPLET">Complété</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Informations complémentaires…"
                rows={2}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
              />
            </div>

            {formError && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-4 py-2.5 text-sm text-[#DC2626]">{formError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-[#D1D5DB] text-[#374151] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#2563EB] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {createMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Lits disponibles" value={dashboard?.availableBeds ?? 0} subtitle={`sur ${dashboard?.totalBeds ?? 0} total`} icon={<Bed className="w-5 h-5" />} color="blue" />
        <KPICard label="En attente (civière)" value={dashboard?.waitingPatients ?? 0} subtitle="Besoin d'attribution" icon={<Users className="w-5 h-5" />} color="orange" />
        <KPICard label="Critiques" value={dashboard?.highRiskWaiting ?? 0} subtitle="Risque élevé" icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <KPICard label="Congés prévus 24h" value={dashboard?.forecastDischarges24h ?? '—'} subtitle="Lits libérés demain" icon={<TrendingUp className="w-5 h-5" />} color="green" />
      </div>

      {/* Unit Grid */}
      <div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          {summary.slice(0, 4).map(unit => <UnitGridCard key={unit.unit} unit={unit} />)}
        </div>
        <p className="text-center text-xs text-[#9CA3AF] italic">Cliquez sur une unité pour voir les lits en détail</p>
      </div>

      {/* Transfers Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-[#111827]">Transferts & Rapatriements</h2>
            <span className="text-xs text-[#2563EB] font-medium">{entrantCount} rapatriements</span>
            <span className="text-xs text-[#7C3AED] font-medium">{sortantCount} transferts sortants</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#2563EB] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> + Nouveau
          </button>
        </div>

        <div className="flex gap-4 border-b border-[#E5E7EB] mb-4">
          {(['ENTRANT', 'SORTANT'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${tab === t ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
            >
              🔄 {t === 'ENTRANT' ? `Rapatriements entrants (${entrantCount})` : `Transferts sortants (${sortantCount})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-sm">Aucun transfert — cliquez "+ Nouveau" pour en créer un.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['ÉTABLISSEMENT', 'PATIENT', 'ÂGE', 'DIAGNOSTIC', 'ARRIVÉE PRÉVUE', 'STATUT', 'CHANGER STATUT'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[#9CA3AF] font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <TransferRow
                  key={t.id}
                  t={t}
                  tab={tab}
                  onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                />
              ))}
            </tbody>
          </table>
        )}

        {dashboard?.waitingPatients && dashboard.waitingPatients > 0 && (
          <div className="mt-4 bg-[#FEFCE8] border border-[#FDE047] rounded-lg px-4 py-3 text-xs text-[#CA8A04]">
            ⚠️ {dashboard.waitingPatients} patient{dashboard.waitingPatients !== 1 ? 's' : ''} en attente de lit. Vérifiez les disponibilités avant l'arrivée.
          </div>
        )}
      </div>
    </div>
  )
}
