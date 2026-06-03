import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api/endpoints'
import { publicApi } from '../lib/api/client'
import { AuthLayout, AuthFooterLink, Button, Input } from '../components/ui'

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
      setError('Invalid credentials')
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
          width: 320,
        })
      })
      .catch(() => {
        if (cancelled) return
        setGoogleError("Couldn't load Google sign-in.")
      })

    return () => {
      cancelled = true
    }
  }, [googleClientId, navigate, setUser])

  return (
    <AuthLayout
      title="Enterprise Brain"
      subtitle="Sign in to access your company's knowledge graph."
    >
      <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {error && <p className="text-caption-sm text-destructive bg-destructive-tint px-3 py-2 rounded-card">{error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="text-center">
          <AuthFooterLink to="/forgot-password">Forgot password?</AuthFooterLink>
        </div>
      </form>

      {googleClientId && (
        <div className="mt-6 animate-reveal">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-text-secondary/15" />
            <span className="text-caption-sm uppercase tracking-section text-text-secondary">or</span>
            <div className="flex-1 h-px bg-text-secondary/15" />
          </div>
          <div id="penlo-google-btn" className="flex justify-center" />
          {googleError && <p className="mt-3 text-caption-sm text-destructive">{googleError}</p>}
        </div>
      )}

      <p className="mt-6 text-caption text-text-secondary text-center">
        Don&apos;t have an account? Use an invite link.
      </p>
    </AuthLayout>
  )
}
