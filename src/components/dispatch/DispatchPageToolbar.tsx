import { RefreshCw } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatLastRefreshed } from './dispatchTime'

type Props = {
  pendingCount: number
  isRefreshing: boolean
  lastRefreshedAt: Date | null
  onRefresh: () => void
}

export function DispatchPageToolbar({
  pendingCount,
  isRefreshing,
  lastRefreshedAt,
  onRefresh,
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap max-w-3xl">
      {pendingCount > 0 && (
        <Badge pulse variant="accent">
          {pendingCount} pending
        </Badge>
      )}
      <span className="text-[12px] text-text-tertiary">
        {formatLastRefreshed(lastRefreshedAt)}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-black/[0.04] disabled:opacity-50 transition-colors focus-ring"
        aria-label="Refresh dispatches"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  )
}
