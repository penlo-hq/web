import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api/endpoints'
import { publicApi } from '../lib/api/client'
import { AuthLayout, AuthFooterLink } from '../components/ui'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (resp: { credential: string }) => void; ux_mode?: string }) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no_window'))
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('gsi_load_failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('gsi_load_failed'))
    document.head.appendChild(script)
  })
}

export function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await publicApi.post('/api/v1/auth/login', { email, password })
      setUser(data.user)
      navigate('/brain/company')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!googleClientId) return
    let cancelled = false

    async function handleCredential(resp: { credential: string }) {
      setGoogleError(null)
      try {
        const data = await authApi.google(resp.credential)
        setUser(data.user)
        navigate('/brain/company')
      } catch (e: unknown) {
        const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        const msg =
          detail === 'no_account'
            ? 'No Penlo account — ask your admin for an invite.'
            : detail === 'ambiguous_invite'
              ? 'Multiple invites match this email. Contact your admin.'
              : detail === 'email_not_verified'
                ? 'Your Google email must be verified.'
                : detail === 'google_unreachable'
                  ? "Couldn't reach Google. Try again."
                  : typeof detail === 'string'
                    ? detail
                    : 'Google sign-in failed.'
        setGoogleError(msg)
      }
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled) return
        const el = document.getElementById('penlo-google-btn')
        if (!el || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: googleClientId as string,
          callback: handleCredential,
          ux_mode: 'popup',
        })
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 328,
        })
      })
      .catch(() => {
        if (cancelled) return
        setGoogleError("Couldn't load Google sign-in.")
      })

    return () => { cancelled = true }
  }, [googleClientId, navigate, setUser])

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your company's knowledge graph."
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <AuthFooterLink to="/signup">Get started</AuthFooterLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-[12px] font-medium text-text-secondary" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
            className="input-field"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-text-secondary" htmlFor="password">
              Password
            </label>
            <AuthFooterLink to="/forgot-password">
              <span className="text-[12px]">Forgot?</span>
            </AuthFooterLink>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="input-field pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive-tint">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-[12px] text-destructive leading-tight">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 rounded-xl bg-accent text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-60 transition-colors focus-ring"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {googleClientId && (
        <div className="mt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-black/[0.08]" />
            <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-black/[0.08]" />
          </div>
          <div id="penlo-google-btn" className="flex justify-center" />
          {googleError && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-destructive-tint">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-[12px] text-destructive">{googleError}</p>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  )
}
