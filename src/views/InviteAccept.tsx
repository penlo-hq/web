import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi, type InviteInfoDTO } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'
import { AuthLayout, AuthFooterLink, Button, Input, Spinner } from '../components/ui'

type Status = 'loading' | 'invalid' | 'valid' | 'submitting'

export function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const [status, setStatus] = useState<Status>('loading')
  const [info, setInfo] = useState<InviteInfoDTO | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    let cancelled = false
    authApi
      .getInvite(token)
      .then((data) => {
        if (cancelled) return
        setInfo(data)
        setStatus('valid')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('invalid')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (name.trim().length === 0) {
      setSubmitError('Name is required.')
      return
    }
    if (password.length < 12) {
      setSubmitError('Password must be at least 12 characters.')
      return
    }
    setSubmitError(null)
    setStatus('submitting')
    try {
      const data = await authApi.acceptInvite(token, name.trim(), password)
      setUser(data.user)
      navigate('/brain/company')
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        detail === 'invite_expired'
          ? 'This invite has expired.'
          : detail === 'invite_already_used'
            ? 'This invite has already been used.'
            : detail === 'user_exists'
              ? 'An account with that email already exists.'
              : detail === 'weak_password'
                ? 'Password is too weak. Use at least 12 characters and avoid your email.'
                : typeof detail === 'string'
                  ? detail
                  : "Couldn't create your account."
      setSubmitError(msg)
      setStatus('valid')
    }
  }

  return (
    <AuthLayout title="Enterprise Brain">
      {status === 'loading' && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {status === 'invalid' && (
        <div className="space-y-4 animate-reveal">
          <p className="text-body text-text-primary leading-relaxed">
            This invite is no longer valid. It may have expired or already been used.
          </p>
          <AuthFooterLink to="/login">Back to sign in</AuthFooterLink>
        </div>
      )}

      {(status === 'valid' || status === 'submitting') && info && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
          <div className="pb-3 border-b border-text-secondary/15">
            <p className="text-body font-medium text-text-primary">Join {info.company_name}</p>
            {info.team_name && <p className="text-caption text-text-secondary mt-1">Team: {info.team_name}</p>}
          </div>
          <Input label="Your name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          <Input label="Password (min 12 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} required />
          {submitError && <p className="text-caption-sm text-destructive bg-destructive-tint px-3 py-2 rounded-card">{submitError}</p>}
          <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
            {status === 'submitting' ? 'Creating your account…' : 'Create account'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
