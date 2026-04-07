import { useQuery } from '@tanstack/react-query'
import { useDashboard } from '../hooks/useDashboard'
import KPICard from '../components/common/KPICard'
import Spinner from '../components/common/Spinner'
import { Brain, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import { fetchDeteriorationRisk } from '../api/dashboard'
import type { AtRiskPatient } from '../types'

const RISK_PALETTE = {
  high:   { hex: '#DC2626', cls: 'bg-[#DC2626]' },
  medium: { hex: '#CA8A04', cls: 'bg-[#CA8A04]' },
  low:    { hex: '#16A34A', cls: 'bg-[#16A34A]' },
} as const

function riskLevel(score: number): keyof typeof RISK_PALETTE {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

const scoreColor = (score: number) => RISK_PALETTE[riskLevel(score)].hex
const scoreDot   = (score: number) => RISK_PALETTE[riskLevel(score)].cls

export default function IAPredictions() {
  const { data: dashboard, isLoading } = useDashboard()
  const { data: predictions = [] } = useQuery<AtRiskPatient[]>({
    queryKey: ['deterioration-risk'],
    queryFn: fetchDeteriorationRisk,
    refetchInterval: 60_000,
  })

  if (isLoading) return <Spinner />

  const topPatient = predictions[0]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Durée séjour prédite" value="6.8j" subtitle="Modèle HDHI (15 757 patients)" icon={<Brain className="w-5 h-5" />} color="purple" />
        <KPICard label="Risque réadmission" value="18%" subtitle="Patients DAMA à risque" icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <KPICard label="Saturation 48h" value="3e N" subtitle={`${dashboard?.highRiskWaiting ?? 0} patients à risque en attente`} icon={<TrendingUp className="w-5 h-5" />} color="orange" />
        <KPICard label="Fiabilité IA" value="82%" subtitle="Basée sur 56 variables" icon={<CheckCircle className="w-5 h-5" />} color="green" />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Alerts + Recommendations */}
        <div className="space-y-4">
          {/* Critical alerts */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#2563EB] rounded-full inline-block" />
              Alertes critiques
            </h2>
            <div className="space-y-3">
              {dashboard?.highRiskWaiting && dashboard.highRiskWaiting > 0 && (
                <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-lg px-4 py-3 text-xs text-[#374151]">
                  <div className="font-semibold text-[#DC2626] mb-1">🔴 Risque de saturation</div>
                  Occupation actuelle élevée + {dashboard.highRiskWaiting} patients à risque en attente.
                  Prévision: saturation dans les 24h.
                </div>
              )}
              {predictions.filter(p => p.riskScore >= 70).slice(0, 2).map(p => (
                <div key={p.mrdNumber} className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-lg px-4 py-3 text-xs text-[#374151]">
                  <div className="font-semibold text-[#DC2626] mb-1">🔴 Détérioration imminente — {p.unit ?? '—'}</div>
                  {p.firstName} {p.lastName} ({p.diagnosis}, {p.age} ans) — score {p.riskScore}/100.
                  {p.reasons.length > 0 && <> {p.reasons[0]}.</>}
                </div>
              ))}
              {predictions.filter(p => p.riskScore >= 40 && p.riskScore < 70).slice(0, 1).map(p => (
                <div key={p.mrdNumber} className="bg-[#FFFBEB] border-l-4 border-[#F59E0B] rounded-lg px-4 py-3 text-xs text-[#374151]">
                  <div className="font-semibold text-[#CA8A04] mb-1">🟡 Risque modéré — {p.unit ?? '—'}</div>
                  {p.firstName} {p.lastName} ({p.diagnosis}, {p.age} ans) — score {p.riskScore}/100.
                </div>
              ))}
              {dashboard?.criticalAlerts === 0 && predictions.length === 0 && (
                <p className="text-xs text-[#6B7280] py-2">Aucune alerte critique détectée.</p>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Recommandations IA</h2>
            <div className="space-y-3">
              <div className="bg-[#F0FDF4] border-l-4 border-[#16A34A] rounded-lg px-4 py-3 text-xs text-[#374151]">
                <div className="font-semibold text-[#16A34A] mb-1">🎯 Prioriser attribution lit immédiate</div>
                {topPatient
                  ? `${topPatient.firstName} ${topPatient.lastName} (${topPatient.diagnosis}, ${topPatient.age} ans, score ${topPatient.riskScore}/100) — attribution recommandée en priorité.`
                  : 'Aucun patient prioritaire identifié pour le moment.'}
              </div>
              <div className="bg-[#EFF6FF] border-l-4 border-[#2563EB] rounded-lg px-4 py-3 text-xs text-[#374151]">
                <div className="font-semibold text-[#2563EB] mb-1">🔄 Transfert interne — 3e Nord → 3e Sud</div>
                Patients IRA stabilisés en Néphro pourraient être transférés en Méd. gén.
                pour libérer de la capacité.
              </div>
              <div className="bg-[#F5F3FF] border-l-4 border-[#7C3AED] rounded-lg px-4 py-3 text-xs text-[#374151]">
                <div className="font-semibold text-[#7C3AED] mb-1">📅 {dashboard?.forecastDischarges24h ?? '—'} congés prévus — alerter l'hygiène</div>
                Alerter l'équipe d'hygiène dès 10h00 pour préparer les lits.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Individual predictions */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">Prédictions individuelles — patients à risque</h2>
          <div className="space-y-1">
            {predictions.length === 0
              ? <p className="text-xs text-[#6B7280] py-4 text-center">Aucun patient à risque identifié.</p>
              : predictions.map((p, i) => (
                  <div key={p.mrdNumber} className={`py-3 ${i < predictions.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${scoreDot(p.riskScore)}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#111827] truncate">
                            {p.mrdNumber} · {p.age} ans · {p.unit ?? '—'}
                          </div>
                          <div className="text-xs text-[#6B7280] mt-0.5">
                            {p.diagnosis ?? '—'} · Score: {p.riskScore}/100
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                            {p.reasons.slice(0, 2).join(' · ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-bold ml-3 flex-shrink-0" style={{ color: scoreColor(p.riskScore) }}>
                        {p.riskScore}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
