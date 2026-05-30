import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'

type Status = 'idle' | 'submitting'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const clearUser = useAuthStore((s) => s.clearUser)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      // Defensive: handleSubmit shouldn't be reachable without a token because
      // the invalid-link state below renders before the form mounts.
      setError('This reset link is invalid.')
      return
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setStatus('submitting')
    try {
      const data = await authApi.resetPassword(token, password)
      setUser(data.user)
      navigate('/brain/company')
    } catch (e: unknown) {
      // Old session refresh tokens were revoked server-side; ensure the local
      // store reflects that if the user happened to be signed in here.
      clearUser()
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        detail === 'token_expired'
          ? 'This reset link has expired. Request a new one.'
          : detail === 'token_already_used'
            ? 'This reset link has already been used.'
            : detail === 'invalid_token'
              ? 'This reset link is invalid.'
              : detail === 'weak_password'
                ? 'Password is too weak. Use at least 12 characters and avoid your email.'
                : typeof detail === 'string'
                  ? detail
                  : "Couldn't reset your password."
      setError(msg)
      setStatus('idle')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-sm px-8">
          <div className="mb-10 animate-reveal">
            <div className="text-[9.5px] uppercase tracking-[0.22em] text-stone mb-2">Penlo</div>
            <h1 className="font-display font-bold text-[28px] tracking-tightest text-ink leading-none">
              This reset link is invalid
            </h1>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: '0.05s' }}>
            <p className="text-[13px] text-stone leading-relaxed">
              The link you followed is missing or incomplete. Request a new password reset link to continue.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full py-2.5 bg-ink text-white rounded-xl text-[14px] font-medium hover:bg-graphite transition-colors text-center"
            >
              Request a new link
            </Link>
            <Link
              to="/login"
              className="block text-center text-[12px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="mb-10 animate-reveal">
          <div className="text-[9.5px] uppercase tracking-[0.22em] text-stone mb-2">Penlo</div>
          <h1 className="font-display font-bold text-[28px] tracking-tightest text-ink leading-none">
            Choose a new password
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal" style={{ animationDelay: '0.05s' }}>
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone block mb-1">
              New password (min 12 chars)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={12}
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
            />
          </div>

          <div>
            <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone block mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={12}
              required
              className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
            />
          </div>

          {error && <p className="text-[12px] text-ink">{error}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-2.5 bg-ink text-white rounded-xl text-[14px] font-medium hover:bg-graphite transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Resetting…' : 'Reset password'}
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
