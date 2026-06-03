import { useMemo } from 'react'
import type { TimelinePushDTO } from '../../lib/api/endpoints'
import { TimelinePushCard } from './TimelinePushCard'

const SOURCE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'penlo_app', label: 'Penlo App' },
  { value: 'slack', label: 'Slack' },
  { value: 'mcp_standup', label: 'Standup' },
  { value: 'crm', label: 'CRM' },
]

function dayLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

type Props = {
  pushes: TimelinePushDTO[]
  selectedId: string | null
  filter: string
  onFilterChange: (v: string) => void
  onSelect: (push: TimelinePushDTO) => void
  hasMore: boolean
  loadingMore: boolean
  onLoadOlder: () => void
  loading: boolean
}

export function TimelinePushFeed({
  pushes,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
  hasMore,
  loadingMore,
  onLoadOlder,
  loading,
}: Props) {
  const visible = filter === 'all' ? pushes : pushes.filter((p) => p.source === filter)

  const grouped = useMemo(() => {
    const groups = new Map<string, TimelinePushDTO[]>()
    for (const p of visible) {
      const label = dayLabel(p.processed_at)
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label)!.push(p)
    }
    return [...groups.entries()].map(([label, items]) => ({ label, items }))
  }, [visible])

  return (
    <div className="flex flex-col h-full border-r border-black/[0.06] bg-canvas/50">
      <div className="px-3 py-3 border-b border-black/[0.06]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-2">
          Context pushes
        </p>
        <div className="flex gap-1 flex-wrap">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                filter === f.value
                  ? 'bg-accent text-white'
                  : 'bg-black/[0.04] text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <p className="text-[13px] text-text-secondary px-1 py-8 text-center">
            No pushes yet. Sync from Flow or connect Slack to build your context history.
          </p>
        )}

        {!loading &&
          grouped.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>
              <div className="space-y-2">
                {group.items.map((push) => (
                  <TimelinePushCard
                    key={push.id}
                    push={push}
                    selected={selectedId === push.id}
                    onSelect={() => onSelect(push)}
                  />
                ))}
              </div>
            </div>
          ))}

        {hasMore && !loading && (
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadOlder}
            className="w-full py-2 text-[12px] font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load older pushes'}
          </button>
        )}
      </div>
    </div>
  )
}
