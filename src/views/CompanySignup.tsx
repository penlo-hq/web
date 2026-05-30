import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'

export function CompanySignup() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({ company_name: '', admin_name: '', admin_email: '', admin_password: '' })
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
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="mb-10 animate-reveal">
          <div className="text-[9.5px] uppercase tracking-[0.22em] text-stone mb-2">Penlo</div>
          <h1 className="font-display font-bold text-[28px] tracking-tightest text-ink leading-none">
            Create your company
          </h1>
          <p className="mt-3 text-[14px] text-stone leading-relaxed">
            Set up your Enterprise Brain and create an admin account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal" style={{ animationDelay: '0.05s' }}>
          <input
            type="text"
            value={form.company_name}
            onChange={set('company_name')}
            placeholder="Company name"
            required
            autoFocus
            className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
          />
          <input
            type="text"
            value={form.admin_name}
            onChange={set('admin_name')}
            placeholder="Your name"
            required
            className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
          />
          <input
            type="email"
            value={form.admin_email}
            onChange={set('admin_email')}
            placeholder="Email"
            required
            className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
          />
          <input
            type="password"
            value={form.admin_password}
            onChange={set('admin_password')}
            placeholder="Password (min 12 characters)"
            required
            minLength={12}
            className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
          />
          {error && (
            <p className="text-[13px] text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ink text-white rounded-xl text-[14px] font-medium hover:bg-graphite transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create company'}
          </button>
          <Link
            to="/login"
            className="block text-center text-[12px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
          >
            Back to sign in
          </Link>
        </form>
      </div>
    </div>
  )
}
