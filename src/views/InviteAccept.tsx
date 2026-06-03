import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi, type InviteInfoDTO } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'
import { AuthLayout, Spinner } from '../components/ui'

type Status = 'loading' | 'invalid' | 'valid' | 'submitting'

export function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const [status, setStatus] = useState<Status>('loading')
  const [info, setInfo] = useState<InviteInfoDTO | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    let cancelled = false
    authApi.getInvite(token)
      .then((data) => { if (!cancelled) { setInfo(data); setStatus('valid') } })
      .catch(() => { if (!cancelled) setStatus('invalid') })
    return () => { cancelled = true }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!name.trim()) { setSubmitError('Name is required.'); return }
    if (password.length < 12) { setSubmitError('Password must be at least 12 characters.'); return }
    setSubmitError(null)
    setStatus('submitting')
    try {
      const data = await authApi.acceptInvite(token, name.trim(), password)
      setUser(data.user)
      navigate('/brain/company')
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        detail === 'invite_expired' ? 'This invite has expired.'
        : detail === 'invite_already_used' ? 'This invite has already been used.'
        : detail === 'user_exists' ? 'An account with that email already exists.'
        : detail === 'weak_password' ? 'Password is too weak. Use at least 12 characters.'
        : typeof detail === 'string' ? detail
        : "Couldn't create your account."
      setSubmitError(msg)
      setStatus('valid')
    }
  }

  return (
    <AuthLayout title={info ? `Join ${info.company_name}` : 'Accept invite'}>
      {status === 'loading' && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {status === 'invalid' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive-tint">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-[13px] text-destructive">
              This invite is no longer valid — it may have expired or already been used.
            </p>
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full h-11 rounded-xl bg-black/[0.06] text-text-primary font-medium text-[14px] flex items-center justify-center hover:bg-black/[0.10] transition-colors">
            Back to sign in
          </button>
        </div>
      )}

      {(status === 'valid' || status === 'submitting') && info && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Company context */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-accent-tint mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-[12px] font-semibold shrink-0">
              {info.company_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">{info.company_name}</p>
              {info.team_name && <p className="text-[11px] text-text-secondary">{info.team_name}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-text-secondary" htmlFor="name">Your name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith" maxLength={120} required autoFocus autoComplete="name"
              className="input-field" />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-text-secondary" htmlFor="invite-password">Password</label>
            <div className="relative">
              <input id="invite-password" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 12 characters" minLength={12} required autoComplete="new-password"
                className="input-field pr-10" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive-tint">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-[12px] text-destructive leading-tight">{submitError}</p>
            </div>
          )}

          <button type="submit" disabled={status === 'submitting'}
            className="w-full h-11 mt-1 rounded-xl bg-accent text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-60 transition-colors focus-ring">
            {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'submitting' ? 'Creating your account…' : 'Create account'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
