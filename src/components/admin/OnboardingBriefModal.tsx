import { useEffect, useMemo, useState } from 'react'
import { onboardingApi, type AdminTeamDTO, type AdminUserDTO } from '../../lib/api/endpoints'

type Props = {
  isOpen: boolean
  onClose: () => void
  onGenerated: (draftNodeId: string) => void
}

export function OnboardingBriefModal({ isOpen, onClose, onGenerated }: Props) {
  const [users, setUsers] = useState<AdminUserDTO[]>([])
  const [teams, setTeams] = useState<AdminTeamDTO[]>([])
  const [userId, setUserId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    Promise.all([onboardingApi.listUsers(), onboardingApi.listTeams()])
      .then(([u, t]) => {
        setUsers(u)
        setTeams(t)
      })
      .catch(() => setError("Couldn't load users/teams."))
      .finally(() => setLoading(false))
  }, [isOpen])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users.slice(0, 30)
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 30)
  }, [users, search])

  function reset() {
    setUserId('')
    setTeamId('')
    setRole('')
    setSearch('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function submit() {
    if (!userId || !teamId || !role.trim()) {
      setError('All fields are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await onboardingApi.generate({
        new_user_id: userId,
        team_id: teamId,
        role: role.trim(),
      })
      onGenerated(result.draft_node_id)
      reset()
      onClose()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : "Couldn't generate brief.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-accent/30 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-[440px] max-w-[92vw] bg-white rounded-2xl border border-text-secondary/10 shadow-lg px-6 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display font-bold text-[18px] tracking-tightest text-text-primary mb-4">
          Generate Onboarding Brief
        </h2>

        {loading && <p className="text-[13px] text-text-secondary">Loading…</p>}

        {!loading && (
          <div className="space-y-3">
            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Who is starting?</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] focus:outline-none focus:border-ink"
              />
              <div className="mt-2 max-h-32 overflow-y-auto border border-text-secondary/10 rounded-xl">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUserId(u.id)
                      setTeamId(u.team_id ?? teamId)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[12.5px] ${
                      userId === u.id ? 'bg-accent text-white' : 'text-text-primary hover:bg-surface'
                    }`}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className={`ml-2 text-[11px] ${userId === u.id ? 'text-white/60' : 'text-text-secondary'}`}>{u.email}</span>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="px-3 py-2 text-[12px] text-text-secondary">No matching users.</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Their role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                maxLength={200}
                className="w-full px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary block mb-1">Their team</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-text-secondary/10 text-[13px] focus:outline-none focus:border-ink bg-white"
              >
                <option value="">Select a team…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-text-secondary">
              The brief will be saved as a draft assigned to them. They'll see it in their Drafts.
            </p>

            {error && <p className="text-[12px] text-text-primary">{error}</p>}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || loading}
            onClick={submit}
            className="px-4 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Generating… ~10s' : 'Generate Brief'}
          </button>
        </div>
      </div>
    </div>
  )
}
