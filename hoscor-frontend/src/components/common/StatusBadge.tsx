import clsx from 'clsx'

type BadgeVariant =
  | 'ELEVE'
  | 'MOYEN'
  | 'FAIBLE'
  | 'OCCUPIED'
  | 'AVAILABLE'
  | 'READY'
  | 'CLEANING'
  | 'EN_ATTENTE'
  | 'EN_COURS'
  | 'COMPLET'
  | 'CRITIQUE'
  | 'ELEVEE'
  | 'MODEREE'
  | 'NORMALE'
  | 'ADMITTED'
  | 'CONGEDIE'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  ELEVE: 'bg-red-100 text-red-800 border border-red-200',
  MOYEN: 'bg-orange-100 text-orange-800 border border-orange-200',
  FAIBLE: 'bg-green-100 text-green-800 border border-green-200',
  OCCUPIED: 'bg-blue-100 text-blue-800 border border-blue-200',
  AVAILABLE: 'bg-green-100 text-green-800 border border-green-200',
  READY: 'bg-teal-100 text-teal-800 border border-teal-200',
  CLEANING: 'bg-purple-100 text-purple-800 border border-purple-200',
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  EN_COURS: 'bg-blue-100 text-blue-800 border border-blue-200',
  COMPLET: 'bg-green-100 text-green-800 border border-green-200',
  CRITIQUE: 'bg-red-100 text-red-800 border border-red-200',
  ELEVEE: 'bg-orange-100 text-orange-800 border border-orange-200',
  MODEREE: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  NORMALE: 'bg-green-100 text-green-800 border border-green-200',
  ADMITTED: 'bg-blue-100 text-blue-800 border border-blue-200',
  CONGEDIE: 'bg-gray-100 text-gray-700 border border-gray-200',
}

const BADGE_LABELS: Record<string, string> = {
  ELEVE: 'Élevé',
  MOYEN: 'Moyen',
  FAIBLE: 'Faible',
  OCCUPIED: 'Occupé',
  AVAILABLE: 'Disponible',
  READY: 'Prêt',
  CLEANING: 'Nettoyage',
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  COMPLET: 'Complété',
  CRITIQUE: 'Critique',
  ELEVEE: 'Élevée',
  MODEREE: 'Modérée',
  NORMALE: 'Normale',
  ADMITTED: 'Admis',
  CONGEDIE: 'Congédié',
}

interface Props {
  variant: string
  className?: string
}

export default function StatusBadge({ variant, className }: Props) {
  const style = BADGE_STYLES[variant as BadgeVariant] ?? 'bg-gray-100 text-gray-700'
  const label = BADGE_LABELS[variant] ?? variant

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}
