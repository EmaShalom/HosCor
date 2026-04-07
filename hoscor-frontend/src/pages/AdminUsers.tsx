import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { fetchUsers, updateUserRole, toggleUserActive } from '../api/auth'
import Spinner from '../components/common/Spinner'
import { ShieldCheck, UserCheck, UserX } from 'lucide-react'

const ROLES = [
  'ROLE_ADMIN',
  'ROLE_COORDONNATEUR',
  'ROLE_GESTIONNAIRE_LIT',
  'ROLE_URGENCE',
  'ROLE_HYGIENE',
  'ROLE_COMMIS_ETAGE',
  'ROLE_CHEF_UNITE',
]

const UNIT_SPECIFIC_ROLES = ['ROLE_COMMIS_ETAGE', 'ROLE_CHEF_UNITE']

const HOSPITAL_UNITS = ['2N', '3N', '2S', '3S', 'URG', 'CHIR']

const ROLE_BADGE: Record<string, string> = {
  ROLE_ADMIN:            'bg-red-100 text-red-800',
  ROLE_COORDONNATEUR:    'bg-blue-100 text-blue-800',
  ROLE_GESTIONNAIRE_LIT: 'bg-purple-100 text-purple-800',
  ROLE_URGENCE:          'bg-orange-100 text-orange-800',
  ROLE_HYGIENE:          'bg-teal-100 text-teal-800',
  ROLE_COMMIS_ETAGE:     'bg-gray-100 text-gray-800',
  ROLE_CHEF_UNITE:       'bg-indigo-100 text-indigo-800',
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN:            'Administrateur',
  ROLE_COORDONNATEUR:    'Coordonnateur',
  ROLE_GESTIONNAIRE_LIT: 'Gestionnaire de lit',
  ROLE_URGENCE:          'Urgence',
  ROLE_HYGIENE:          'Hygiène & Salubrité',
  ROLE_COMMIS_ETAGE:     'Commis d\'étage',
  ROLE_CHEF_UNITE:       'Chef d\'unité',
}

export default function AdminUsers() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const qc = useQueryClient()
  const [feedback, setFeedback] = useState('')
  const [pendingUnit, setPendingUnit] = useState<Record<number, string>>({})

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchUsers(token!),
    enabled: !!token,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role, unit }: { id: number; role: string; unit?: string }) =>
      updateUserRole(id, role, token!, unit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setFeedback('Rôle mis à jour.')
      setTimeout(() => setFeedback(''), 3000)
    },
    onError: () => setFeedback('Échec de l\'action.'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleUserActive(id, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setFeedback('Statut mis à jour.')
      setTimeout(() => setFeedback(''), 3000)
    },
    onError: () => setFeedback('Échec de l\'action.'),
  })

  const handleRoleChange = (user: any, newRole: string) => {
    const unit = pendingUnit[user.id] ?? user.unit ?? ''
    const needsUnit = UNIT_SPECIFIC_ROLES.includes(newRole)
    roleMutation.mutate({ id: user.id, role: newRole, unit: needsUnit ? unit : undefined })
  }

  const handleUnitChange = (userId: number, unit: string) => {
    setPendingUnit(prev => ({ ...prev, [userId]: unit }))
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            Gestion des utilisateurs
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Gérez les utilisateurs, les rôles et l'état des comptes.</p>
        </div>
        {feedback && (
          <span className="text-xs font-medium text-[#16A34A] bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            {feedback}
          </span>
        )}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              {['Identifiant', 'Courriel', 'Rôle', 'Unité', 'Statut', 'Créé le', 'Actions'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => {
              const needsUnit = UNIT_SPECIFIC_ROLES.includes(user.role)
              const currentUnit = pendingUnit[user.id] ?? user.unit ?? ''
              return (
                <tr key={user.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-medium text-[#111827]">{user.username}</td>
                  <td className="py-3 px-4 text-[#6B7280] text-xs">{user.email ?? '—'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r] ?? r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {needsUnit ? (
                      <select
                        value={currentUnit}
                        onChange={e => handleUnitChange(user.id, e.target.value)}
                        onBlur={() => roleMutation.mutate({ id: user.id, role: user.role, unit: currentUnit })}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      >
                        <option value="">— choisir —</option>
                        {HOSPITAL_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#9CA3AF]">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleMutation.mutate(user.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      {user.active
                        ? <><UserX className="w-3.5 h-3.5" />Désactiver</>
                        : <><UserCheck className="w-3.5 h-3.5" />Activer</>
                      }
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Role reference table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Référence des rôles</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {[
            { role: 'ROLE_ADMIN',            label: 'Administrateur',       desc: 'Accès complet au système, gestion des utilisateurs.' },
            { role: 'ROLE_COORDONNATEUR',    label: 'Coordonnateur',        desc: 'Vue globale, affectations, transferts, admissions, alertes, station matinale.' },
            { role: 'ROLE_GESTIONNAIRE_LIT', label: 'Gestionnaire de lit',  desc: 'Gestion complète des lits (attribution, libération, réservation), station matinale, créer patients.' },
            { role: 'ROLE_URGENCE',          label: 'Urgence',              desc: 'Créer patients, admettre à l\'urgence, attribuer civières, triage.' },
            { role: 'ROLE_HYGIENE',          label: 'Hygiène & Salubrité',  desc: 'Voir et marquer les lits à nettoyer. Accès limité à la page Hygiène + Vue d\'ensemble.' },
            { role: 'ROLE_COMMIS_ETAGE',     label: 'Commis d\'étage',      desc: 'Observateur: voir patients et lits de son unité uniquement. Aucune modification.' },
            { role: 'ROLE_CHEF_UNITE',       label: 'Chef d\'unité',        desc: 'Voir patients/lits de son unité, station matinale (commentaires), proposer transferts, alertes unité.' },
          ].map(({ role, label, desc }) => (
            <div key={role} className="flex items-start gap-3">
              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-700'}`}>
                {label}
              </span>
              <span className="text-[#6B7280]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
