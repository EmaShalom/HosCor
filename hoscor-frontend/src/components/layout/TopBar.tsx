import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import LanguageSwitcher from '../common/LanguageSwitcher'

const PAGE_TITLES: Record<string, string> = {
  'vue-ensemble': "Vue d'Ensemble",
  coordonnateur: 'Coordonnateur',
  transferts: 'Transferts & Rapatriements',
  admissions: 'Admissions & Dossiers',
  urgence: 'Urgence',
  'gestion-lits': 'Gestion des Lits',
  'affichage-etage': 'Affichage Étage',
  hygiene: 'Hygiène & Salubrité',
  'station-matinale': 'Station Matinale',
  'ia-predictions': 'IA & Prédictions',
  rapports: 'Centre de Rapports',
  'admin-users': 'Gestion des Utilisateurs',
}

export default function TopBar() {
  const [time, setTime] = useState(new Date())
  const location = useLocation()

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const segment = location.pathname.replace('/', '')
  const pageTitle = PAGE_TITLES[segment] ?? 'CisssCoord'

  const timeStr = format(time, 'HH:mm:ss')
  const dateStr = format(time, "EEEE d MMMM yyyy", { locale: fr })

  return (
    <div className="h-14 bg-white shadow-sm flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
      <div className="flex items-center gap-4 text-gray-500 text-sm">
        <LanguageSwitcher className="border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400" />
        <div className="flex items-center gap-2">
          <Clock size={15} />
          <span className="font-mono font-medium text-gray-700">{timeStr}</span>
          <span className="text-gray-400 mx-1">|</span>
          <span className="capitalize">{dateStr}</span>
        </div>
      </div>
    </div>
  )
}
