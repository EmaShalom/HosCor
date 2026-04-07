import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ValidateAccount from './pages/ValidateAccount'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VueEnsemble from './pages/VueEnsemble'
import Coordonnateur from './pages/Coordonnateur'
import Transferts from './pages/Transferts'
import Admissions from './pages/Admissions'
import Urgence from './pages/Urgence'
import GestionLits from './pages/GestionLits'
import AffichageEtage from './pages/AffichageEtage'
import Hygiene from './pages/Hygiene'
import StationMatinale from './pages/StationMatinale'
import IAPredictions from './pages/IAPredictions'
import CentreRapports from './pages/CentreRapports'
import AdminUsers from './pages/AdminUsers'
import { useAuth } from './hooks/useAuth'

// ─── Role constants ────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:            'ROLE_ADMIN',
  COORDONNATEUR:    'ROLE_COORDONNATEUR',
  GESTIONNAIRE_LIT: 'ROLE_GESTIONNAIRE_LIT',
  URGENCE:          'ROLE_URGENCE',
  HYGIENE:          'ROLE_HYGIENE',
  COMMIS_ETAGE:     'ROLE_COMMIS_ETAGE',
  CHEF_UNITE:       'ROLE_CHEF_UNITE',
} as const

export type AppRole = typeof ROLES[keyof typeof ROLES]

// ─── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

interface RoleRouteProps {
  children: React.ReactNode
  allowed: AppRole[]
  fallback?: string
}

function RoleRoute({ children, allowed, fallback = '/vue-ensemble' }: RoleRouteProps) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!user || !allowed.includes(user.role as AppRole)) {
    return <Navigate to={fallback} replace />
  }
  return <>{children}</>
}

// ─── Role helper used by Sidebar and pages ─────────────────────────────────────
export function hasRole(userRole: string | undefined, ...roles: AppRole[]) {
  return !!userRole && roles.includes(userRole as AppRole)
}

export function isAdmin(role?: string) {
  return role === ROLES.ADMIN
}

export function defaultPageFor(role?: string): string {
  switch (role) {
    case ROLES.HYGIENE:       return '/hygiene'
    case ROLES.COMMIS_ETAGE:  return '/affichage-etage'
    case ROLES.URGENCE:       return '/urgence'
    default:                  return '/vue-ensemble'
  }
}

export default function App() {
  const { user } = useAuth()

  // All roles except HYGIENE and COMMIS_ETAGE see the dashboard
  const dashboardRoles: AppRole[] = [
    ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT,
    ROLES.CHEF_UNITE, ROLES.HYGIENE,
  ]

  const coordRoles: AppRole[] = [ROLES.ADMIN, ROLES.COORDONNATEUR]

  const urgenceRoles: AppRole[] = [ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.URGENCE]

  const gestionLitsRoles: AppRole[] = [
    ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT,
    ROLES.CHEF_UNITE, ROLES.COMMIS_ETAGE,
  ]

  const transfertsRoles: AppRole[] = [
    ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.CHEF_UNITE,
  ]

  const admissionsRoles: AppRole[] = [
    ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT,
    ROLES.CHEF_UNITE, ROLES.COMMIS_ETAGE,
  ]

  const stationRoles: AppRole[] = [
    ROLES.ADMIN, ROLES.COORDONNATEUR, ROLES.GESTIONNAIRE_LIT, ROLES.CHEF_UNITE,
  ]

  const iaRoles: AppRole[] = [ROLES.ADMIN, ROLES.COORDONNATEUR]

  const rapportsRoles: AppRole[] = [ROLES.ADMIN, ROLES.COORDONNATEUR]

  const defaultFallback = defaultPageFor(user?.role)

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/validate" element={<ValidateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={defaultFallback} replace />} />

        <Route
          path="vue-ensemble"
          element={
            <RoleRoute allowed={dashboardRoles} fallback={defaultFallback}>
              <VueEnsemble />
            </RoleRoute>
          }
        />

        <Route
          path="coordonnateur"
          element={
            <RoleRoute allowed={coordRoles} fallback={defaultFallback}>
              <Coordonnateur />
            </RoleRoute>
          }
        />

        <Route
          path="urgence"
          element={
            <RoleRoute allowed={urgenceRoles} fallback={defaultFallback}>
              <Urgence />
            </RoleRoute>
          }
        />

        <Route
          path="gestion-lits"
          element={
            <RoleRoute allowed={gestionLitsRoles} fallback={defaultFallback}>
              <GestionLits />
            </RoleRoute>
          }
        />

        <Route
          path="transferts"
          element={
            <RoleRoute allowed={transfertsRoles} fallback={defaultFallback}>
              <Transferts />
            </RoleRoute>
          }
        />

        <Route
          path="admissions"
          element={
            <RoleRoute allowed={admissionsRoles} fallback={defaultFallback}>
              <Admissions />
            </RoleRoute>
          }
        />

        <Route path="affichage-etage" element={<AffichageEtage />} />

        <Route
          path="hygiene"
          element={
            <RoleRoute allowed={[ROLES.ADMIN, ROLES.HYGIENE]} fallback={defaultFallback}>
              <Hygiene />
            </RoleRoute>
          }
        />

        <Route
          path="station-matinale"
          element={
            <RoleRoute allowed={stationRoles} fallback={defaultFallback}>
              <StationMatinale />
            </RoleRoute>
          }
        />

        <Route
          path="ia-predictions"
          element={
            <RoleRoute allowed={iaRoles} fallback={defaultFallback}>
              <IAPredictions />
            </RoleRoute>
          }
        />

        <Route
          path="rapports"
          element={
            <RoleRoute allowed={rapportsRoles} fallback={defaultFallback}>
              <CentreRapports />
            </RoleRoute>
          }
        />

        <Route
          path="admin-users"
          element={
            <RoleRoute allowed={[ROLES.ADMIN]} fallback={defaultFallback}>
              <AdminUsers />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={defaultFallback} replace />} />
    </Routes>
  )
}
