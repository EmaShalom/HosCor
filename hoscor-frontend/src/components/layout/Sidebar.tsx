import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BedDouble,
  ArrowLeftRight,
  ClipboardList,
  Monitor,
  Sparkles,
  Sunrise,
  Brain,
  BarChart2,
  LogOut,
  Activity,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import { ROLES, hasRole } from '../../App'
import type { AppRole } from '../../App'
import clsx from 'clsx'

const now = new Date()
const weekStart = startOfWeek(now, { weekStartsOn: 1 })
const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
const weekLabel = `${format(weekStart, 'd MMM', { locale: fr })} – ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`

// Human-readable role labels
const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN:            'Administrateur',
  ROLE_COORDONNATEUR:    'Coordonnateur',
  ROLE_GESTIONNAIRE_LIT: 'Gestionnaire de lit',
  ROLE_URGENCE:          'Urgence',
  ROLE_HYGIENE:          'Hygiène & Salubrité',
  ROLE_COMMIS_ETAGE:     'Commis d\'étage',
  ROLE_CHEF_UNITE:       'Chef d\'unité',
  // legacy
  ROLE_COORDINATOR:      'Coordonnateur',
  ROLE_NURSE:            'Infirmier(e)',
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  badge?: number
}

function NavItem({ to, icon, label, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 w-full py-2 px-4 text-sm rounded-md transition-colors',
          isActive
            ? 'bg-brand text-white font-medium'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        )
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-danger text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1">
      {label}
    </p>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role ?? ''

  // Only roles with access to alerts load them
  const canSeeAlerts = hasRole(role,
    ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE
  )
  const { data: alerts } = useAlerts()
  const urgenceCount = canSeeAlerts
    ? (alerts?.filter(a => a.unit === 'URG' || a.severity === 'CRITICAL').length ?? 0)
    : 0
  const transferCount = canSeeAlerts
    ? (alerts?.filter(a => a.title?.toLowerCase().includes('transfer')).length ?? 0)
    : 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Helper
  const can = (...roles: AppRole[]) => hasRole(role, ...roles)

  const roleLabel = ROLE_LABELS[role] ?? role
  const unitLabel = user?.unit ? ` — ${user.unit}` : ''

  return (
    <div className="w-[220px] flex-shrink-0 bg-[#1E3A5F] h-full flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="text-brand-light w-5 h-5" />
          <span className="text-white font-bold text-lg tracking-tight">HosCor</span>
        </div>
        <p className="text-white/50 text-xs">Application de gestion hospitalière</p>
        <p className="text-white/30 text-xs mt-1">{weekLabel}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">

        {/* ── Tableaux de bord ── */}
        {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE, ROLES.HYGIENE) && (
          <>
            <SectionLabel label="Tableaux de bord" />
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE, ROLES.HYGIENE) && (
              <NavItem to="/vue-ensemble" icon={<LayoutDashboard size={16} />} label="Vue d'Ensemble" />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR) && (
              <NavItem to="/coordonnateur" icon={<Users size={16} />} label="Coordonnateur" />
            )}
          </>
        )}

        {/* ── Interfaces Métier ── */}
        {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.URGENCE, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE, ROLES.COMMIS_ETAGE, ROLES.HYGIENE) && (
          <>
            <SectionLabel label="Interfaces Métier" />
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE, ROLES.COMMIS_ETAGE) && (
              <NavItem to="/admissions" icon={<ClipboardList size={16} />} label="Admissions & dossiers" />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.URGENCE) && (
              <NavItem to="/urgence" icon={<AlertTriangle size={16} />} label="Urgence" badge={urgenceCount} />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE, ROLES.COMMIS_ETAGE) && (
              <NavItem to="/gestion-lits" icon={<BedDouble size={16} />} label="Gestion des Lits" />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.URGENCE, ROLES.COMMIS_ETAGE, ROLES.CHEF_UNITE) && (
              <NavItem to="/affichage-etage" icon={<Monitor size={16} />} label="Affichage Étage" />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.HYGIENE) && (
              <NavItem to="/hygiene" icon={<Sparkles size={16} />} label="Hygiène & salubrité" />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE) && (
              <NavItem to="/station-matinale" icon={<Sunrise size={16} />} label="Station Matinale" />
            )}
            {can(ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.CHEF_UNITE) && (
              <NavItem to="/transferts" icon={<ArrowLeftRight size={16} />} label="Transferts" badge={transferCount} />
            )}
          </>
        )}


        {/* ── Intelligence ── */}
        {can(ROLES.ADMIN, ROLES.COORDONNATEUR) && (
          <>
            <SectionLabel label="Intelligence" />
            <NavItem to="/ia-predictions" icon={<Brain size={16} />} label="IA & Prédictions" />
            <NavItem to="/rapports" icon={<BarChart2 size={16} />} label="Centre de Rapports" />
          </>
        )}

        {/* ── Administration ── */}
        {can(ROLES.ADMIN) && (
          <>
            <SectionLabel label="Administration" />
            <NavItem to="/admin-users" icon={<Users size={16} />} label="Utilisateurs" />
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-2">
          <p className="text-white text-sm font-medium truncate">{user?.username ?? 'Utilisateur'}</p>
          <span className="inline-block bg-brand/40 text-blue-200 text-xs px-2 py-0.5 rounded-full mt-1">
            {roleLabel}{unitLabel}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors w-full"
        >
          <LogOut size={14} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
