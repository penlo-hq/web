import { useState } from 'react'
import { authApi } from '../lib/api/endpoints'
import { AuthLayout, AuthFooterLink, Button, Input } from '../components/ui'

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
      /* swallow */
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
    >
      {submitted ? (
        <div className="space-y-4 animate-reveal">
          <p className="text-body text-text-primary leading-relaxed">
            If an account exists for that email, a reset link is on its way. The link expires in 30 minutes.
          </p>
          <AuthFooterLink to="/login">Back to sign in</AuthFooterLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-reveal">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required autoFocus />
          <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <div className="text-center">
            <AuthFooterLink to="/login">Back to sign in</AuthFooterLink>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
