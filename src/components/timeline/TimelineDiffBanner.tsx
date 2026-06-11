import type { TimelinePushDTO } from '../../lib/api/endpoints'

type Props = {
  push: TimelinePushDTO | null
  snapshotAt: string | null
  isLive: boolean
}

export function TimelineDiffBanner({ push, snapshotAt, isLive }: Props) {
  if (isLive) {
    return (
      <div className="px-4 py-2 border-b border-border bg-accent/5 text-[12px] text-text-secondary">
        <span className="font-semibold text-accent">Live</span> — current company graph
      </div>
    )
  }

  if (!push) return null

  const parts: string[] = []
  if (push.delta.created > 0) parts.push(`added ${push.delta.created} node${push.delta.created === 1 ? '' : 's'}`)
  if (push.delta.merged > 0) parts.push(`updated ${push.delta.merged}`)
  if (push.delta.edges > 0) parts.push(`added ${push.delta.edges} edge${push.delta.edges === 1 ? '' : 's'}`)

  const when = snapshotAt
    ? new Date(snapshotAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date(push.processed_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  return (
    <div className="px-4 py-2.5 border-b border-border bg-white text-[12px] animate-fade-in">
      <span className="font-semibold text-text-primary">{push.user_name || 'System'}</span>
      <span className="text-text-secondary">
        {' '}
        · {parts.length > 0 ? parts.join(', ') : 'context push'} · graph as of {when}
      </span>
      {push.graph_totals_at_snapshot && (
        <span className="text-text-tertiary block mt-0.5">
          {push.graph_totals_at_snapshot.nodes} nodes · {push.graph_totals_at_snapshot.edges} edges at snapshot
        </span>
      )}
    </div>
  )
}
