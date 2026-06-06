import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Search, UserPlus, Users } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { InviteMemberModal } from '../components/admin/InviteMemberModal'
import { RoleGuide } from '../components/permissions/RoleGuide'
import { YourTeamPanel } from '../components/teams/YourTeamPanel'
import { TeamsGuide } from '../components/teams/TeamsGuide'
import { MemberRow } from '../components/permissions/MemberRow'
import { InvitationRow } from '../components/permissions/InvitationRow'
import { roleLabel } from '../components/permissions/roleConfig'
import { useAuthStore } from '../store/authStore'
import {
  teamPermissionsApi,
  teamsApi,
  type AdminUserDTO,
  type MemberRole,
  type PendingInvitationDTO,
  type TeamDTO,
} from '../lib/api/endpoints'
import { extractApiError } from '../lib/api/errors'
import { Button, ConfirmModal, EmptyState, Skeleton } from '../components/ui'
import type { PageProps } from '../types/layout'

type Tab = 'members' | 'invites'

function mapRoleError(err: unknown): string {
  const raw = extractApiError(err, "Couldn't update role.")
  if (raw.includes('cannot_change_own_role')) return "You can't change your own role. Ask another admin."
  if (raw.includes('Insufficient permissions')) return 'Only admins can change roles.'
  return raw
}

export function TeamPermissions({ onMenuClick }: PageProps) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const isTeamLead = user?.role === 'team_lead'

  const [members, setMembers] = useState<AdminUserDTO[]>([])
  const [teams, setTeams] = useState<TeamDTO[]>([])
  const [invitations, setInvitations] = useState<PendingInvitationDTO[]>([])
  const [invitesForbidden, setInvitesForbidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('members')
  const [roleConfirm, setRoleConfirm] = useState<{
    member: AdminUserDTO
    nextRole: MemberRole
  } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<PendingInvitationDTO | null>(null)

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const memberRows = await teamPermissionsApi.listMembers()
      setMembers(memberRows)
      try {
        const teamRows = await teamsApi.list()
        setTeams(teamRows)
      } catch {
        setTeams([])
      }
      if (isAdmin) {
        const inviteRows = await teamPermissionsApi.listInvitations()
        setInvitations(inviteRows)
        setInvitesForbidden(false)
      } else {
        setInvitations([])
        setInvitesForbidden(true)
      }
    } catch (err) {
      setError(extractApiError(err, "Couldn't load team permissions."))
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!success) return
    const t = window.setTimeout(() => setSuccess(null), 4000)
    return () => window.clearTimeout(t)
  }, [success])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name))
    if (!q) return sorted
    return sorted.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        roleLabel(m.role).toLowerCase().includes(q),
    )
  }, [members, search])

  const roleCounts = useMemo(() => {
    const counts = { admin: 0, team_lead: 0, employee: 0 }
    for (const m of members) {
      if (m.role in counts) counts[m.role as keyof typeof counts] += 1
    }
    return counts
  }, [members])

  async function applyRoleChange(member: AdminUserDTO, role: MemberRole) {
    if (role === member.role) return
    const prevRole = member.role
    setMembers((rows) => rows.map((m) => (m.id === member.id ? { ...m, role } : m)))
    setSavingId(member.id)
    setError(null)
    try {
      await teamPermissionsApi.updateRole(member.id, role)
      setSuccess(`${member.name} is now ${roleLabel(role).toLowerCase()}.`)
    } catch (err) {
      setMembers((rows) => rows.map((m) => (m.id === member.id ? { ...m, role: prevRole } : m)))
      setError(mapRoleError(err))
    } finally {
      setSavingId(null)
      setRoleConfirm(null)
    }
  }

  function requestRoleChange(member: AdminUserDTO, nextRole: MemberRole) {
    if (nextRole === member.role) return
    const isSensitive =
      nextRole === 'admin' ||
      member.role === 'admin' ||
      (nextRole === 'team_lead' && member.role === 'employee') ||
      (nextRole === 'employee' && member.role === 'team_lead')
    if (isSensitive) {
      setRoleConfirm({ member, nextRole })
      return
    }
    void applyRoleChange(member, nextRole)
  }

  async function confirmRevoke() {
    if (!revokeTarget) return
    const invite = revokeTarget
    setRevokingId(invite.id)
    setError(null)
    try {
      await teamPermissionsApi.revokeInvitation(invite.id)
      setInvitations((rows) => rows.filter((r) => r.id !== invite.id))
      setSuccess(`Revoked invite for ${invite.email}.`)
    } catch (err) {
      setError(extractApiError(err, "Couldn't revoke invitation."))
    } finally {
      setRevokingId(null)
      setRevokeTarget(null)
    }
  }

  async function refreshInvitations() {
    if (!isAdmin) return
    try {
      const rows = await teamPermissionsApi.listInvitations()
      setInvitations(rows)
    } catch (err) {
      setError(extractApiError(err, "Couldn't refresh invitations."))
    }
  }

  function onInviteClose() {
    setInviteOpen(false)
    void refreshInvitations()
    void load()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar onMenuClick={onMenuClick} title="Permissions" subtitle="Who can access what" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {!isAdmin && !isTeamLead && (
            <div className="flex gap-3 px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.06]">
              <Users className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-text-primary">View-only access</p>
                <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
                  You can see your company directory. Only admins can change roles; team leads manage their own team.
                </p>
              </div>
            </div>
          )}

          {isTeamLead && (
            <div className="flex gap-3 px-4 py-3 rounded-xl border border-accent/20 bg-accent-tint/30">
              <Users className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-text-primary">Team lead</p>
                <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
                  You can invite and manage members on your team. Admins handle company-wide roles and team settings.
                </p>
              </div>
            </div>
          )}

          <TeamsGuide />
          <YourTeamPanel />

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-red-900">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="text-[12px] font-medium text-red-700 hover:text-red-900 shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {success && (
            <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px] text-emerald-900">
              {success}
            </div>
          )}

          <RoleGuide />

          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Members" value={members.length} />
              <StatCard label="Admins" value={roleCounts.admin} />
              <StatCard label="Team leads" value={roleCounts.team_lead} />
              {isAdmin ? (
                <StatCard label="Pending invites" value={invitations.length} accent />
              ) : (
                <StatCard label="Employees" value={roleCounts.employee} />
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {isAdmin && (
              <div className="inline-flex p-1 rounded-xl bg-black/[0.04] border border-border self-start">
                <TabButton active={tab === 'members'} onClick={() => setTab('members')}>
                  Members ({members.length})
                </TabButton>
                <TabButton active={tab === 'invites'} onClick={() => setTab('invites')}>
                  Invites ({invitations.length})
                </TabButton>
              </div>
            )}
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === 'invites' && isAdmin ? 'Search invites by email…' : 'Search by name or email…'
                }
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15 disabled:opacity-50"
                aria-label="Search members"
              />
            </div>
            {(isAdmin || isTeamLead) && (
              <Button size="sm" onClick={() => setInviteOpen(true)} className="shrink-0 gap-1.5">
                <UserPlus className="w-4 h-4" />
                Invite member
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[72px] rounded-xl" />
              ))}
            </div>
          ) : tab === 'members' || !isAdmin ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-text-primary">Company members</h2>
                {isAdmin && (
                  <Link
                    to="/admin/teams"
                    className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    Manage teams →
                  </Link>
                )}
              </div>

              {filteredMembers.length === 0 && (
                <EmptyState
                  icon={Users}
                  title={search ? 'No matching members' : 'No members yet'}
                  description={
                    search
                      ? 'Try a different name or email.'
                      : isAdmin
                        ? 'Invite your first teammate to get started.'
                        : 'Members will appear here once they join.'
                  }
                  actionLabel={isAdmin && !search ? 'Invite member' : undefined}
                  onAction={isAdmin && !search ? () => setInviteOpen(true) : undefined}
                />
              )}

              {filteredMembers.length > 0 && (
                <ul className="space-y-2">
                  {filteredMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      teamName={member.team_id ? teamById.get(member.team_id) ?? null : null}
                      isSelf={member.id === user?.id}
                      canEditRole={isAdmin}
                      canManageTeams={isAdmin}
                      saving={savingId === member.id}
                      onRoleChange={(role) => requestRoleChange(member, role)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-text-primary">Pending invitations</h2>
              <p className="text-[12px] text-text-tertiary -mt-1">
                Invites expire after 7 days. Share the invite link from the modal when you send a new invite.
              </p>

              {invitesForbidden && (
                <p className="text-[13px] text-text-secondary">You don&apos;t have access to view invitations.</p>
              )}

              {!invitesForbidden && invitations.length === 0 && (
                <EmptyState
                  icon={UserPlus}
                  title="No pending invitations"
                  description="When you invite someone, they'll appear here until they accept or the invite expires."
                  actionLabel="Invite member"
                  onAction={() => setInviteOpen(true)}
                />
              )}

              {!invitesForbidden && invitations.length > 0 && (
                <ul className="space-y-2">
                  {invitations
                    .filter((inv) => {
                      const q = search.trim().toLowerCase()
                      return !q || inv.email.toLowerCase().includes(q)
                    })
                    .map((invite) => (
                      <InvitationRow
                        key={invite.id}
                        invite={invite}
                        revoking={revokingId === invite.id}
                        onRevoke={() => setRevokeTarget(invite)}
                      />
                    ))}
                </ul>
              )}
            </section>
          )}

          {!loading && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {(isAdmin || isTeamLead) && (
        <InviteMemberModal
          isOpen={inviteOpen}
          onClose={onInviteClose}
          teamId={isTeamLead ? user?.team_id ?? null : null}
          teamName={isTeamLead ? user?.team_name ?? null : null}
        />
      )}

      <ConfirmModal
        open={roleConfirm !== null}
        title="Change role?"
        message={
          roleConfirm
            ? `Change ${roleConfirm.member.name} from ${roleLabel(roleConfirm.member.role)} to ${roleLabel(roleConfirm.nextRole)}? This updates what they can access immediately.`
            : ''
        }
        confirmLabel="Update role"
        onConfirm={() => {
          if (roleConfirm) void applyRoleChange(roleConfirm.member, roleConfirm.nextRole)
        }}
        onCancel={() => setRoleConfirm(null)}
      />

      <ConfirmModal
        open={revokeTarget !== null}
        title="Revoke invitation?"
        message={
          revokeTarget
            ? `${revokeTarget.email} will no longer be able to use their invite link. You can send a new invite later.`
            : ''
        }
        confirmLabel="Revoke"
        destructive
        onConfirm={() => void confirmRevoke()}
        onCancel={() => setRevokeTarget(null)}
      />
    </motion.div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
      <p className={`text-[22px] font-semibold tabular-nums mt-0.5 ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
        active ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  )
}
