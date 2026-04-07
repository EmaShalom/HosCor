import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTransfers, updateTransferStatus, createTransfer, CreateTransferPayload } from '../api/transfers'
import { fetchAdmittedPatients } from '../api/patients'
import KPICard from '../components/common/KPICard'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import { RefreshCw, ArrowDownCircle, ArrowUpCircle, Bed, CheckCircle, X, Plus } from 'lucide-react'
import { formatDateTime } from '../utils/format'
import { Transfer, Patient } from '../types'

type Tab = 'ENTRANT' | 'SORTANT'

const BORDER_BY_STATUS: Record<string, string> = {
  EN_COURS: 'border-l-[#2563EB] bg-white',
  EN_ATTENTE: 'border-l-[#DC2626] bg-[#FFF5F5]',
  COMPLET: 'border-l-[#16A34A] bg-[#F0FDF4]',
}

const STATUS_NEXT: Record<string, { label: string; next: string; color: string }> = {
  EN_ATTENTE: { label: 'Marquer En cours', next: 'EN_COURS', color: 'bg-[#2563EB] text-white hover:bg-blue-700' },
  EN_COURS:   { label: 'Marquer Complété', next: 'COMPLET',  color: 'bg-[#16A34A] text-white hover:bg-green-700' },
}

function Modal({ title, onClose, children, wide = false }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} p-6 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#111827]">{title}</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827] p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Detail modal ────────────────────────────────────────────────────────────

function TransferDetailModal({ t, onClose }: { t: Transfer; onClose: () => void }) {
  const qc = useQueryClient()
  const hosp = t.transferType === 'ENTRANT' ? t.originHospital : t.destinationHospital
  const hospLabel = t.transferType === 'ENTRANT' ? 'Établissement d\'origine' : 'Établissement de destination'

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTransferStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      onClose()
    },
  })

  const next = STATUS_NEXT[t.status]

  return (
    <Modal title="Dossier de transfert" onClose={onClose} wide>
      <div className="space-y-4">
        {/* Status + type */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.transferType === 'ENTRANT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-700'}`}>
            {t.transferType === 'ENTRANT' ? '↓ Rapatriement entrant' : '↑ Transfert sortant'}
          </span>
          <StatusBadge variant={t.status} />
        </div>

        {/* Patient info */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Patient</div>
          <div className="text-sm font-bold text-[#111827]">
            {t.patient?.firstName} {t.patient?.lastName}
          </div>
          <div className="text-xs text-[#6B7280] mt-0.5">
            {t.patient?.mrdNumber} · {t.patient?.age} ans · {t.patient?.gender === 'M' ? 'Homme' : 'Femme'}
          </div>
          <div className="text-xs font-medium text-[#374151] mt-1">{t.patient?.diagnosis}</div>
        </div>

        {/* Transfer details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="border border-[#E5E7EB] rounded-lg p-3">
            <div className="text-[#9CA3AF] uppercase font-semibold mb-1">{hospLabel}</div>
            <div className="text-[#111827] font-medium">{hosp ?? '—'}</div>
          </div>
          <div className="border border-[#E5E7EB] rounded-lg p-3">
            <div className="text-[#9CA3AF] uppercase font-semibold mb-1">Transport</div>
            <div className="text-[#111827] font-medium">{t.transportType ?? '—'}</div>
          </div>
          <div className="border border-[#E5E7EB] rounded-lg p-3">
            <div className="text-[#9CA3AF] uppercase font-semibold mb-1">Date / Heure prévue</div>
            <div className="text-[#111827] font-medium">{formatDateTime(t.scheduledAt)}</div>
          </div>
          <div className="border border-[#E5E7EB] rounded-lg p-3">
            <div className="text-[#9CA3AF] uppercase font-semibold mb-1">Statut actuel</div>
            <StatusBadge variant={t.status} />
          </div>
        </div>

        {t.notes && (
          <div className="bg-[#F9FAFB] rounded-lg px-4 py-3 text-xs text-[#6B7280]">
            <span className="font-semibold text-[#374151]">Notes:</span> {t.notes}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-[#D1D5DB] text-[#374151] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors">
            Fermer
          </button>
          {next && (
            <button
              onClick={() => statusMutation.mutate({ id: t.id, status: next.next })}
              disabled={statusMutation.isPending}
              className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 ${next.color}`}
            >
              {statusMutation.isPending ? 'Mise à jour…' : next.label}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── New transfer modal ──────────────────────────────────────────────────────

function NewTransferModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: patients = [] } = useQuery({ queryKey: ['admitted'], queryFn: fetchAdmittedPatients })

  const [form, setForm] = useState({
    patientMrd: '', transferType: 'ENTRANT' as 'ENTRANT' | 'SORTANT',
    originHospital: '', destinationHospital: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    transportType: '', notes: '', status: 'EN_ATTENTE',
  })
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateTransferPayload = {
        patientMrd: form.patientMrd,
        transferType: form.transferType,
        scheduledAt: form.scheduledAt,
        status: form.status,
        transportType: form.transportType || undefined,
        notes: form.notes || undefined,
        originHospital: form.transferType === 'ENTRANT' ? (form.originHospital || undefined) : undefined,
        destinationHospital: form.transferType === 'SORTANT' ? (form.destinationHospital || undefined) : undefined,
      }
      return createTransfer(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      onClose()
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Erreur lors de la création'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.patientMrd) { setError('Sélectionnez un patient.'); return }
    mutation.mutate()
  }

  const inp = "w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
  const lbl = "block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5"

  return (
    <Modal title="Nouveau mouvement de transfert" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className={lbl}>Type de mouvement</label>
          <div className="flex gap-3">
            {(['ENTRANT', 'SORTANT'] as const).map(t => (
              <button
                key={t} type="button"
                onClick={() => set('transferType', t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border-2 transition-colors ${form.transferType === t ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]' : 'border-[#E5E7EB] text-[#6B7280]'}`}
              >
                {t === 'ENTRANT' ? '↓ Rapatriement entrant' : '↑ Transfert sortant'}
              </button>
            ))}
          </div>
        </div>

        {/* Patient */}
        <div>
          <label className={lbl}>Patient (MRD)</label>
          <select value={form.patientMrd} onChange={e => set('patientMrd', e.target.value)} className={inp}>
            <option value="">— Sélectionner un patient —</option>
            {patients.map(p => (
              <option key={p.mrdNumber} value={p.mrdNumber}>
                {p.mrdNumber} — {p.firstName} {p.lastName} ({p.diagnosis})
              </option>
            ))}
          </select>
        </div>

        {/* Hospital */}
        <div>
          <label className={lbl}>{form.transferType === 'ENTRANT' ? 'Établissement d\'origine' : 'Établissement de destination'}</label>
          <input
            type="text"
            value={form.transferType === 'ENTRANT' ? form.originHospital : form.destinationHospital}
            onChange={e => set(form.transferType === 'ENTRANT' ? 'originHospital' : 'destinationHospital', e.target.value)}
            placeholder="Nom de l'hôpital..."
            className={inp}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div>
            <label className={lbl}>Date et heure prévue</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} className={inp} />
          </div>
          {/* Transport */}
          <div>
            <label className={lbl}>Type de transport</label>
            <select value={form.transportType} onChange={e => set('transportType', e.target.value)} className={inp}>
              <option value="">— Sélectionner —</option>
              <option>Ambulance</option>
              <option>Ambulance soins critiques</option>
              <option>Transport médicalisé</option>
              <option>Transport adapté</option>
              <option>Véhicule personnel</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={lbl}>Statut initial</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="COMPLET">Complété</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={lbl}>Notes (optionnel)</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Informations complémentaires…" className={`${inp} resize-none`} />
        </div>

        {error && <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-4 py-2.5 text-sm text-[#DC2626]">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-[#D1D5DB] text-[#374151] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 bg-[#2563EB] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Création…' : 'Créer le mouvement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Transfer card ───────────────────────────────────────────────────────────

function TransferCard({ t, onView, onStatusChange }: {
  t: Transfer
  onView: () => void
  onStatusChange: (id: number, status: string) => void
}) {
  const borderClass = BORDER_BY_STATUS[t.status] ?? 'border-l-gray-300 bg-white'
  const hosp = t.transferType === 'ENTRANT' ? t.originHospital : t.destinationHospital
  const hospLabel = t.transferType === 'ENTRANT' ? 'Établissement d\'origine' : 'Établissement de destination'
  const next = STATUS_NEXT[t.status]

  return (
    <div className={`border border-[#E5E7EB] border-l-4 ${borderClass} rounded-xl p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.transferType === 'ENTRANT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-700'}`}>
            {t.transferType === 'ENTRANT' ? '↓ Rapatriement' : '↑ Transfert sortant'}
          </span>
          <StatusBadge variant={t.status} />
        </div>
        <button
          onClick={onView}
          className="text-xs font-medium text-[#2563EB] hover:underline px-3 py-1.5 border border-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors"
        >
          Voir dossier
        </button>
      </div>

      <div>
        <div className="text-sm font-semibold text-[#111827]">
          {t.patient?.firstName} {t.patient?.lastName}
        </div>
        <div className="text-xs text-[#6B7280]">
          {t.patient?.mrdNumber} · {t.patient?.gender === 'M' ? 'Homme' : 'Femme'} {t.patient?.age} ans
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-[#9CA3AF] uppercase font-semibold tracking-wide mb-1">{hospLabel}</div>
          <div className="text-[#111827] font-medium">{hosp ?? '—'}</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] uppercase font-semibold tracking-wide mb-1">Diagnostic</div>
          <div className="text-[#111827] font-medium">{t.patient?.diagnosis}</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] uppercase font-semibold tracking-wide mb-1">Transport</div>
          <div className="text-[#111827] font-medium">{t.transportType ?? '—'}</div>
        </div>
        <div>
          <div className="text-[#9CA3AF] uppercase font-semibold tracking-wide mb-1">Arrivée prévue</div>
          <div className={`font-semibold ${t.status === 'EN_ATTENTE' ? 'text-[#DC2626]' : 'text-[#111827]'}`}>
            {formatDateTime(t.scheduledAt)}
          </div>
        </div>
      </div>

      {t.notes && (
        <div className="bg-[#F9FAFB] rounded-lg px-4 py-3 text-xs text-[#6B7280] italic">
          📄 {t.notes}
        </div>
      )}

      {t.status === 'EN_ATTENTE' && (
        <div className="bg-[#FEE2E2] rounded-lg px-4 py-3 text-xs text-[#DC2626]">
          🔴 Action requise — vérifiez la disponibilité des lits avant l'arrivée.
        </div>
      )}

      {/* Status progression buttons */}
      {next && (
        <div className="flex justify-end">
          <button
            onClick={() => onStatusChange(t.id, next.next)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${next.color}`}
          >
            {next.label}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Transferts() {
  const [tab, setTab] = useState<Tab>('ENTRANT')
  const [showNew, setShowNew] = useState(false)
  const [viewingTransfer, setViewingTransfer] = useState<Transfer | null>(null)
  const qc = useQueryClient()

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: fetchTransfers,
    refetchInterval: 30_000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTransferStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  })

  const entrants = transfers.filter(t => t.transferType === 'ENTRANT')
  const sortants = transfers.filter(t => t.transferType === 'SORTANT')
  const litsAReserver = entrants.filter(t => t.status === 'EN_ATTENTE').length
  const litsLiberés = sortants.filter(t => t.status === 'COMPLET').length
  const filtered = tab === 'ENTRANT' ? entrants : sortants

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {showNew && <NewTransferModal onClose={() => setShowNew(false)} />}
      {viewingTransfer && <TransferDetailModal t={viewingTransfer} onClose={() => setViewingTransfer(null)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Rapatriements entrants" value={entrants.length} subtitle="Cette semaine" icon={<ArrowDownCircle className="w-5 h-5" />} color="blue" />
        <KPICard label="Transferts sortants" value={sortants.length} subtitle="Vers d'autres établissements" icon={<ArrowUpCircle className="w-5 h-5" />} color="purple" />
        <KPICard label="Lits à réserver" value={litsAReserver} subtitle="Action urgente requise" icon={<Bed className="w-5 h-5" />} color="red" />
        <KPICard label="Lits libérés / soirée" value={litsLiberés} subtitle="Suite transfert sortant" icon={<CheckCircle className="w-5 h-5" />} color="green" />
      </div>

      {/* Main section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#2563EB]" />
            Transferts & Rapatriements inter-établissements
          </h2>
          <button
            onClick={() => setShowNew(true)}
            className="bg-[#2563EB] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau mouvement
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E7EB] mb-2">
          {(['ENTRANT', 'SORTANT'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === t ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
            >
              {t === 'ENTRANT' ? `↓ Rapatriements entrants (${entrants.length})` : `↑ Transferts sortants (${sortants.length})`}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#9CA3AF] italic mb-5">
          {tab === 'ENTRANT'
            ? 'Patients rapatriés d\'autres établissements — lit à réserver avant l\'arrivée'
            : 'Patients transférés vers d\'autres établissements de soins'}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#6B7280] text-sm">
            Aucun {tab === 'ENTRANT' ? 'rapatriement' : 'transfert sortant'} enregistré
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(t => (
              <TransferCard
                key={t.id}
                t={t}
                onView={() => setViewingTransfer(t)}
                onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
