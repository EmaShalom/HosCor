import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDashboard } from '../hooks/useDashboard'
import { useBedsSummary } from '../hooks/useBeds'
import { fetchTransfers } from '../api/transfers'
import { fetchAdmittedPatients, fetchWaitingStretchers } from '../api/patients'
import { fetchShiftReport, type ShiftReportData } from '../api/dashboard'
import KPICard from '../components/common/KPICard'
import { FileText, Download, Eye, Clock } from 'lucide-react'

const REPORTS = [
  {
    id: 1, title: 'Rapport journalier des lits', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#2563EB',
    description: 'Tous les lits par unité: occupés, disponibles, nettoyage. Taux d\'occupation global et par étage.',
    generated: 'aujourd\'hui 07:30', format: 'PDF · ~2 pages', icon: '🛏', dataKey: 'beds',
  },
  {
    id: 2, title: 'Rapport des admissions', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#2563EB',
    description: 'Liste journalière des admissions: urgence, planifiées, rapatriements. Diagnostic, unité, heure d\'arrivée.',
    generated: 'aujourd\'hui 07:31', format: 'PDF · ~3 pages', icon: '📋', dataKey: 'patients',
  },
  {
    id: 3, title: 'Rapport des congés', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#2563EB',
    description: 'Congés signés du jour. Patient, unité, diagnostic, durée de séjour, résultat.',
    generated: 'aujourd\'hui 07:32', format: 'PDF · ~2 pages', icon: '✅', dataKey: 'patients',
  },
  {
    id: 4, title: 'Rapport patients en attente', frequency: 'Temps réel', freqColor: '#7C3AED', freqBg: '#F3E8FF', borderColor: '#EA580C',
    description: 'Patients sur civière en attente de lit. Durée d\'attente, diagnostic, priorité, unité cible.',
    generated: 'maintenant', format: 'PDF · ~2 pages', icon: '⏳', dataKey: 'stretchers',
  },
  {
    id: 5, title: 'Rapport transferts & rapatriements', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#2563EB',
    description: 'Tous les mouvements inter-établissements: rapatriements entrants, transferts sortants, statuts.',
    generated: 'aujourd\'hui 07:33', format: 'PDF · ~3 pages', icon: '🔄', dataKey: 'transfers',
  },
  {
    id: 6, title: 'Rapport patients critiques', frequency: 'Temps réel', freqColor: '#7C3AED', freqBg: '#F3E8FF', borderColor: '#DC2626',
    description: 'Patients à risque élevé (score ≥ 4). Données biologiques critiques, diagnostics, prédiction IA.',
    generated: 'maintenant', format: 'PDF · ~4 pages', icon: '🔴', dataKey: 'stretchers',
  },
  {
    id: 7, title: 'Rapport hebdomadaire d\'occupation', frequency: 'Hebdomadaire', freqColor: '#CA8A04', freqBg: '#FEF9C3', borderColor: '#16A34A',
    description: 'Taux d\'occupation par unité sur 7 jours. Courbes, pics de saturation, vs semaine précédente.',
    generated: 'lundi 07:00', format: 'PDF · ~6 pages', icon: '📊', dataKey: 'beds',
  },
  {
    id: 8, title: 'Rapport hygiène & salubrité', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#2563EB',
    description: 'Suivi nettoyage: lits traités, délai de rotation, commentaires équipe.',
    generated: 'aujourd\'hui 07:34', format: 'PDF · ~2 pages', icon: '🧹', dataKey: 'beds',
  },
  {
    id: 9, title: 'Rapport IA & prédictions', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#7C3AED',
    description: 'Prédictions durée de séjour, risques de réadmission, alertes saturation 48h, recommandations IA.',
    generated: 'aujourd\'hui 07:35', format: 'PDF · ~5 pages', icon: '🤖', dataKey: 'patients',
  },
  {
    id: 10, title: 'Rapport station matinale', frequency: 'Quotidien', freqColor: '#2563EB', freqBg: '#DBEAFE', borderColor: '#2563EB',
    description: 'Résumé matinal: occupation, congés planifiés, transferts, points d\'attention du jour.',
    generated: 'aujourd\'hui 08:00', format: 'PDF · ~3 pages', icon: '☀️', dataKey: 'beds',
  },
  {
    id: 11, title: 'Rapport DAMA & réadmissions', frequency: 'Hebdomadaire', freqColor: '#CA8A04', freqBg: '#FEF9C3', borderColor: '#16A34A',
    description: 'Patients partis contre avis médical. Suivi des réadmissions à 7 et 30 jours.',
    generated: 'lundi 07:00', format: 'PDF · ~4 pages', icon: '⚠️', dataKey: 'patients',
  },
  {
    id: 12, title: 'Rapport complet de la semaine', frequency: 'Hebdomadaire', freqColor: '#CA8A04', freqBg: '#FEF9C3', borderColor: '#16A34A',
    description: 'Rapport hebdomadaire consolidé complet: tous les indicateurs, graphiques, tendances.',
    generated: 'vendredi 17:00', format: 'PDF · ~12 pages', icon: '📑', dataKey: 'beds',
  },
]

type ReportData = {
  beds: ReturnType<typeof useBedsSummary>['data']
  patients: Awaited<ReturnType<typeof fetchAdmittedPatients>>
  stretchers: Awaited<ReturnType<typeof fetchWaitingStretchers>>
  transfers: Awaited<ReturnType<typeof fetchTransfers>>
  dashboard: ReturnType<typeof useDashboard>['data']
}

function buildReportHtml(report: typeof REPORTS[number], data: ReportData): string {
  const now = new Date().toLocaleString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const styles = `
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; font-size: 13px; }
    h1 { font-size: 20px; color: #1E3A5F; margin-bottom: 4px; }
    .subtitle { color: #6B7280; font-size: 12px; margin-bottom: 24px; }
    h2 { font-size: 14px; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #F3F4F6; text-align: left; padding: 8px 12px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 12px; border-bottom: 1px solid #F3F4F6; }
    tr:nth-child(even) td { background: #F9FAFB; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .red { background: #FEE2E2; color: #DC2626; }
    .yellow { background: #FEF3C7; color: #92400E; }
    .green { background: #DCFCE7; color: #16A34A; }
    .blue { background: #DBEAFE; color: #2563EB; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
    .kpi { border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
    .kpi-value { font-size: 28px; font-weight: 700; color: #1E3A5F; }
    .kpi-label { font-size: 11px; color: #6B7280; margin-top: 4px; }
    footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; }
  `

  const { beds = [], patients = [], stretchers = [], transfers = [], dashboard } = data

  let content = ''

  // KPI summary always shown
  content += `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-value">${dashboard?.totalBeds ?? 0}</div><div class="kpi-label">Total lits</div></div>
      <div class="kpi"><div class="kpi-value">${dashboard?.occupiedBeds ?? 0}</div><div class="kpi-label">Occupés</div></div>
      <div class="kpi"><div class="kpi-value">${dashboard?.availableBeds ?? 0}</div><div class="kpi-label">Disponibles</div></div>
      <div class="kpi"><div class="kpi-value">${dashboard?.occupancyRate?.toFixed(1) ?? 0}%</div><div class="kpi-label">Taux d'occupation</div></div>
    </div>
  `

  if (report.dataKey === 'beds') {
    content += `
      <h2>Résumé par unité</h2>
      <table>
        <thead><tr><th>Unité</th><th>Total</th><th>Occupés</th><th>Disponibles</th><th>Nettoyage</th><th>Taux</th></tr></thead>
        <tbody>
          ${beds.map(u => `
            <tr>
              <td><strong>${u.unit}</strong> — ${u.name}</td>
              <td>${u.total}</td>
              <td>${u.occupied}</td>
              <td>${u.available}</td>
              <td>${u.cleaning}</td>
              <td><span class="badge ${u.rate >= 95 ? 'red' : u.rate >= 85 ? 'yellow' : 'green'}">${u.rate?.toFixed(0) ?? 0}%</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  if (report.dataKey === 'patients') {
    content += `
      <h2>Patients hospitalisés (${patients.length})</h2>
      <table>
        <thead><tr><th>MRD</th><th>Nom</th><th>Âge</th><th>Diagnostic</th><th>Unité</th><th>Lit</th><th>Statut</th></tr></thead>
        <tbody>
          ${patients.map(p => `
            <tr>
              <td>${p.mrdNumber}</td>
              <td>${p.firstName} ${p.lastName}</td>
              <td>${p.age} ans</td>
              <td>${p.diagnosis}</td>
              <td>${p.unit ?? '—'}</td>
              <td>${p.bedNumber ?? '—'}</td>
              <td><span class="badge ${p.status === 'ADMITTED' ? 'blue' : 'green'}">${p.status === 'ADMITTED' ? 'Hospitalisé' : 'Congédié'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  if (report.dataKey === 'stretchers') {
    content += `
      <h2>Patients sur civière en attente (${stretchers.length})</h2>
      <table>
        <thead><tr><th>Civière</th><th>MRD</th><th>Patient</th><th>Diagnostic</th><th>Risque</th><th>Unité cible</th></tr></thead>
        <tbody>
          ${stretchers.map(s => `
            <tr>
              <td>${s.stretcherNumber}</td>
              <td>${s.patient?.mrdNumber ?? '—'}</td>
              <td>${s.patient?.firstName ?? ''} ${s.patient?.lastName ?? ''}</td>
              <td>${s.patient?.diagnosis ?? '—'}</td>
              <td><span class="badge ${s.riskLevel === 'ELEVE' ? 'red' : s.riskLevel === 'MOYEN' ? 'yellow' : 'green'}">${s.riskLevel}</span></td>
              <td>${s.targetUnit ?? '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  if (report.dataKey === 'transfers') {
    content += `
      <h2>Transferts & Rapatriements (${transfers.length})</h2>
      <table>
        <thead><tr><th>Type</th><th>Patient</th><th>Provenance / Destination</th><th>Transport</th><th>Prévu</th><th>Statut</th></tr></thead>
        <tbody>
          ${transfers.map(t => `
            <tr>
              <td><span class="badge ${t.transferType === 'ENTRANT' ? 'blue' : 'badge'}" style="background:#F3E8FF;color:#7C3AED">${t.transferType === 'ENTRANT' ? '↓ Entrant' : '↑ Sortant'}</span></td>
              <td>${t.patient?.firstName ?? ''} ${t.patient?.lastName ?? ''}</td>
              <td>${t.transferType === 'ENTRANT' ? (t.originHospital ?? '—') : (t.destinationHospital ?? '—')}</td>
              <td>${t.transportType ?? '—'}</td>
              <td>${new Date(t.scheduledAt).toLocaleString('fr-CA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td><span class="badge ${t.status === 'COMPLET' ? 'green' : t.status === 'EN_COURS' ? 'blue' : 'yellow'}">${t.status === 'COMPLET' ? 'Complété' : t.status === 'EN_COURS' ? 'En cours' : 'En attente'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${report.title} — HosCor</title>
      <style>${styles}</style>
    </head>
    <body>
      <h1>${report.icon} ${report.title}</h1>
      <p class="subtitle">Application de gestion hospitalière · Généré le ${now}</p>
      ${content}
      <div class="footer">HosCor — Système de coordination hospitalière · Confidentiel · ${now}</div>
    </body>
    </html>
  `
}

function buildShiftReportHtml(report: ShiftReportData): string {
  const now = new Date().toLocaleString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const styles = `
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; font-size: 13px; }
    h1 { font-size: 20px; color: #1E3A5F; margin-bottom: 4px; }
    .subtitle { color: #6B7280; font-size: 12px; margin-bottom: 24px; }
    h2 { font-size: 14px; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #F3F4F6; text-align: left; padding: 8px 12px; font-size: 11px; color: #6B7280; text-transform: uppercase; }
    td { padding: 8px 12px; border-bottom: 1px solid #F3F4F6; }
    tr:nth-child(even) td { background: #F9FAFB; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .red { background: #FEE2E2; color: #DC2626; }
    .yellow { background: #FEF3C7; color: #92400E; }
    .green { background: #DCFCE7; color: #16A34A; }
    .blue { background: #DBEAFE; color: #2563EB; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
    .kpi { border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
    .kpi-value { font-size: 28px; font-weight: 700; color: #1E3A5F; }
    .kpi-label { font-size: 11px; color: #6B7280; margin-top: 4px; }
    footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; }
    .empty { color: #9CA3AF; font-style: italic; padding: 12px 0; }
  `

  const riskBadge = (r?: string) => {
    if (r === 'ELEVE')  return `<span class="badge red">ÉLEVÉ</span>`
    if (r === 'MOYEN')  return `<span class="badge yellow">MOYEN</span>`
    return `<span class="badge green">FAIBLE</span>`
  }

  const statusBadge = (s?: string) => {
    if (s === 'COMPLET')   return `<span class="badge green">Complété</span>`
    if (s === 'EN_COURS')  return `<span class="badge blue">En cours</span>`
    return `<span class="badge yellow">En attente</span>`
  }

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('fr-CA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Rapport de quart — HosCor</title><style>${styles}</style></head>
<body>
  <h1>🕐 Rapport de quart — ${report.shiftLabel}</h1>
  <p class="subtitle">Application de gestion hospitalière · Date: ${report.date} · Période: ${report.startTime} → ${report.endTime} · Généré le ${now}</p>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">${report.admissionCount}</div><div class="kpi-label">Admissions</div></div>
    <div class="kpi"><div class="kpi-value">${report.dischargeCount}</div><div class="kpi-label">Congés</div></div>
    <div class="kpi"><div class="kpi-value">${report.transferCount}</div><div class="kpi-label">Transferts</div></div>
    <div class="kpi"><div class="kpi-value">${report.waitingCount}</div><div class="kpi-label">En attente (civière)</div></div>
  </div>

  <h2>Admissions durant le quart (${report.admissionCount})</h2>
  ${report.admissions.length === 0 ? '<p class="empty">Aucune admission durant ce quart.</p>' : `
  <table>
    <thead><tr><th>MRD</th><th>Patient</th><th>Âge</th><th>Diagnostic</th><th>Unité</th><th>Lit</th><th>Heure</th></tr></thead>
    <tbody>
      ${report.admissions.map(p => `
        <tr>
          <td>${p.mrdNumber ?? '—'}</td>
          <td>${p.firstName ?? ''} ${p.lastName ?? ''}</td>
          <td>${p.age ?? '—'} ans</td>
          <td>${p.diagnosis ?? '—'}</td>
          <td>${p.unit ?? '—'}</td>
          <td>${p.bedNumber ?? '—'}</td>
          <td>${fmtDate(p.admissionDate)}</td>
        </tr>`).join('')}
    </tbody>
  </table>`}

  <h2>Congés durant le quart (${report.dischargeCount})</h2>
  ${report.discharges.length === 0 ? '<p class="empty">Aucun congé durant ce quart.</p>' : `
  <table>
    <thead><tr><th>MRD</th><th>Patient</th><th>Âge</th><th>Diagnostic</th><th>Unité</th><th>Heure</th><th>Raison</th></tr></thead>
    <tbody>
      ${report.discharges.map(p => `
        <tr>
          <td>${p.mrdNumber ?? '—'}</td>
          <td>${p.firstName ?? ''} ${p.lastName ?? ''}</td>
          <td>${p.age ?? '—'} ans</td>
          <td>${p.diagnosis ?? '—'}</td>
          <td>${p.unit ?? '—'}</td>
          <td>${fmtDate(p.dischargeDate)}</td>
          <td>${p.dischargeReason ?? '—'}</td>
        </tr>`).join('')}
    </tbody>
  </table>`}

  <h2>Transferts durant le quart (${report.transferCount})</h2>
  ${report.transfers.length === 0 ? '<p class="empty">Aucun transfert durant ce quart.</p>' : `
  <table>
    <thead><tr><th>Type</th><th>Patient</th><th>Provenance / Destination</th><th>Transport</th><th>Heure</th><th>Statut</th></tr></thead>
    <tbody>
      ${report.transfers.map(t => `
        <tr>
          <td>${t.transferType === 'ENTRANT' ? '↓ Entrant' : '↑ Sortant'}</td>
          <td>${t.firstName ?? ''} ${t.lastName ?? ''} (${t.mrdNumber ?? '—'})</td>
          <td>${t.transferType === 'ENTRANT' ? (t.originHospital ?? '—') : (t.destinationHospital ?? '—')}</td>
          <td>${t.transportType ?? '—'}</td>
          <td>${fmtDate(t.scheduledAt)}</td>
          <td>${statusBadge(t.status)}</td>
        </tr>`).join('')}
    </tbody>
  </table>`}

  <h2>Civières en attente au moment du rapport (${report.waitingCount})</h2>
  ${report.waitingPatients.length === 0 ? '<p class="empty">Aucun patient en attente sur civière.</p>' : `
  <table>
    <thead><tr><th>Civière</th><th>MRD</th><th>Patient</th><th>Âge</th><th>Diagnostic</th><th>Risque</th><th>Attente (min)</th><th>Unité cible</th></tr></thead>
    <tbody>
      ${report.waitingPatients.map(s => `
        <tr>
          <td>${s.stretcherNumber ?? '—'}</td>
          <td>${s.mrdNumber ?? '—'}</td>
          <td>${s.firstName ?? ''} ${s.lastName ?? ''}</td>
          <td>${s.age ?? '—'} ans</td>
          <td>${s.diagnosis ?? '—'}</td>
          <td>${riskBadge(s.riskLevel)}</td>
          <td>${s.waitMinutes ?? '—'}</td>
          <td>${s.targetUnit ?? '—'}</td>
        </tr>`).join('')}
    </tbody>
  </table>`}

  <footer>HosCor — Système de coordination hospitalière · Confidentiel · ${now}</footer>
</body>
</html>`
}

export default function CentreRapports() {
  const { data: dashboard } = useDashboard()
  const { data: beds = [] } = useBedsSummary()
  const { data: patients = [] } = useQuery({ queryKey: ['patients-admitted'], queryFn: fetchAdmittedPatients })
  const { data: stretchers = [] } = useQuery({ queryKey: ['stretchers'], queryFn: fetchWaitingStretchers })
  const { data: transfers = [] } = useQuery({ queryKey: ['transfers'], queryFn: fetchTransfers })

  const [shiftDate, setShiftDate]       = useState(new Date().toISOString().slice(0, 10))
  const [shiftType, setShiftType]       = useState<'DAY' | 'EVENING' | 'NIGHT'>('DAY')
  const [shiftLoading, setShiftLoading] = useState(false)
  const [shiftError, setShiftError]     = useState<string | null>(null)

  async function handleShiftReport(preview: boolean) {
    setShiftLoading(true)
    setShiftError(null)
    try {
      const data = await fetchShiftReport(shiftDate, shiftType)
      const html = buildShiftReportHtml(data)
      const win = window.open('', '_blank')
      if (!win) { setShiftError('Le navigateur a bloqué la fenêtre pop-up.'); return }
      win.document.write(html)
      win.document.close()
      win.focus()
      if (!preview) setTimeout(() => win.print(), 500)
    } catch {
      setShiftError('Impossible de générer le rapport. Vérifiez la connexion au serveur.')
    } finally {
      setShiftLoading(false)
    }
  }

  function handleDownload(report: typeof REPORTS[number]) {
    const html = buildReportHtml(report, { beds, patients, stretchers, transfers, dashboard })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
    }, 500)
  }

  function handlePreview(report: typeof REPORTS[number]) {
    const html = buildReportHtml(report, { beds, patients, stretchers, transfers, dashboard })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Rapports disponibles" value={13} subtitle="Types de rapports" icon={<FileText className="w-5 h-5" />} color="blue" />
        <KPICard label="Générés aujourd'hui" value={4} subtitle="PDFs produits" icon={<Download className="w-5 h-5" />} color="green" />
        <KPICard label="Patients hospitalisés" value={patients.length} subtitle="En ce moment" icon={<Eye className="w-5 h-5" />} color="orange" />
        <KPICard label="Lits couverts" value={beds.reduce((a, u) => a + u.total, 0)} subtitle="Tous les unités" icon={<FileText className="w-5 h-5" />} color="purple" />
      </div>

      {/* Shift Report */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm" style={{ borderLeftWidth: 4, borderLeftColor: '#7C3AED' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#7C3AED]" />
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Rapport de quart</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Activités complètes d'un quart de travail: admissions, congés, transferts, civières</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ color: '#7C3AED', backgroundColor: '#F3E8FF' }}>
            Interactif
          </span>
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="text-xs font-medium text-[#374151] block mb-1">Date du quart</label>
            <input
              type="date"
              value={shiftDate}
              onChange={e => setShiftDate(e.target.value)}
              className="text-sm border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#374151] block mb-1">Quart de travail</label>
            <select
              value={shiftType}
              onChange={e => setShiftType(e.target.value as 'DAY' | 'EVENING' | 'NIGHT')}
              className="text-sm border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            >
              <option value="DAY">Quart de jour (08:00–16:00)</option>
              <option value="EVENING">Quart de soir (16:00–00:00)</option>
              <option value="NIGHT">Quart de nuit (00:00–08:00)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleShiftReport(false)}
              disabled={shiftLoading}
              className="bg-[#7C3AED] text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              {shiftLoading ? 'Génération...' : 'Télécharger PDF'}
            </button>
            <button
              onClick={() => handleShiftReport(true)}
              disabled={shiftLoading}
              className="text-xs text-[#6B7280] hover:text-[#374151] px-3 py-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Aperçu
            </button>
          </div>
        </div>

        {shiftError && (
          <p className="text-xs text-red-600 mt-3 flex items-center gap-1">
            ⚠️ {shiftError}
          </p>
        )}
      </div>

      {/* Reports grid */}
      <div className="grid grid-cols-3 gap-4">
        {REPORTS.map(report => (
          <div
            key={report.id}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col"
            style={{ borderLeftWidth: 4, borderLeftColor: report.borderColor }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{report.icon}</span>
                <h3 className="text-sm font-semibold text-[#111827] leading-tight">{report.title}</h3>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                style={{ color: report.freqColor, backgroundColor: report.freqBg }}
              >
                {report.frequency}
              </span>
            </div>

            <p className="text-xs text-[#6B7280] flex-1 mb-3">{report.description}</p>

            <div className="text-xs text-[#9CA3AF] mb-3 space-y-0.5">
              <div>📄 Dernier généré: {report.generated}</div>
              <div>📄 Format: {report.format}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(report)}
                className="flex-1 bg-[#2563EB] text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger PDF
              </button>
              <button
                onClick={() => handlePreview(report)}
                className="text-xs text-[#6B7280] hover:text-[#374151] px-3 py-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Aperçu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
