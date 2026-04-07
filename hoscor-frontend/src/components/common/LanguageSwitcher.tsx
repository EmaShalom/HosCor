import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('fr') ? 'fr' : 'en'

  const toggle = () => i18n.changeLanguage(current === 'fr' ? 'en' : 'fr')

  return (
    <button
      onClick={toggle}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${className}`}
      title="Switch language / Changer de langue"
    >
      {current === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}
