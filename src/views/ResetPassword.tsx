import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'
import { AuthLayout, AuthFooterLink } from '../components/ui'

type Status = 'idle' | 'submitting'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const clearUser = useAuthStore((s) => s.clearUser)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError('This reset link is invalid.'); return }
    if (password.length < 12) { setError('Password must be at least 12 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(null)
    setStatus('submitting')
    try {
      const data = await authApi.resetPassword(token, password)
      setUser(data.user)
      navigate('/brain/company')
    } catch (e: unknown) {
      clearUser()
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        detail === 'token_expired' ? 'This reset link has expired. Request a new one.'
        : detail === 'token_already_used' ? 'This reset link has already been used.'
        : detail === 'invalid_token' ? 'This reset link is invalid.'
        : detail === 'weak_password' ? 'Password is too weak. Use at least 12 characters.'
        : typeof detail === 'string' ? detail
        : "Couldn't reset your password."
      setError(msg)
      setStatus('idle')
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" footer={<AuthFooterLink to="/login">Back to sign in</AuthFooterLink>}>
        <div className="space-y-4">
          <p className="text-[14px] text-text-secondary leading-relaxed">
            The link you followed is missing or incomplete. Request a new password reset link to continue.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full h-11 rounded-xl bg-accent text-white font-semibold text-[14px] flex items-center justify-center hover:bg-accent/90 transition-colors"
          >
            Request a new link
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" footer={<AuthFooterLink to="/login">Back to sign in</AuthFooterLink>}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="password">New password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 12 characters"
              minLength={12}
              required
              autoFocus
              autoComplete="new-password"
              className="input-field pr-10"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="confirm">Confirm password</label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              minLength={12}
              required
              autoComplete="new-password"
              className="input-field pr-10"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive-tint">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-[12px] text-destructive leading-tight">{error}</p>
          </div>
        )}

        <button type="submit" disabled={status === 'submitting'}
          className="w-full h-11 mt-1 rounded-xl bg-accent text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-60 transition-colors focus-ring">
          {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'submitting' ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  )
}
