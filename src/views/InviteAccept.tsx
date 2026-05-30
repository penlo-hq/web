import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, type InviteInfoDTO } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'

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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="mb-8 animate-reveal">
          <div className="text-[9.5px] uppercase tracking-[0.22em] text-stone mb-2">Penlo</div>
          <h1 className="font-display font-bold text-[28px] tracking-tightest text-ink leading-none">
            Enterprise Brain
          </h1>
        </div>

        {status === 'loading' && <p className="text-[13px] text-stone">Checking your invite…</p>}

        {status === 'invalid' && (
          <div className="space-y-4 animate-reveal">
            <p className="text-[14px] text-ink leading-relaxed">
              This invite is no longer valid. It may have expired or already been used.
            </p>
            <Link to="/login" className="inline-block text-[12px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors">
              Back to sign in
            </Link>
          </div>
        )}

        {(status === 'valid' || status === 'submitting') && info && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-reveal" style={{ animationDelay: '0.05s' }}>
            <div className="pb-3 border-b border-mist">
              <p className="text-[14px] text-ink font-medium">Join {info.company_name}</p>
              {info.team_name && (
                <p className="text-[12px] text-stone mt-1">Team: {info.team_name}</p>
              )}
            </div>

            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone block mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
                className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
              />
            </div>

            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone block mb-1">Password (min 12 chars)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={12}
                required
                className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
              />
            </div>

            {submitError && <p className="text-[12px] text-ink">{submitError}</p>}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-2.5 bg-ink text-white rounded-xl text-[14px] font-medium hover:bg-graphite transition-colors disabled:opacity-50"
            >
              {status === 'submitting' ? 'Creating your account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
