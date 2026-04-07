import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdmittedPatients, fetchPatient, createPatient, updatePatient, addToStretcher
} from '../api/patients'
import { fetchUnitBeds, assignBed } from '../api/beds'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import { Search, Edit3, Save, X, UserPlus, AlertTriangle } from 'lucide-react'
import { formatDate } from '../utils/format'
import { Patient, Bed } from '../types'

type Tab = 'create' | 'edit' | 'urgence' | 'etage'

const UNIT_BADGE: Record<string, string> = {
  '2N': 'bg-blue-600 text-white', '3N': 'bg-purple-600 text-white',
  '2S': 'bg-red-600 text-white', '3S': 'bg-green-600 text-white',
  URG: 'bg-orange-600 text-white', CHIR: 'bg-teal-600 text-white',
}

const UNITS = ['2N', '2S', '3N', '3S', 'URG', 'CHIR']

const EMPTY_PATIENT = { mrdNumber: '', firstName: '', lastName: '', age: '', gender: 'M', diagnosis: '' }

// ─── Shared sub-components ──────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', required = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
    />
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
    >
      {children}
    </select>
  )
}

function SuccessBox({ message }: { message: string }) {
  return <div className="bg-[#F0FDF4] border border-green-200 rounded-xl px-4 py-3 text-sm text-[#16A34A] font-medium">✓ {message}</div>
}

function ErrorBox({ message }: { message: string }) {
  return <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl px-4 py-3 text-sm text-[#DC2626]">{message}</div>
}

// ─── Tab: Create patient record ──────────────────────────────────────────────

function CreateRecordTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_PATIENT)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const mutation = useMutation({
    mutationFn: () => createPatient({
      mrdNumber: form.mrdNumber, firstName: form.firstName, lastName: form.lastName,
      age: Number(form.age), gender: form.gender, diagnosis: form.diagnosis,
      status: 'ADMITTED',
    }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['admitted'] })
      setSuccess(`Dossier créé: ${p.firstName} ${p.lastName} (${p.mrdNumber})`)
      setForm(EMPTY_PATIENT)
      setError('')
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Erreur lors de la création'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.mrdNumber || !form.firstName || !form.lastName || !form.age || !form.diagnosis) {
      setError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <p className="text-xs text-[#6B7280]">Créez un nouveau dossier patient avant l'admission.</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="No. MRD *"><Input value={form.mrdNumber} onChange={v => set('mrdNumber', v)} placeholder="MRD-2025-001" required /></Field>
        <Field label="Âge *"><Input value={form.age} onChange={v => set('age', v)} placeholder="45" type="number" required /></Field>
        <Field label="Prénom *"><Input value={form.firstName} onChange={v => set('firstName', v)} placeholder="Jean" required /></Field>
        <Field label="Nom *"><Input value={form.lastName} onChange={v => set('lastName', v)} placeholder="Dupont" required /></Field>
        <Field label="Sexe">
          <Select value={form.gender} onChange={v => set('gender', v)}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </Select>
        </Field>
      </div>
      <Field label="Diagnostic principal *">
        <Input value={form.diagnosis} onChange={v => set('diagnosis', v)} placeholder="Ex: INSUFFISANCE CARDIAQUE" required />
      </Field>
      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}
      <button type="submit" disabled={mutation.isPending} className="bg-[#2563EB] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
        <UserPlus className="w-4 h-4" />{mutation.isPending ? 'Création…' : 'Créer le dossier'}
      </button>
    </form>
  )
}

// ─── Tab: Edit patient record ────────────────────────────────────────────────

function EditRecordTab() {
  const qc = useQueryClient()
  const { data: patients = [], isLoading } = useQuery({ queryKey: ['admitted'], queryFn: fetchAdmittedPatients, refetchInterval: 30_000 })
  const [mrdSearch, setMrdSearch] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [editForm, setEditForm] = useState<Partial<Patient>>({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const filtered = patients.filter(p => {
    if (mrdSearch && !p.mrdNumber.toLowerCase().includes(mrdSearch.toLowerCase())) return false
    if (nameSearch && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(nameSearch.toLowerCase())) return false
    if (unitFilter && p.unit !== unitFilter) return false
    return true
  })

  function startEdit(p: Patient) {
    setEditingPatient(p)
    setEditForm({ firstName: p.firstName, lastName: p.lastName, diagnosis: p.diagnosis, unit: p.unit ?? '', bedNumber: p.bedNumber ?? '' })
    setSuccess(''); setError('')
  }

  const mutation = useMutation({
    mutationFn: () => updatePatient(editingPatient!.mrdNumber, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admitted'] })
      setSuccess('Dossier mis à jour.')
      setEditingPatient(null)
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Erreur lors de la mise à jour'),
  })

  if (editingPatient) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setEditingPatient(null)} className="text-xs text-[#6B7280] hover:text-[#374151] flex items-center gap-1"><X className="w-3.5 h-3.5" /> Retour</button>
          <span className="text-sm font-semibold text-[#111827]">Modifier — {editingPatient.mrdNumber}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom"><Input value={editForm.firstName ?? ''} onChange={v => setEditForm(f => ({ ...f, firstName: v }))} /></Field>
          <Field label="Nom"><Input value={editForm.lastName ?? ''} onChange={v => setEditForm(f => ({ ...f, lastName: v }))} /></Field>
        </div>
        <Field label="Diagnostic"><Input value={editForm.diagnosis ?? ''} onChange={v => setEditForm(f => ({ ...f, diagnosis: v }))} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unité">
            <Select value={editForm.unit ?? ''} onChange={v => setEditForm(f => ({ ...f, unit: v }))}>
              <option value="">— Sélectionner —</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="No. lit"><Input value={editForm.bedNumber ?? ''} onChange={v => setEditForm(f => ({ ...f, bedNumber: v }))} placeholder="Ex: 2N-07" /></Field>
        </div>
        {error && <ErrorBox message={error} />}
        {success && <SuccessBox message={success} />}
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-[#2563EB] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" />{mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input value={mrdSearch} onChange={e => setMrdSearch(e.target.value)} placeholder="No. MRD"
          className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-44" />
        <input value={nameSearch} onChange={e => setNameSearch(e.target.value)} placeholder="Nom / Prénom"
          className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] flex-1" />
        <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)}
          className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
          <option value="">Toutes unités</option>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      {isLoading ? <Spinner /> : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['MRD', 'ÂGE / SEXE', 'DIAGNOSTIC', 'UNITÉ · LIT', 'ADMISSION', 'STATUT', 'ACTION'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[#9CA3AF] font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#6B7280]">Aucun patient trouvé</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} className={`border-b border-[#F3F4F6] hover:bg-[#F0F9FF] ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''}`}>
                <td className="py-2.5 px-3 font-medium text-[#374151]">{p.mrdNumber}</td>
                <td className="py-2.5 px-3 text-[#6B7280]">{p.age}a · {p.gender === 'M' ? 'H' : 'F'}</td>
                <td className="py-2.5 px-3 text-[#374151] font-medium">{p.diagnosis}</td>
                <td className="py-2.5 px-3">
                  {p.unit && <span className={`text-xs font-bold px-2 py-0.5 rounded ${UNIT_BADGE[p.unit] ?? 'bg-gray-600 text-white'}`}>{p.unit}</span>}
                  {p.bedNumber && <span className="text-[#6B7280] ml-1">Lit {p.bedNumber}</span>}
                </td>
                <td className="py-2.5 px-3 text-[#6B7280]">{formatDate(p.admissionDate)}</td>
                <td className="py-2.5 px-3"><StatusBadge variant={p.status} /></td>
                <td className="py-2.5 px-3">
                  <button onClick={() => startEdit(p)} className="bg-[#2563EB] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Tab: Emergency admission ─────────────────────────────────────────────────

function UrgenceTab() {
  const qc = useQueryClient()
  const [step, setStep] = useState<'find' | 'triage' | 'done'>('find')
  const [mrd, setMrd] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_PATIENT)
  const [riskLevel, setRiskLevel] = useState<'ELEVE' | 'MOYEN' | 'FAIBLE'>('MOYEN')
  const [targetUnit, setTargetUnit] = useState('')
  const [error, setError] = useState('')

  async function lookupOrCreate() {
    if (!mrd.trim()) return
    setLookupError(''); setCreateMode(false)
    try {
      const p = await fetchPatient(mrd.trim())
      setPatient(p); setStep('triage')
    } catch {
      setLookupError('Patient introuvable. Vous pouvez créer le dossier ci-dessous.')
      setCreateMode(true)
      setNewForm(f => ({ ...f, mrdNumber: mrd.trim() }))
    }
  }

  const createMutation = useMutation({
    mutationFn: () => createPatient({
      mrdNumber: newForm.mrdNumber, firstName: newForm.firstName, lastName: newForm.lastName,
      age: Number(newForm.age), gender: newForm.gender, diagnosis: newForm.diagnosis, status: 'ADMITTED',
    }),
    onSuccess: (p) => { setPatient(p); setStep('triage'); setCreateMode(false); setLookupError('') },
    onError: (err: any) => setLookupError(err?.response?.data?.error ?? 'Erreur lors de la création'),
  })

  const stretcherMutation = useMutation({
    mutationFn: () => addToStretcher(patient!.mrdNumber, riskLevel, targetUnit || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stretchers'] }); setStep('done') },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Erreur lors de l\'admission'),
  })

  if (step === 'done') {
    return (
      <div className="max-w-sm space-y-4">
        <SuccessBox message={`${patient?.firstName} ${patient?.lastName} admis(e) à l'urgence sur civière.`} />
        <p className="text-xs text-[#6B7280]">Le patient apparaît maintenant dans la file d'attente Urgence. Vous pouvez lui attribuer un lit depuis la page Urgence.</p>
        <button onClick={() => { setStep('find'); setMrd(''); setPatient(null); setError('') }}
          className="text-sm text-[#2563EB] font-medium hover:underline">
          + Nouvelle admission urgence
        </button>
      </div>
    )
  }

  if (step === 'triage' && patient) {
    return (
      <div className="max-w-sm space-y-4">
        <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4">
          <div className="text-sm font-bold text-[#111827]">{patient.firstName} {patient.lastName}</div>
          <div className="text-xs text-[#6B7280] mt-1">{patient.mrdNumber} · {patient.age} ans · {patient.diagnosis}</div>
        </div>
        <Field label="Niveau de risque (triage)">
          <div className="flex gap-2">
            {(['ELEVE', 'MOYEN', 'FAIBLE'] as const).map(r => (
              <button key={r} onClick={() => setRiskLevel(r)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-colors ${riskLevel === r
                  ? r === 'ELEVE' ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]'
                    : r === 'MOYEN' ? 'border-[#CA8A04] bg-[#FEF9C3] text-[#CA8A04]'
                    : 'border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]'
                  : 'border-[#E5E7EB] text-[#6B7280]'}`}>
                {r === 'ELEVE' ? '🔴 ÉLEVÉ' : r === 'MOYEN' ? '🟡 MOYEN' : '🟢 FAIBLE'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Unité cible (optionnel)">
          <Select value={targetUnit} onChange={setTargetUnit}>
            <option value="">— À déterminer —</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
        {error && <ErrorBox message={error} />}
        <div className="flex gap-3">
          <button onClick={() => setStep('find')} className="flex-1 border border-[#D1D5DB] text-sm text-[#374151] py-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors">Retour</button>
          <button onClick={() => stretcherMutation.mutate()} disabled={stretcherMutation.isPending}
            className="flex-1 bg-[#DC2626] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />{stretcherMutation.isPending ? 'Admission…' : 'Admettre à l\'urgence'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm space-y-4">
      <p className="text-xs text-[#6B7280]">Recherchez le dossier patient ou créez-en un nouveau si le patient n'est pas encore enregistré.</p>
      <Field label="No. MRD du patient">
        <div className="flex gap-2">
          <Input value={mrd} onChange={setMrd} placeholder="MRD-2024-001" />
          <button onClick={lookupOrCreate} className="px-3 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </Field>
      {lookupError && <div className="text-xs text-[#DC2626]">{lookupError}</div>}
      {createMode && (
        <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[#374151]">Créer un nouveau dossier patient :</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *"><Input value={newForm.firstName} onChange={v => setNewForm(f => ({ ...f, firstName: v }))} placeholder="Jean" /></Field>
            <Field label="Nom *"><Input value={newForm.lastName} onChange={v => setNewForm(f => ({ ...f, lastName: v }))} placeholder="Dupont" /></Field>
            <Field label="Âge *"><Input value={newForm.age} onChange={v => setNewForm(f => ({ ...f, age: v }))} placeholder="45" type="number" /></Field>
            <Field label="Sexe">
              <Select value={newForm.gender} onChange={v => setNewForm(f => ({ ...f, gender: v }))}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
          </div>
          <Field label="Diagnostic"><Input value={newForm.diagnosis} onChange={v => setNewForm(f => ({ ...f, diagnosis: v }))} placeholder="Ex: TRAUMATISME" /></Field>
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="w-full bg-[#374151] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {createMutation.isPending ? 'Création…' : 'Créer et continuer'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Floor admission ─────────────────────────────────────────────────────

function EtageTab() {
  const qc = useQueryClient()
  const [step, setStep] = useState<'find' | 'bed' | 'done'>('find')
  const [mrd, setMrd] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_PATIENT)
  const [selectedUnit, setSelectedUnit] = useState('2N')
  const [error, setError] = useState('')

  const { data: beds = [], isLoading: bedsLoading } = useQuery({
    queryKey: ['unit-beds', selectedUnit],
    queryFn: () => fetchUnitBeds(selectedUnit),
    enabled: step === 'bed',
  })

  const availableBeds = beds.filter((b: Bed) => b.state === 'AVAILABLE' || b.state === 'READY')

  async function lookupOrCreate() {
    if (!mrd.trim()) return
    setLookupError(''); setCreateMode(false)
    try {
      const p = await fetchPatient(mrd.trim())
      setPatient(p); setStep('bed')
    } catch {
      setLookupError('Patient introuvable. Vous pouvez créer le dossier ci-dessous.')
      setCreateMode(true)
      setNewForm(f => ({ ...f, mrdNumber: mrd.trim() }))
    }
  }

  const createMutation = useMutation({
    mutationFn: () => createPatient({
      mrdNumber: newForm.mrdNumber, firstName: newForm.firstName, lastName: newForm.lastName,
      age: Number(newForm.age), gender: newForm.gender, diagnosis: newForm.diagnosis, status: 'ADMITTED',
    }),
    onSuccess: (p) => { setPatient(p); setStep('bed'); setCreateMode(false); setLookupError('') },
    onError: (err: any) => setLookupError(err?.response?.data?.error ?? 'Erreur'),
  })

  const assignMutation = useMutation({
    mutationFn: (bedId: number) => assignBed(bedId, patient!.mrdNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unit-beds', selectedUnit] })
      qc.invalidateQueries({ queryKey: ['admitted'] })
      setStep('done')
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Erreur lors de l\'attribution'),
  })

  if (step === 'done') {
    return (
      <div className="max-w-sm space-y-4">
        <SuccessBox message={`${patient?.firstName} ${patient?.lastName} admis(e) à l'étage — lit attribué.`} />
        <button onClick={() => { setStep('find'); setMrd(''); setPatient(null); setError('') }}
          className="text-sm text-[#2563EB] font-medium hover:underline">
          + Nouvelle admission étage
        </button>
      </div>
    )
  }

  if (step === 'bed' && patient) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4">
          <div className="text-sm font-bold text-[#111827]">{patient.firstName} {patient.lastName}</div>
          <div className="text-xs text-[#6B7280] mt-1">{patient.mrdNumber} · {patient.age} ans · {patient.diagnosis}</div>
        </div>

        <Field label="Unité d'admission">
          <div className="flex flex-wrap gap-2">
            {UNITS.map(u => (
              <button key={u} onClick={() => setSelectedUnit(u)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${selectedUnit === u ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'}`}>
                {u}
              </button>
            ))}
          </div>
        </Field>

        <div>
          <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Lits disponibles</label>
          {bedsLoading ? <div className="text-xs text-[#6B7280]">Chargement…</div>
            : availableBeds.length === 0 ? (
              <div className="text-xs text-[#DC2626] bg-[#FEF2F2] rounded-lg px-4 py-3">Aucun lit disponible dans cette unité</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableBeds.map((bed: Bed) => (
                  <button key={bed.id} onClick={() => assignMutation.mutate(bed.id)} disabled={assignMutation.isPending}
                    className="border-2 border-[#D1D5DB] hover:border-[#2563EB] hover:bg-blue-50 rounded-xl p-3 text-left transition-all disabled:opacity-50">
                    <div className="text-xs font-bold text-[#111827]">Lit {bed.bedNumber}</div>
                    <div className={`text-xs mt-1 ${bed.state === 'READY' ? 'text-[#2563EB]' : 'text-[#16A34A]'}`}>
                      {bed.state === 'READY' ? '✓ Prêt' : '✓ Disponible'}
                    </div>
                  </button>
                ))}
              </div>
            )
          }
        </div>

        {error && <ErrorBox message={error} />}
        <button onClick={() => setStep('find')} className="text-xs text-[#6B7280] hover:text-[#374151]">← Retour</button>
      </div>
    )
  }

  return (
    <div className="max-w-sm space-y-4">
      <p className="text-xs text-[#6B7280]">Admettez un patient directement à l'étage sans passer par l'urgence. Le dossier patient doit exister ou sera créé.</p>
      <Field label="No. MRD du patient">
        <div className="flex gap-2">
          <Input value={mrd} onChange={setMrd} placeholder="MRD-2024-001" />
          <button onClick={lookupOrCreate} className="px-3 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </Field>
      {lookupError && <div className="text-xs text-[#DC2626]">{lookupError}</div>}
      {createMode && (
        <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[#374151]">Créer un nouveau dossier patient :</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *"><Input value={newForm.firstName} onChange={v => setNewForm(f => ({ ...f, firstName: v }))} placeholder="Jean" /></Field>
            <Field label="Nom *"><Input value={newForm.lastName} onChange={v => setNewForm(f => ({ ...f, lastName: v }))} placeholder="Dupont" /></Field>
            <Field label="Âge *"><Input value={newForm.age} onChange={v => setNewForm(f => ({ ...f, age: v }))} placeholder="45" type="number" /></Field>
            <Field label="Sexe">
              <Select value={newForm.gender} onChange={v => setNewForm(f => ({ ...f, gender: v }))}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
          </div>
          <Field label="Diagnostic"><Input value={newForm.diagnosis} onChange={v => setNewForm(f => ({ ...f, diagnosis: v }))} placeholder="Ex: FRACTURE" /></Field>
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="w-full bg-[#374151] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {createMutation.isPending ? 'Création…' : 'Créer et continuer'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Admissions() {
  const [tab, setTab] = useState<Tab>('urgence')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'create', label: '📄 Créer un dossier' },
    { id: 'edit', label: '✏️ Modifier un dossier' },
    { id: 'urgence', label: '🚨 Admission Urgence' },
    { id: 'etage', label: '🏥 Admission Étage' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex gap-1 border-b border-[#E5E7EB] mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 px-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'create' && <CreateRecordTab />}
        {tab === 'edit' && <EditRecordTab />}
        {tab === 'urgence' && <UrgenceTab />}
        {tab === 'etage' && <EtageTab />}
      </div>
    </div>
  )
}
