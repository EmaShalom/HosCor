import { format, differenceInMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date: string) =>
  format(new Date(date), 'dd MMM yyyy', { locale: fr })

export const formatDateTime = (date: string) =>
  format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })

export const formatWaitTime = (since: string): { text: string; minutes: number } => {
  const minutes = differenceInMinutes(new Date(), new Date(since))
  if (minutes < 60) return { text: `${minutes} min`, minutes }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return { text: `${hours}h${mins > 0 ? mins + 'min' : ''}`, minutes }
}

export const saturationLevel = (
  rate: number
): 'NORMALE' | 'MODEREE' | 'ELEVEE' | 'CRITIQUE' => {
  if (rate >= 95) return 'CRITIQUE'
  if (rate >= 85) return 'ELEVEE'
  if (rate >= 70) return 'MODEREE'
  return 'NORMALE'
}

export const unitName = (code: string): string =>
  (
    ({
      '2N': 'Cardiologie',
      '3N': 'Néphrologie',
      '2S': 'Soins Intensifs',
      '3S': 'Médecine',
      URG: 'Urgence',
      CHIR: 'Chirurgie',
    }) as Record<string, string>
  )[code] ?? code

export const formatTimeHHMM = (date: Date): string =>
  format(date, 'HH:mm:ss')

export const formatDateFr = (date: Date): string =>
  format(date, "EEEE d MMMM yyyy", { locale: fr })
