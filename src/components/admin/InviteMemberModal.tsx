import { useEffect, useState } from 'react'
import { authApi } from '../../lib/api/endpoints'
import type { Invitation } from '../../types/graph'

type Props = {
  isOpen: boolean
  onClose: () => void
  teamId: string | null
  teamName: string | null
}

const ROLES: { value: string; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'team_lead', label: 'Team lead' },
  { value: 'admin', label: 'Admin' },
]

export function InviteMemberModal({ isOpen, onClose, teamId, teamName }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<Invitation | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setRole('employee')
      setError(null)
      setInvite(null)
      setCopied(false)
      setSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function submit() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await authApi.createInvite({ email: trimmed, role, team_id: teamId })
      setInvite(result)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        detail === 'user_exists'
          ? 'A user with that email already exists in your company.'
          : detail === 'user_exists_in_another_company'
            ? 'That email already has a Penlo account in another company.'
            : detail === 'invite_exists'
              ? 'A pending invite for that email already exists.'
              : typeof detail === 'string'
                ? detail
                : "Couldn't create invite."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLink() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.invite_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  function reset() {
    setInvite(null)
    setEmail('')
    setRole('employee')
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-accent/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[440px] max-w-[92vw] bg-white rounded-2xl border border-text-secondary/10 shadow-lg px-6 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        {invite === null ? (
          <>
            <h2 className="font-display font-bold text-[18px] tracking-tightest text-text-primary mb-4">Invite a teammate</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="new@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] focus:outline-none focus:border-ink"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] bg-white focus:outline-none focus:border-ink"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {teamName && (
                <p className="text-[11.5px] text-text-secondary">
                  Team: <span className="text-text-primary font-medium">{teamName}</span>
                </p>
              )}
              {error && <p className="text-[12px] text-text-primary">{error}</p>}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="px-4 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {submitting ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display font-bold text-[18px] tracking-tightest text-text-primary mb-3">Invite ready</h2>
            <p className="text-[12.5px] text-text-secondary mb-2">
              Send this link to <span className="font-medium text-text-primary">{invite.email}</span>:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={invite.invite_url}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-text-secondary/10 text-[12px] text-text-primary bg-surface focus:outline-none"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-2 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-text-secondary">
              Expires {new Date(invite.expires_at).toLocaleString()}.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
              >
                Invite another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
