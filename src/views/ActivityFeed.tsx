import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { ActivityCard } from '../components/activity/ActivityCard'
import { activityApi } from '../lib/api/endpoints'
import { useActivityStore } from '../store/activityStore'
import type { PageProps } from '../types/layout'

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar onMenuClick={onMenuClick} title="Activity" subtitle="What the brain just learned" />
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex gap-1.5 mb-5 max-w-2xl">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.16em] transition-colors ${
                filter === f.value
                  ? 'bg-accent text-white'
                  : 'border border-text-secondary/10 text-text-secondary hover:border-accent/30 hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-2 max-w-2xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl border border-text-secondary/10 bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="max-w-2xl">
            <p className="text-[13px] text-text-secondary">{error}</p>
            <button
              type="button"
              className="mt-2 text-[11px] uppercase tracking-[0.16em] text-text-primary hover:opacity-70"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="max-w-md mx-auto mt-12 px-6 py-8 rounded-xl border border-text-secondary/10 bg-surface text-center">
            <p className="text-[13px] text-text-secondary">
              Nothing has flowed into the brain in the last 24 hours.
            </p>
            <p className="text-[12px] text-text-secondary mt-2">
              Connect Slack or run a sync from your Penlo device to get started.
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="space-y-2 max-w-2xl">
            {visible.map((e) => (
              <ActivityCard key={e.id} event={e} />
            ))}
            {hasMore && (
              <div className="pt-3 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={loadOlder}
                  className="text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load older'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
