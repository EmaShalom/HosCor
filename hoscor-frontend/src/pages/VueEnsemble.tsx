import { useDashboard } from '../hooks/useDashboard'
import KPICard from '../components/common/KPICard'
import Spinner from '../components/common/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Bed, Users, AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react'

const UNIT_COLORS: Record<string, string> = {
  '2N': '#2563EB',
  '2S': '#EF4444',
  '3N': '#7C3AED',
  '3S': '#16A34A',
  URG: '#EA580C',
  CHIR: '#0D9488',
}

const UNIT_FULL_NAMES: Record<string, string> = {
  '2N': '2e Nord — Cardiologie',
  '3N': '3e Nord — Néphrologie',
  '2S': '2e Sud — Soins intensifs',
  '3S': '3e Sud — Médecine gén.',
  URG: 'Urgence',
  CHIR: 'Chirurgie',
}

export default function VueEnsemble() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  if (isLoading) return <Spinner />
  if (isError) {
    const status = (error as any)?.response?.status
    const hint = !status
      ? 'Le serveur backend ne répond pas. Vérifiez qu\'il est démarré sur le port 8080.'
      : status === 401 || status === 403
      ? 'Session expirée. Veuillez vous reconnecter.'
      : `Erreur serveur (HTTP ${status}). Consultez les logs du backend.`
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-semibold text-[#111827]">Impossible de charger le tableau de bord</p>
        <p className="text-xs text-[#6B7280] max-w-sm">{hint}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 text-xs font-medium bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const overview = data

  const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const weeklyData = (data?.weeklyAdmissions ?? []).map(pt => ({
    day: DAY_LABELS[new Date(pt.day + 'T00:00:00').getDay()],
    admissions: pt.admissions
  }))
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.admissions, 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          label="Taux d'occupation"
          value={`${overview?.occupancyRate?.toFixed(0) ?? 0}%`}
          subtitle={`${overview?.occupiedBeds ?? 0} / ${overview?.totalBeds ?? 0} lits occupés`}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          label="En attente de lit"
          value={overview?.waitingPatients ?? 0}
          subtitle="Civières urgence"
          icon={<Users className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          label="Risque élevé"
          value={overview?.highRiskWaiting ?? 0}
          subtitle="Patients critiques"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <KPICard
          label="Congés cette semaine"
          value={19}
          subtitle="Lits libérés"
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          label="Durée moy. séjour"
          value="6.4j"
          subtitle="Médiane: 5 jours"
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Unit Occupancy */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#111827]">Occupation par unité</h2>
              <span className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-1 rounded-full font-medium">
                {overview?.perUnit?.length ?? 0} unités
              </span>
            </div>
            <div className="space-y-3">
              {(overview?.perUnit ?? []).map(unit => {
                const color = UNIT_COLORS[unit.unit] ?? '#6B7280'
                const label = UNIT_FULL_NAMES[unit.unit] ?? unit.name
                const pct = unit.total > 0 ? Math.round((unit.occupied / unit.total) * 100) : 0
                return (
                  <div key={unit.unit}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#374151] font-medium">{label}</span>
                      <span className="text-[#6B7280]">{unit.occupied} / {unit.total}</span>
                    </div>
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main Diagnoses */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Diagnostics principaux</h2>
            <div className="space-y-3">
              {(data?.diagnosisMix ?? []).map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#374151] font-medium">{d.label}</span>
                    <span className="text-[#6B7280]">{d.count} cas</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Weekly Admissions Chart */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#111827]">Admissions — semaine</h2>
              <span className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-1 rounded-full font-medium">7 jours</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(v: number) => [`${v} admissions`]}
                />
                <Bar dataKey="admissions" fill="#BFDBFE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E5E7EB]">
              <span className="text-xs font-semibold text-[#111827]">Total: <span className="text-lg font-bold">{weeklyTotal}</span></span>
            </div>
          </div>

          {/* Weekly Results */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Résultats — semaine</h2>
            <div className="space-y-3">
              {[
                { label: 'Congé / DISCHARGE', pct: 87, color: '#2563EB' },
                { label: 'Décès / EXPIRY', pct: 7, color: '#DC2626' },
                { label: 'DAMA', pct: 6, color: '#EA580C' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-xs text-[#374151] w-40 font-medium">{r.label}</span>
                  <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                  </div>
                  <span className="text-xs font-semibold text-[#374151] w-8 text-right">{r.pct}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-[#FEFCE8] border border-[#FDE047] rounded-lg px-4 py-3">
              <p className="text-xs text-[#CA8A04]">
                ⚠️ DAMA = Départ contre avis médical. 6% à surveiller — risque de réadmission élevé.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
