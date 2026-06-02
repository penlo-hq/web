import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { InviteMemberModal } from '../components/admin/InviteMemberModal'
import { useAuthStore } from '../store/authStore'
import {
  teamPermissionsApi,
  type AdminUserDTO,
  type MemberRole,
  type PendingInvitationDTO,
} from '../lib/api/endpoints'

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'team_lead', label: 'Team lead' },
  { value: 'employee', label: 'Employee' },
]

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  team_lead: 'Team lead',
  employee: 'Employee',
}

function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-mist bg-paper text-[10.5px] uppercase tracking-[0.16em] text-graphite">
      {roleLabel(role)}
    </span>
  )
}

export function TeamPermissions() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const [members, setMembers] = useState<AdminUserDTO[]>([])
  const [invitations, setInvitations] = useState<PendingInvitationDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([teamPermissionsApi.listMembers(), teamPermissionsApi.listInvitations()])
      .then(([memberRows, inviteRows]) => {
        if (cancelled) return
        setMembers(memberRows)
        setInvitations(inviteRows)
      })
      .catch(() => {
        if (cancelled) return
        setError("Couldn't load team permissions.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name)),
    [members],
  )

  async function changeRole(member: AdminUserDTO, role: MemberRole) {
    if (role === member.role) return
    const prevRole = member.role
    setMembers((rows) => rows.map((m) => (m.id === member.id ? { ...m, role } : m)))
    setSavingId(member.id)
    setError(null)
    try {
      await teamPermissionsApi.updateRole(member.id, role)
    } catch {
      setMembers((rows) => rows.map((m) => (m.id === member.id ? { ...m, role: prevRole } : m)))
      setError("Couldn't update role.")
    } finally {
      setSavingId(null)
    }
  }

  async function revoke(invite: PendingInvitationDTO) {
    if (!window.confirm(`Revoke the pending invite for ${invite.email}?`)) return
    setRevokingId(invite.id)
    setError(null)
    try {
      await teamPermissionsApi.revokeInvitation(invite.id)
      setInvitations((rows) => rows.filter((r) => r.id !== invite.id))
    } catch {
      setError("Couldn't revoke invitation.")
    } finally {
      setRevokingId(null)
    }
  }

  async function refreshInvitations() {
    try {
      const rows = await teamPermissionsApi.listInvitations()
      setInvitations(rows)
    } catch {
      setError("Couldn't refresh invitations.")
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen">
      <TopBar title="Permissions" subtitle="Roles & invites" />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          {error && (
            <p className="text-[13px] text-ink">{error}</p>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[16px] tracking-tightest text-ink">Members</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="px-4 py-2 rounded-xl bg-ink text-white text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity"
                >
                  Invite member
                </button>
              )}
            </div>

            {loading && <p className="text-[13px] text-stone">Loading…</p>}

            {!loading && sortedMembers.length === 0 && (
              <div className="px-6 py-8 rounded-xl border border-mist bg-paper text-center">
                <p className="text-[13px] text-graphite">No members yet.</p>
              </div>
            )}

            {!loading && sortedMembers.length > 0 && (
              <ul className="space-y-2">
                {sortedMembers.map((member) => {
                  const isSelf = member.id === user?.id
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between px-5 py-4 rounded-xl border border-mist bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-ink truncate">
                          {member.name}
                          {isSelf && <span className="ml-2 text-[10.5px] text-stone">(you)</span>}
                        </p>
                        <p className="text-[11.5px] text-stone truncate">{member.email}</p>
                      </div>
                      {isAdmin && !isSelf ? (
                        <select
                          value={member.role}
                          disabled={savingId === member.id}
                          onChange={(e) => changeRole(member, e.target.value as MemberRole)}
                          className="px-3 py-2 rounded-xl border border-mist text-[12.5px] bg-white focus:outline-none focus:border-ink disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-[16px] tracking-tightest text-ink">Pending invitations</h2>

            {!loading && invitations.length === 0 && (
              <div className="px-6 py-8 rounded-xl border border-mist bg-paper text-center">
                <p className="text-[13px] text-graphite">No pending invitations</p>
              </div>
            )}

            {!loading && invitations.length > 0 && (
              <ul className="space-y-2">
                {invitations.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between px-5 py-4 rounded-xl border border-mist bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-ink truncate">{invite.email}</p>
                      <p className="text-[10.5px] text-stone mt-0.5">
                        Invited {new Date(invite.created_at).toLocaleDateString()} · Expires{' '}
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <RoleBadge role={invite.role} />
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={revokingId === invite.id}
                          onClick={() => revoke(invite)}
                          className="text-[10.5px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors disabled:opacity-50"
                        >
                          {revokingId === invite.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {isAdmin && (
        <InviteMemberModal
          isOpen={inviteOpen}
          onClose={() => {
            setInviteOpen(false)
            void refreshInvitations()
          }}
          teamId={null}
          teamName={null}
        />
      )}
    </motion.div>
  )
}
