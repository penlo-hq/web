import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../lib/api/endpoints'

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
      // Intentionally swallow — backend returns 204 regardless, but a network
      // error shouldn't reveal whether the email exists either.
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="mb-10 animate-reveal">
          <div className="text-[9.5px] uppercase tracking-[0.22em] text-stone mb-2">Penlo</div>
          <h1 className="font-display font-bold text-[28px] tracking-tightest text-ink leading-none">
            Reset your password
          </h1>
          <p className="mt-3 text-[14px] text-stone leading-relaxed">
            Enter your email and we'll send you a link to choose a new password.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 animate-reveal">
            <p className="text-[14px] text-ink leading-relaxed">
              If an account exists for that email, a reset link is on its way. The link expires in 30 minutes.
            </p>
            <Link
              to="/login"
              className="inline-block text-[12px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-reveal" style={{ animationDelay: '0.05s' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-mist rounded-xl text-[14px] text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-ink text-white rounded-xl text-[14px] font-medium hover:bg-graphite transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <Link
              to="/login"
              className="block text-center text-[12px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
