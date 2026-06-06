import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { InviteMemberModal } from '../admin/InviteMemberModal'
import { Button } from '../ui/Button'
import { onboardingApi, teamsApi, type AdminUserDTO, type TeamDTO, type TeamMemberDTO } from '../../lib/api/endpoints'
import { useAuthStore } from '../../store/authStore'

export function YourTeamPanel() {
  const user = useAuthStore((s) => s.user)
  const [team, setTeam] = useState<TeamDTO | null>(null)
  const [members, setMembers] = useState<TeamMemberDTO[]>([])
  const [companyUsers, setCompanyUsers] = useState<AdminUserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [addUserId, setAddUserId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const reload = useCallback(async () => {
    if (!user?.team_id) {
      setTeam(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [mine, m, allUsers] = await Promise.all([
        teamsApi.mine(),
        teamsApi.listMembers(user.team_id),
        onboardingApi.listUsers(),
      ])
      setTeam(mine.team)
      setMembers(m)
      setCompanyUsers(allUsers)
    } catch {
      setError("Couldn't load your team.")
    } finally {
      setLoading(false)
    }
  }, [user?.team_id])

  useEffect(() => {
    void reload()
  }, [reload])

  const unassigned = useMemo(
    () => companyUsers.filter((u) => !u.team_id),
    [companyUsers],
  )

  if (!user?.team_id) return null
  if (user.role !== 'team_lead' && user.role !== 'admin') return null
  if (!team?.can_manage_members && user.role !== 'admin') return null

  async function addMember() {
    if (!user?.team_id || !addUserId) return
    setError(null)
    try {
      await teamsApi.addMember(user.team_id, addUserId)
      setAddUserId('')
      await reload()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail === 'user_already_on_team' ? 'That person is already on another team.' : "Couldn't add member.")
    }
  }

  async function removeMember(userId: string) {
    if (!user?.team_id) return
    try {
      await teamsApi.removeMember(user.team_id, userId)
      await reload()
    } catch {
      setError("Couldn't remove member.")
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-headline text-text-primary">Your team</h2>
          <p className="text-caption text-text-secondary mt-0.5">
            {team?.name ?? user.team_name ?? 'Team'} · {members.length} members
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)} className="gap-1.5">
          <UserPlus className="w-4 h-4" />
          Invite
        </Button>
      </div>

      {loading && <p className="text-caption text-text-tertiary">Loading…</p>}
      {error && <p className="text-caption text-destructive">{error}</p>}

      {!loading && (
        <ul className="divide-y divide-border border border-border rounded-xl bg-canvas">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{m.name}</p>
                <p className="text-caption text-text-tertiary truncate">{m.email}</p>
              </div>
              {m.id !== user?.id && (
                <button
                  type="button"
                  onClick={() => void removeMember(m.id)}
                  className="text-caption text-text-tertiary hover:text-destructive"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {unassigned.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-border text-body bg-canvas"
          >
            <option value="">Add unassigned member…</option>
            {unassigned.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <Button size="sm" disabled={!addUserId} onClick={() => void addMember()}>
            Add to team
          </Button>
        </div>
      )}

      <InviteMemberModal
        isOpen={inviteOpen}
        onClose={() => { setInviteOpen(false); void reload() }}
        teamId={user.team_id}
        teamName={team?.name ?? user.team_name ?? null}
      />
    </section>
  )
}
