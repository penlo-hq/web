import { useEffect, useState } from 'react'
import { Check, Copy, Mail, X } from 'lucide-react'
import { authApi } from '../../lib/api/endpoints'
import { ROLE_META } from '../permissions/roleConfig'
import type { Invitation } from '../../types/graph'
import type { MemberRole } from '../../lib/api/endpoints'
import { Button } from '../ui/Button'

type Props = {
  isOpen: boolean
  onClose: () => void
  teamId: string | null
  teamName: string | null
}

export function InviteMemberModal({ isOpen, onClose, teamId, teamName }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('employee')
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
      const rawDetail = (e as { response?: { data?: { detail?: unknown }; status?: number } })?.response?.data?.detail
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 402 && rawDetail && typeof rawDetail === 'object' && 'message' in rawDetail) {
        setError(String((rawDetail as { message: string }).message))
        setSubmitting(false)
        return
      }
      const detail = typeof rawDetail === 'string' ? rawDetail : undefined
      const msg =
        detail === 'user_exists'
          ? 'Someone with that email is already on your team.'
          : detail === 'user_exists_in_another_company'
            ? 'That email already has a Penlo account at another company.'
            : detail === 'invite_exists'
              ? 'A pending invite already exists for that email. Check Pending invitations.'
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
      setTimeout(() => setCopied(false), 2000)
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
      aria-labelledby="invite-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-accent" />
            </div>
            <h2 id="invite-dialog-title" className="text-[17px] font-semibold text-text-primary">
              {invite ? 'Invite link ready' : 'Invite a teammate'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-black/[0.04] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {invite === null ? (
            <>
              <p className="text-[13px] text-text-secondary mb-4 leading-relaxed">
                They&apos;ll receive access after opening the invite link. Choose a role that matches what they need to do.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="text-[12px] font-medium text-text-secondary block mb-1.5">
                    Email address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && void submit()}
                  />
                </div>

                <fieldset>
                  <legend className="text-[12px] font-medium text-text-secondary mb-2">Role</legend>
                  <div className="space-y-2">
                    {ROLE_META.map((r) => {
                      const selected = role === r.value
                      return (
                        <label
                          key={r.value}
                          className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            selected
                              ? 'border-accent bg-accent/[0.04] ring-1 ring-accent/20'
                              : 'border-border hover:border-black/[0.14]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="invite-role"
                            value={r.value}
                            checked={selected}
                            onChange={() => setRole(r.value)}
                            className="mt-1 accent-accent"
                          />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-text-primary">{r.label}</span>
                            <span className="block text-[12px] text-text-tertiary mt-0.5">{r.description}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                {teamName && (
                  <p className="text-[12px] text-text-tertiary">
                    Assigned to team: <span className="font-medium text-text-secondary">{teamName}</span>
                  </p>
                )}

                {error && (
                  <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button size="sm" disabled={submitting} onClick={() => void submit()}>
                  {submitting ? 'Creating…' : 'Create invite link'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] text-text-secondary mb-3">
                Send this link to <span className="font-medium text-text-primary">{invite.email}</span>. It expires{' '}
                {new Date(invite.expires_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                .
              </p>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={invite.invite_url}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-border text-[12px] text-text-primary bg-canvas focus:outline-none"
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Invite link"
                />
                <Button size="sm" onClick={() => void copyLink()} className="gap-1.5 shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={reset}>
                  Invite another
                </Button>
                <Button size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
