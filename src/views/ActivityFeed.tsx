import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { ActivityCard } from '../components/activity/ActivityCard'
import { EmptyState } from '../components/ui'
import { activityApi } from '../lib/api/endpoints'
import { useActivityStore } from '../store/activityStore'
import type { ActivityEventDTO } from '../lib/api/endpoints'
import type { PageProps } from '../types/layout'

function dayLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function groupByDay(events: ActivityEventDTO[]): { label: string; events: ActivityEventDTO[] }[] {
  const groups: Map<string, ActivityEventDTO[]> = new Map()
  for (const e of events) {
    const label = dayLabel(e.processed_at)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(e)
  }
  return [...groups.entries()].map(([label, events]) => ({ label, events }))
}

const SOURCE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'penlo_app', label: 'Penlo App' },
  { value: 'slack', label: 'Slack' },
  { value: 'mcp_standup', label: 'Standup' },
  { value: 'crm', label: 'CRM' },
]

export function ActivityFeed({ onMenuClick }: PageProps) {
  const events = useActivityStore((s) => s.events)
  const hasMore = useActivityStore((s) => s.hasMore)
  const nextCursor = useActivityStore((s) => s.nextCursor)
  const setInitial = useActivityStore((s) => s.setInitial)
  const appendOlder = useActivityStore((s) => s.appendOlder)
  const clearUnread = useActivityStore((s) => s.clearUnread)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    clearUnread()
  }, [clearUnread])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    activityApi
      .list({ limit: 50 })
      .then((data) => {
        if (cancelled) return
        setInitial(data.events, data.has_more, data.next_cursor)
      })
      .catch(() => {
        if (cancelled) return
        setError("Couldn't load activity.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [setInitial])

  async function loadOlder() {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const data = await activityApi.list({ before: nextCursor, limit: 50 })
      appendOlder(data.events, data.has_more, data.next_cursor)
    } catch {
      setError("Couldn't load older activity.")
    } finally {
      setLoadingMore(false)
    }
  }

  const visible = filter === 'all' ? events : events.filter((e) => e.source === filter)
  const grouped = useMemo(() => groupByDay(visible), [visible])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar onMenuClick={onMenuClick} title="Activity" subtitle="What the brain learned" />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Source filters */}
        <div className="flex gap-1.5 flex-wrap mb-5 max-w-2xl">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-colors ${
                filter === f.value
                  ? 'bg-accent text-white'
                  : 'bg-black/[0.04] text-text-secondary hover:bg-black/[0.08] hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-2 max-w-2xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="max-w-2xl">
            <EmptyState
              icon={Activity}
              title="Couldn't load activity"
              description={error}
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Connect Slack or run a sync from your Penlo device to start capturing context."
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="max-w-2xl space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[11px] font-semibold tracking-[0.10em] text-text-tertiary uppercase whitespace-nowrap">
                    {group.label}
                  </p>
                  <div className="flex-1 h-px bg-black/[0.06]" />
                </div>
                <div className="space-y-2">
                  {group.events.map((e) => (
                    <ActivityCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={loadOlder}
                  className="px-4 py-2 rounded-xl border border-border text-[12px] font-medium text-text-secondary hover:text-text-primary hover:bg-black/[0.03] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load older activity'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
