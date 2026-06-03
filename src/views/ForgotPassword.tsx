import { useState } from 'react'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { authApi } from '../lib/api/endpoints'
import { AuthLayout, AuthFooterLink } from '../components/ui'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
    } catch {
      /* swallow — always show success for anti-enumeration */
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Check your inbox"
        footer={<AuthFooterLink to="/login">Back to sign in</AuthFooterLink>}
      >
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-success-tint flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            If <span className="text-text-primary font-medium">{email}</span> has a Penlo account,
            a password reset link is on its way. The link expires in 30 minutes.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={<AuthFooterLink to="/login">Back to sign in</AuthFooterLink>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
              autoComplete="email"
              className="input-field pl-10"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 rounded-xl bg-accent text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-60 transition-colors focus-ring"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}
