import type { ActivityEvent } from '../../store/activityStore'
import { NodeChip } from './NodeChip'

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString()
}

type Props = { event: ActivityEvent }

const SOURCE_LABEL: Record<string, string> = {
  penlo_app: 'Penlo App',
  slack: 'Slack',
  mcp_standup: 'Standup',
  crm: 'CRM',
  penlo_audio: 'Penlo App',
  mcp_direct: 'MCP',
}

export function ActivityCard({ event }: Props) {
  const sourceLabel = SOURCE_LABEL[event.source] ?? event.source
  const who = event.user_name || 'System'
  const when = relativeTime(event.processed_at)

  return (
    <article className="px-4 py-3 rounded-xl border border-text-secondary/10 bg-white hover:border-accent/30 transition-colors">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[12px] font-medium text-text-primary">{who}</span>
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-text-secondary">{sourceLabel}</span>
        <span className="text-[10.5px] text-text-secondary ml-auto">{when}</span>
      </div>
      {event.summary && (
        <p className="text-[12.5px] text-text-secondary leading-snug line-clamp-2 mb-2">{event.summary}</p>
      )}
      {event.node_ids.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.node_ids.slice(0, 6).map((nid) => (
            <NodeChip key={nid} nodeId={nid} />
          ))}
          {event.node_count > event.node_ids.length && (
            <span className="text-[10.5px] text-text-secondary self-center">
              +{event.node_count - event.node_ids.length} hidden
            </span>
          )}
        </div>
      )}
    </article>
  )
}
