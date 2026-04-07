import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, Copy, Check } from 'lucide-react'
import { registerUser } from '../api/auth'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function SignUp() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationToken, setValidationToken] = useState('')
  const [copied, setCopied] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError(t('signup.errorMismatch'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await registerUser(form)
      setValidationToken(result.validationToken)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? ''
      if (msg.toLowerCase().includes('username')) {
        setError(t('signup.errorUsernameTaken'))
      } else if (msg.toLowerCase().includes('email')) {
        setError(t('signup.errorEmailTaken'))
      } else {
        setError(t('signup.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(validationToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (validationToken) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#16A34A] rounded-2xl mb-4">
              <Check className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">{t('signup.successTitle')}</h2>
            <p className="text-sm text-[#6B7280] mb-6">{t('signup.successMessage')}</p>

            <div className="text-left mb-4">
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                {t('signup.tokenLabel')}
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#F3F4F6] text-[#111827] text-xs px-3 py-2.5 rounded-lg break-all font-mono">
                  {validationToken}
                </code>
                <button
                  onClick={copyToken}
                  className="p-2.5 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors flex-shrink-0"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#6B7280]" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate(`/validate?token=${validationToken}`)}
              className="w-full bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('signup.validateNow')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6 relative">
            <div className="absolute top-0 right-0">
              <LanguageSwitcher className="border-gray-200 text-gray-400 hover:text-gray-700" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A5F] rounded-2xl mb-4">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#111827]">{t('signup.title')}</h1>
            <p className="text-xs text-[#6B7280] mt-2">{t('signup.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username', label: t('signup.username'), type: 'text', placeholder: t('signup.usernamePlaceholder') },
              { key: 'email', label: t('signup.email'), type: 'email', placeholder: t('signup.emailPlaceholder') },
              { key: 'password', label: t('signup.password'), type: 'password', placeholder: t('signup.passwordPlaceholder') },
              { key: 'confirmPassword', label: t('signup.confirmPassword'), type: 'password', placeholder: t('signup.confirmPlaceholder') },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

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
              {loading ? t('signup.loading') : t('signup.submit')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[#6B7280]">
            {t('signup.alreadyAccount')}{' '}
            <Link to="/login" className="text-[#2563EB] font-medium hover:underline">
              {t('signup.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
