import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../lib/api/endpoints'
import { extractApiError } from '../lib/api/errors'
import { useAuthStore } from '../store/authStore'
import { AuthLayout, AuthFooterLink, Button } from '../components/ui'

function PasswordStrength({ password }: { password: string }) {
  const len = password.length
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  const score = (len >= 12 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0)

  if (!password) return null
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-destructive', 'bg-warning', 'bg-yellow-400', 'bg-success']
  const textColors = ['text-destructive', 'text-warning', 'text-yellow-600', 'text-success']

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-black/[0.08]'}`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${score > 0 ? textColors[score - 1] : 'text-text-tertiary'}`}>
        {score > 0 ? labels[score - 1] : ''}
        {score < 4 && score > 0 ? ' — use uppercase, numbers, and symbols for a stronger password' : ''}
      </p>
    </div>
  )
}

export function CompanySignup() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({ company_name: '', admin_name: '', admin_email: '', admin_password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await authApi.createCompany({
        company_name: form.company_name.trim(),
        admin_name: form.admin_name.trim(),
        admin_email: form.admin_email.trim().toLowerCase(),
        admin_password: form.admin_password,
      })
      if (data.user) {
        setUser(data.user)
        navigate('/brain/company')
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status: number; data?: { detail?: string } } })?.response?.status
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (status === 403) {
        setError('Company self-signup is not enabled. Contact your administrator.')
      } else if (status === 409 || detail === 'user_exists') {
        setError('An account with that email already exists.')
      } else if (status === 422 && detail === 'weak_password') {
        setError('Password must be at least 12 characters.')
      } else if (status === 429 || detail === 'rate_limit_exceeded') {
        setError('Too many attempts. Wait a few minutes and try again.')
      } else if (status === 400 && detail === 'invalid_company_name') {
        setError('Company name must include at least one letter or number.')
      } else {
        setError(extractApiError(err, 'Something went wrong. Please try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your company"
      subtitle="Set up your Enterprise Brain and create an admin account."
      footer={
        <p>
          Already have an account?{' '}
          <AuthFooterLink to="/login">Sign in</AuthFooterLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="company_name">
            Company name
          </label>
          <input
            id="company_name"
            type="text"
            value={form.company_name}
            onChange={set('company_name')}
            placeholder="Acme Inc."
            required
            autoFocus
            autoComplete="organization"
            className="input-field"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="admin_name">
            Your name
          </label>
          <input
            id="admin_name"
            type="text"
            value={form.admin_name}
            onChange={set('admin_name')}
            placeholder="Jane Smith"
            required
            autoComplete="name"
            className="input-field"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="admin_email">
            Work email
          </label>
          <input
            id="admin_email"
            type="email"
            value={form.admin_email}
            onChange={set('admin_email')}
            placeholder="jane@acme.com"
            required
            autoComplete="email"
            className="input-field"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="admin_password">
            Password
          </label>
          <div className="relative">
            <input
              id="admin_password"
              type={showPassword ? 'text' : 'password'}
              value={form.admin_password}
              onChange={set('admin_password')}
              placeholder="Min 12 characters"
              required
              minLength={12}
              autoComplete="new-password"
              className="input-field pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordStrength password={form.admin_password} />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive-tint">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-[12px] text-destructive leading-tight">{error}</p>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
          {loading ? 'Creating…' : 'Create company'}
        </Button>
      </form>
    </AuthLayout>
  )
}
