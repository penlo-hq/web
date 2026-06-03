import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'
import { AuthLayout, AuthFooterLink, Button, Input } from '../components/ui'

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
      } else if (status === 429 || detail === 'rate_limit_exceeded') {
        setError('Too many attempts. Wait a few minutes and try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your company"
      subtitle="Set up your Enterprise Brain and create an admin account."
    >
      <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
        <Input type="text" value={form.company_name} onChange={set('company_name')} placeholder="Company name" required autoFocus />
        <Input type="text" value={form.admin_name} onChange={set('admin_name')} placeholder="Your name" required />
        <Input type="email" value={form.admin_email} onChange={set('admin_email')} placeholder="Email" required />
        <Input type="password" value={form.admin_password} onChange={set('admin_password')} placeholder="Password (min 12 characters)" required minLength={12} />
        {error && <p className="text-caption-sm text-destructive bg-destructive-tint px-3 py-2 rounded-card">{error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
          {loading ? 'Creating…' : 'Create company'}
        </Button>
        <div className="text-center">
          <AuthFooterLink to="/login">Back to sign in</AuthFooterLink>
        </div>
      </form>
    </AuthLayout>
  )
}
