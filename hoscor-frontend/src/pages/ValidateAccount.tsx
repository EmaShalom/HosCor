import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, CheckCircle } from 'lucide-react'
import { validateAccount } from '../api/auth'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function ValidateAccount() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [token, setToken] = useState(params.get('token') ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await validateAccount(token.trim())
      setSuccess(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setError(t('validate.errorInvalid'))
      } else {
        setError(t('validate.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#16A34A] rounded-2xl mb-4">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">{t('validate.successTitle')}</h2>
            <p className="text-sm text-[#6B7280] mb-6">{t('validate.successMessage')}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('validate.goToLogin')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6 relative">
            <div className="absolute top-0 right-0">
              <LanguageSwitcher className="border-gray-200 text-gray-400 hover:text-gray-700" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A5F] rounded-2xl mb-4">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#111827]">{t('validate.title')}</h1>
            <p className="text-sm text-[#6B7280] mt-2">{t('validate.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                {t('validate.token')}
              </label>
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
                placeholder={t('validate.tokenPlaceholder')}
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
              {loading ? t('validate.loading') : t('validate.submit')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-[#6B7280] hover:text-[#374151]">
              ← {t('login.title')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
