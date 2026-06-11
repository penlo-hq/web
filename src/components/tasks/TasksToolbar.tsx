import { RefreshCw, Search } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatLastRefreshed } from './taskStatus'

type Props = {
  activeCount: number
  search: string
  onSearchChange: (q: string) => void
  isRefreshing: boolean
  lastRefreshedAt: Date | null
  onRefresh: () => void
}

export function TasksToolbar({
  activeCount,
  search,
  onSearchChange,
  isRefreshing,
  lastRefreshedAt,
  onRefresh,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {activeCount > 0 && (
          <Badge variant="accent">
            {activeCount} active
          </Badge>
        )}
        <span className="text-[12px] text-text-tertiary">{formatLastRefreshed(lastRefreshedAt)}</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-black/[0.04] disabled:opacity-50 transition-colors focus-ring"
          aria-label="Refresh tasks"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/30"
          aria-label="Search tasks"
        />
      </div>
    </div>
  )
}
