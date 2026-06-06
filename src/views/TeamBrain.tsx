import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GraphCanvas } from '../components/graph/GraphCanvas'
import { BrainGraphLayout } from '../components/graph/BrainGraphLayout'
import { useGraphStore } from '../store/graphStore'
import { useAuthStore } from '../store/authStore'
import { graphApi, teamsApi, type TeamDTO } from '../lib/api/endpoints'
import { Button } from '../components/ui/Button'
import type { PageProps } from '../types/layout'

export function TeamBrain({ onMenuClick }: PageProps) {
  const { teamId: paramTeamId } = useParams<{ teamId?: string }>()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes)
  const searchQuery = useGraphStore((s) => s.searchQuery)
  const selectedId = useGraphStore((s) => s.selectedId)
  const setSelected = useGraphStore((s) => s.setSelected)
  const setGraph = useGraphStore((s) => s.setGraph)
  const setLoading = useGraphStore((s) => s.setLoading)
  const layoutMode = useGraphStore((s) => s.layoutMode)
  const loading = useGraphStore((s) => s.isLoading)

  const [teams, setTeams] = useState<TeamDTO[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(paramTeamId ?? user?.team_id ?? null)
  const [error, setError] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    teamsApi.list().then(setTeams).catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    if (paramTeamId) {
      setActiveTeamId(paramTeamId)
      return
    }
    if (user?.team_id && !activeTeamId) {
      setActiveTeamId(user.team_id)
      navigate(`/brain/team/${user.team_id}`, { replace: true })
    }
  }, [paramTeamId, user?.team_id, activeTeamId, navigate])

  const activeTeam = teams.find((t) => t.id === activeTeamId)

  const load = useCallback(() => {
    if (!activeTeamId) return
    setError(false)
    setForbidden(false)
    setLoading(true)
    graphApi
      .team(activeTeamId)
      .then((data) => setGraph(data.nodes, data.edges))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 403) setForbidden(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }, [activeTeamId, setGraph, setLoading])

  useEffect(() => {
    void load()
  }, [load])

  if (!activeTeamId && teams.length === 0 && !loading) {
    return (
      <BrainGraphLayout title="Team Brain" subtitle="Team-scoped knowledge" onMenuClick={onMenuClick} loading={false} error={false} onRetry={() => {}}>
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <p className="text-body text-text-secondary max-w-md">
            You&apos;re not on a team yet. Ask an admin to assign you, or create teams in{' '}
            <Link to="/admin/teams" className="text-accent hover:underline">Teams</Link>.
          </p>
        </div>
      </BrainGraphLayout>
    )
  }

  return (
    <BrainGraphLayout
      title={activeTeam ? `${activeTeam.name} Brain` : 'Team Brain'}
      subtitle="Knowledge scoped to this team"
      onMenuClick={onMenuClick}
      loading={loading}
      error={error}
      onRetry={load}
      headerExtra={
        teams.length > 1 ? (
          <select
            value={activeTeamId ?? ''}
            onChange={(e) => navigate(`/brain/team/${e.target.value}`)}
            className="text-caption px-3 py-1.5 rounded-xl border border-border bg-canvas"
            aria-label="Select team"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.is_private ? ' (private)' : ''}</option>
            ))}
          </select>
        ) : undefined
      }
    >
      {forbidden ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
          <p className="text-body text-text-secondary">This is a private team you don&apos;t belong to.</p>
          <Link to="/brain/company"><Button size="sm" variant="secondary">View company brain</Button></Link>
        </div>
      ) : (
        <GraphCanvas
          nodes={Array.from(nodes.values())}
          edges={Array.from(edges.values())}
          hiddenTypes={hiddenTypes}
          searchQuery={searchQuery}
          selectedId={selectedId}
          onSelect={setSelected}
          layoutMode={layoutMode}
        />
      )}
    </BrainGraphLayout>
  )
}
