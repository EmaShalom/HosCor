import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { Activity } from 'lucide-react'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      navigate('/vue-ensemble')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? ''
      if (msg.toLowerCase().includes('not activated')) {
        setError(t('login.errorNotActivated'))
      } else if (err?.response?.status === 401) {
        setError(t('login.errorInvalid'))
      } else {
        setError(t('login.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
              <LanguageSwitcher className="border-gray-200 text-gray-400 hover:text-gray-700" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A5F] rounded-2xl mb-4">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827]">{t('common.appName')}</h1>
            <p className="text-sm text-[#6B7280] mt-1">{t('common.appSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder={t('login.usernamePlaceholder')}
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  {t('login.password')}
                </label>
                <Link to="/forgot-password" className="text-xs text-[#2563EB] hover:underline">
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-4 py-3 text-sm text-[#DC2626]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[#6B7280]">
            {t('login.noAccount')}{' '}
            <Link to="/signup" className="text-[#2563EB] font-medium hover:underline">
              {t('login.signUp')}
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#9CA3AF] text-center">{t('login.footer')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
