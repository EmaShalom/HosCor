import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, Copy, Check } from 'lucide-react'
import { forgotPassword } from '../api/auth'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await forgotPassword(usernameOrEmail.trim())
      setResetToken(result.resetToken)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? ''
      if (err?.response?.status === 404 || msg.toLowerCase().includes('not found')) {
        setError(t('forgotPassword.errorNotFound'))
      } else {
        setError(t('forgotPassword.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(resetToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (resetToken) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F59E0B] rounded-2xl mb-4">
              <Check className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">{t('forgotPassword.successTitle')}</h2>
            <p className="text-sm text-[#6B7280] mb-6">{t('forgotPassword.successMessage')}</p>

            <div className="text-left mb-4">
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                {t('forgotPassword.tokenLabel')}
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#F3F4F6] text-[#111827] text-xs px-3 py-2.5 rounded-lg break-all font-mono">
                  {resetToken}
                </code>
                <button
                  onClick={copyToken}
                  className="p-2.5 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#6B7280]" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate(`/reset-password?token=${resetToken}`)}
              className="w-full bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('forgotPassword.resetNow')}
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
            <h1 className="text-xl font-bold text-[#111827]">{t('forgotPassword.title')}</h1>
            <p className="text-sm text-[#6B7280] mt-2">{t('forgotPassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                {t('forgotPassword.usernameOrEmail')}
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder={t('forgotPassword.placeholder')}
                required
                autoFocus
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
              {loading ? t('forgotPassword.loading') : t('forgotPassword.submit')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-[#6B7280] hover:text-[#374151]">
              ← {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
