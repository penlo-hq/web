import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'
import { AuthLayout, AuthFooterLink, Button, Input } from '../components/ui'

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
      <AuthLayout title="This reset link is invalid">
        <div className="space-y-4 animate-reveal">
          <p className="text-caption text-text-secondary leading-relaxed">
            The link you followed is missing or incomplete. Request a new password reset link to continue.
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/forgot-password')}>
            Request a new link
          </Button>
          <div className="text-center">
            <AuthFooterLink to="/login">Back to sign in</AuthFooterLink>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
        <Input
          label="New password (min 12 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={12}
          required
          autoFocus
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={12}
          required
        />
        {error && <p className="text-caption-sm text-destructive bg-destructive-tint px-3 py-2 rounded-card">{error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Resetting…' : 'Reset password'}
        </Button>
        <div className="text-center">
          <AuthFooterLink to="/login">Back to sign in</AuthFooterLink>
        </div>
      </form>
    </AuthLayout>
  )
}
