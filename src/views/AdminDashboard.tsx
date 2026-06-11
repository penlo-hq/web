import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { StatCard } from '../components/admin/StatCard'
import { BrainHealthBar } from '../components/admin/BrainHealthBar'
import { OnboardingBriefModal } from '../components/admin/OnboardingBriefModal'
import { adminApi, type AdminStatsDTO, type AdminUserRowDTO } from '../lib/api/endpoints'
import { NODE_TYPE_LABEL, type NodeType } from '../types/graph'
import type { PageProps } from '../types/layout'

function relativeFrom(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return `${Math.floor(seconds)}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function useAdminStats() {
  const [stats, setStats] = useState<AdminStatsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)

  const load = useCallback(async (refresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.getStats({ refresh })
      setStats(data)
      setRefreshedAt(new Date().toISOString())
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail === 'stats_timeout' ? 'Stats query timed out. Try again.' : "Couldn't load stats.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refresh: () => load(true), refreshedAt }
}

function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRowDTO[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMore = useCallback(async (resetCursor: string | null = cursor) => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.listUsers(resetCursor ?? undefined)
      setUsers((prev) => (resetCursor ? [...prev, ...data.users] : data.users))
      setCursor(data.next_cursor)
    } catch {
      setError("Couldn't load users.")
    } finally {
      setLoading(false)
    }
  }, [cursor])

  useEffect(() => {
    loadMore(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { users, cursor, loading, error, loadMore }
}

export function AdminDashboard({ onMenuClick }: PageProps) {
  const { stats, loading: statsLoading, error: statsError, refresh, refreshedAt } = useAdminStats()
  const { users, cursor, loading: usersLoading, error: usersError, loadMore } = useAdminUsers()
  const [briefOpen, setBriefOpen] = useState(false)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar onMenuClick={onMenuClick} title="Admin Dashboard" subtitle="Brain health & roster" />
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <Link
          to="/admin/drafts"
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-white hover:border-accent/30 hover:shadow-card transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-accent-tint flex items-center justify-center text-accent shrink-0">
            <FileText className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-text-primary group-hover:text-accent transition-colors">
              Drafts & onboarding briefs
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Review formatted communications before sharing with your team
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-text-secondary">
            {refreshedAt ? `Last refreshed ${relativeFrom(refreshedAt)}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={statsLoading}
              className="px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setBriefOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity"
            >
              Generate Brief
            </button>
          </div>
        </div>

        {statsError && <p className="text-[13px] text-text-primary">{statsError}</p>}

        {stats && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Nodes" value={stats.node_counts.total} icon="database" />
              <StatCard label="Active Nodes" value={stats.node_counts.active} sublabel={`${stats.node_counts.stale} stale`} icon="activity" />
              <StatCard label="Users" value={stats.user_counts.total} icon="users" />
              <StatCard label="Teams" value={stats.team_count} icon="team" />
              <StatCard label="Events (7d)" value={stats.ingestion_events_7d} icon="zap" />
              <StatCard label="Events (30d)" value={stats.ingestion_events_30d} icon="zap" />
              <StatCard label="Active Users (30d)" value={stats.active_users_30d} icon="trending" />
              <StatCard label="Slack Workspaces" value={stats.slack_workspaces_connected} icon="slack" />
            </section>

            <section className="p-5 rounded-2xl border border-border bg-white space-y-4">
              <h2 className="font-semibold text-[15px] text-text-primary tracking-[-0.01em]">Brain Health</h2>
              <BrainHealthBar label="Embedded" value={stats.brain_health.pct_embedded} />
              <BrainHealthBar label="Fresh" value={stats.brain_health.pct_fresh} />
            </section>

            <section className="p-5 rounded-2xl border border-border bg-white space-y-3">
              <h2 className="font-semibold text-[15px] text-text-primary tracking-[-0.01em]">Nodes by Type</h2>
              <NodeTypeBreakdown byType={stats.node_counts.by_type} />
            </section>
          </>
        )}

        <section className="p-5 rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[15px] text-text-primary tracking-[-0.01em]">Team Members</h2>
          </div>
          <RecentUsersTable users={users} loading={usersLoading} error={usersError} />
          {cursor && !usersLoading && (
            <button
              type="button"
              onClick={() => loadMore(cursor)}
              className="mt-4 px-3 py-1.5 rounded-xl border border-border text-[12px] text-text-secondary hover:text-text-primary hover:bg-black/[0.03] transition-colors"
            >
              Load more
            </button>
          )}
        </section>
      </div>

      <OnboardingBriefModal
        isOpen={briefOpen}
        onClose={() => setBriefOpen(false)}
        onGenerated={() => setBriefOpen(false)}
      />
    </motion.div>
  )
}

function NodeTypeBreakdown({ byType }: { byType: Record<string, number> }) {
  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    return <p className="text-[12.5px] text-text-secondary">No nodes yet.</p>
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map(([type, count]) => (
        <li
          key={type}
          className="px-3 py-1 rounded-full border border-text-secondary/10 bg-surface text-[11.5px] text-text-primary"
        >
          {NODE_TYPE_LABEL[type as NodeType] ?? type} <span className="text-text-secondary ml-1">{count}</span>
        </li>
      ))}
    </ul>
  )
}

function RecentUsersTable({ users, loading, error }: { users: AdminUserRowDTO[]; loading: boolean; error: string | null }) {
  if (loading && users.length === 0) return <p className="text-[12.5px] text-text-secondary">Loading…</p>
  if (error) return <p className="text-[12.5px] text-text-primary">{error}</p>
  if (users.length === 0) return <p className="text-[12.5px] text-text-secondary">No users yet.</p>
  return (
    <table className="w-full text-[12.5px]">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-text-secondary">
          <th className="py-2 font-normal">Name</th>
          <th className="py-2 font-normal">Email</th>
          <th className="py-2 font-normal">Role</th>
          <th className="py-2 font-normal">Team</th>
          <th className="py-2 font-normal">Joined</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/[0.05]">
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
            <td className="py-2.5 text-text-primary font-medium text-[13px]">{u.name}</td>
            <td className="py-2.5 text-text-secondary text-[12.5px]">{u.email}</td>
            <td className="py-2.5">
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                u.role === 'admin' ? 'bg-accent-tint text-accent'
                : u.role === 'team_lead' ? 'bg-warning-tint text-warning'
                : 'bg-black/[0.05] text-text-secondary'
              }`}>
                {u.role}
              </span>
            </td>
            <td className="py-2.5 text-text-secondary text-[12.5px]">{u.team_name ?? '—'}</td>
            <td className="py-2.5 text-text-secondary text-[12.5px]">{relativeFrom(u.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
