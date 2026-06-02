import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { InviteMemberModal } from '../components/admin/InviteMemberModal'
import {
  onboardingApi,
  teamsApi,
  type AdminUserDTO,
  type TeamDTO,
  type TeamMemberDTO,
} from '../lib/api/endpoints'
import type { PageProps } from '../types/layout'

type CreateState = { open: boolean; name: string; color: string; is_private: boolean; submitting: boolean; error: string | null }

const DEFAULT_COLOR = '#6b6b6b'

function useTeams() {
  const [teams, setTeams] = useState<TeamDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTeams(await teamsApi.list())
    } catch {
      setError("Couldn't load teams.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { teams, loading, error, refresh, setTeams }
}

export function TeamManagement({ onMenuClick }: PageProps) {
  const { teams, loading, error, refresh } = useTeams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createState, setCreateState] = useState<CreateState>({
    open: false,
    name: '',
    color: DEFAULT_COLOR,
    is_private: false,
    submitting: false,
    error: null,
  })

  useEffect(() => {
    if (selectedId && !teams.some((t) => t.id === selectedId)) {
      setSelectedId(teams[0]?.id ?? null)
    } else if (!selectedId && teams.length > 0) {
      setSelectedId(teams[0].id)
    }
  }, [teams, selectedId])

  const selected = useMemo(() => teams.find((t) => t.id === selectedId) ?? null, [teams, selectedId])

  async function submitCreate() {
    const name = createState.name.trim()
    if (!name) {
      setCreateState((s) => ({ ...s, error: 'Name is required.' }))
      return
    }
    setCreateState((s) => ({ ...s, submitting: true, error: null }))
    try {
      const created = await teamsApi.create({ name, color: createState.color, is_private: createState.is_private })
      await refresh()
      setSelectedId(created.id)
      setCreateState({ open: false, name: '', color: DEFAULT_COLOR, is_private: false, submitting: false, error: null })
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg = detail === 'team_name_exists' ? 'A team with that name already exists.' : typeof detail === 'string' ? detail : "Couldn't create team."
      setCreateState((s) => ({ ...s, submitting: false, error: msg }))
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar onMenuClick={onMenuClick} title="Teams" subtitle="Manage members" />
      <div className="flex-1 overflow-hidden flex">
        <aside className="w-[320px] shrink-0 border-r border-text-secondary/10 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-[14px] tracking-tightest text-text-primary">All teams</h2>
            <button
              type="button"
              onClick={() => setCreateState((s) => ({ ...s, open: !s.open }))}
              className="text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
            >
              {createState.open ? 'Cancel' : '+ New team'}
            </button>
          </div>

          {createState.open && (
            <div className="mb-4 p-3 rounded-xl border border-text-secondary/10 bg-surface space-y-2">
              <input
                type="text"
                value={createState.name}
                onChange={(e) => setCreateState((s) => ({ ...s, name: e.target.value }))}
                placeholder="Team name"
                maxLength={80}
                className="w-full px-3 py-1.5 rounded-xl border border-text-secondary/10 text-[12.5px] bg-white focus:outline-none focus:border-ink"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={createState.color}
                  onChange={(e) => setCreateState((s) => ({ ...s, color: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-text-secondary/10 cursor-pointer"
                  aria-label="Team color"
                />
                <label className="flex items-center gap-2 text-[11.5px] text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createState.is_private}
                    onChange={(e) => setCreateState((s) => ({ ...s, is_private: e.target.checked }))}
                    className="accent-ink"
                  />
                  Private
                </label>
              </div>
              {createState.error && <p className="text-[11.5px] text-text-primary">{createState.error}</p>}
              <button
                type="button"
                disabled={createState.submitting}
                onClick={submitCreate}
                className="w-full px-3 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {createState.submitting ? 'Creating…' : 'Create team'}
              </button>
            </div>
          )}

          {loading && <p className="text-[12.5px] text-text-secondary">Loading…</p>}
          {error && <p className="text-[12.5px] text-text-primary">{error}</p>}
          {!loading && teams.length === 0 && !createState.open && (
            <div className="text-center py-6">
              <p className="text-[12.5px] text-text-secondary">No teams yet. Create one to organize your company.</p>
            </div>
          )}

          <ul className="space-y-1">
            {teams.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    selectedId === t.id ? 'bg-accent text-white' : 'text-text-primary hover:bg-surface'
                  }`}
                >
                  <span
                    aria-label={`Team color: ${t.color}`}
                    className="w-3 h-3 rounded shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="flex-1 min-w-0 truncate text-[13px] font-medium">{t.name}</span>
                  {t.is_private && (
                    <span className={`text-[9px] uppercase tracking-[0.18em] ${selectedId === t.id ? 'text-white/60' : 'text-text-secondary'}`}>
                      Private
                    </span>
                  )}
                  <span className={`text-[11px] ${selectedId === t.id ? 'text-white/60' : 'text-text-secondary'}`}>
                    {t.member_count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex-1 min-w-0 overflow-y-auto px-5 py-6">
          {selected ? (
            <TeamDetail team={selected} onChanged={refresh} />
          ) : (
            <div className="text-center text-[13px] text-text-secondary py-12">Select a team to manage it.</div>
          )}
        </section>
      </div>
    </motion.div>
  )
}

function TeamDetail({ team, onChanged }: { team: TeamDTO; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(team.name)
  const [color, setColor] = useState(team.color)
  const [isPrivate, setIsPrivate] = useState(team.is_private)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [members, setMembers] = useState<TeamMemberDTO[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [companyUsers, setCompanyUsers] = useState<AdminUserDTO[]>([])
  const [addUserId, setAddUserId] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    setName(team.name)
    setColor(team.color)
    setIsPrivate(team.is_private)
    setConfirmDelete(false)
    setFormError(null)
  }, [team.id, team.name, team.color, team.is_private])

  const reloadMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const [m, allUsers] = await Promise.all([teamsApi.listMembers(team.id), onboardingApi.listUsers()])
      setMembers(m)
      setCompanyUsers(allUsers)
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }, [team.id])

  useEffect(() => {
    reloadMembers()
  }, [reloadMembers])

  const unassigned = useMemo(
    () => companyUsers.filter((u) => !u.team_id || u.team_id === ''),
    [companyUsers],
  )

  async function save() {
    setSaving(true)
    setFormError(null)
    try {
      await teamsApi.update(team.id, { name: name.trim(), color, is_private: isPrivate })
      await onChanged()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        detail === 'team_name_exists'
          ? 'A team with that name already exists.'
          : detail === 'invalid_color'
            ? 'Color must be a 6-digit hex value.'
            : detail === 'name_required'
              ? 'Name is required.'
              : detail === 'name_too_long'
                ? 'Name must be 80 characters or fewer.'
                : typeof detail === 'string'
                  ? detail
                  : "Couldn't save team."
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTeam() {
    setDeleting(true)
    try {
      await teamsApi.remove(team.id)
      await onChanged()
    } catch {
      setFormError("Couldn't delete team.")
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function addMember() {
    if (!addUserId) return
    setAddError(null)
    try {
      await teamsApi.addMember(team.id, addUserId)
      setAddUserId('')
      await Promise.all([reloadMembers(), onChanged()])
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg = detail === 'user_already_on_team' ? 'That user is already on another team.' : typeof detail === 'string' ? detail : "Couldn't add member."
      setAddError(msg)
    }
  }

  async function removeMember(userId: string) {
    try {
      await teamsApi.removeMember(team.id, userId)
      await Promise.all([reloadMembers(), onChanged()])
    } catch {
      setAddError("Couldn't remove member.")
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <span
          aria-label={`Team color: ${team.color}`}
          className="w-4 h-4 rounded"
          style={{ backgroundColor: team.color }}
        />
        <h2 className="font-display font-bold text-[20px] tracking-tightest text-text-primary">{team.name}</h2>
        {team.is_private && <span className="text-[10px] uppercase tracking-[0.18em] text-text-secondary">Private</span>}
      </div>

      <section className="space-y-3">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] focus:outline-none focus:border-ink"
          />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-text-secondary/10 cursor-pointer"
              aria-label="Team color"
            />
          </div>
          <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer mt-5">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-ink"
            />
            Private team
          </label>
        </div>
        {formError && <p className="text-[12px] text-text-primary">{formError}</p>}
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="px-4 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-[14px] tracking-tightest text-text-primary">
            Members ({members.length})
          </h3>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
          >
            Invite member
          </button>
        </div>
        {membersLoading && <p className="text-[12.5px] text-text-secondary">Loading…</p>}
        {!membersLoading && members.length === 0 && <p className="text-[12.5px] text-text-secondary">No members yet.</p>}
        <ul className="divide-y divide-mist border border-text-secondary/10 rounded-xl bg-white">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] text-text-primary font-medium truncate">{m.name}</p>
                <p className="text-[11.5px] text-text-secondary truncate">{m.email}</p>
              </div>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                aria-label={`Remove ${m.name}`}
                className="text-[14px] text-text-secondary hover:text-text-primary transition-colors"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary">Add existing user</h3>
        <div className="flex items-center gap-2">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] bg-white focus:outline-none focus:border-ink"
          >
            <option value="">Select an unassigned user…</option>
            {unassigned.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!addUserId}
            onClick={addMember}
            className="px-4 py-2 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </div>
        {addError && <p className="text-[12px] text-text-primary">{addError}</p>}
      </section>

      <section className="pt-4 border-t border-text-secondary/10">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <p className="text-[12.5px] text-text-secondary flex-1">Confirm delete? Members will be unassigned.</p>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={deleteTeam}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
          >
            Delete team
          </button>
        )}
      </section>

      <InviteMemberModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        teamId={team.id}
        teamName={team.name}
      />
    </div>
  )
}
