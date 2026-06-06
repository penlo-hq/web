import type { TimelinePushDTO } from '../../lib/api/endpoints'
import { NODE_TYPE_LABEL, type NodeType } from '../../types/graph'

const SOURCE_LABEL: Record<string, string> = {
  penlo_app: 'Penlo App',
  slack: 'Slack',
  mcp_standup: 'Standup',
  crm: 'CRM',
  penlo_audio: 'Penlo App',
  mcp_direct: 'MCP',
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  push: TimelinePushDTO
  selected: boolean
  onSelect: () => void
}

export function TimelinePushCard({ push, selected, onSelect }: Props) {
  const sourceLabel = SOURCE_LABEL[push.source] ?? push.source
  const who = push.user_name || 'System'
  const deltaParts: string[] = []
  if (push.delta.created > 0) deltaParts.push(`+${push.delta.created} node${push.delta.created === 1 ? '' : 's'}`)
  if (push.delta.merged > 0) deltaParts.push(`~${push.delta.merged} merged`)
  if (push.delta.edges > 0) deltaParts.push(`+${push.delta.edges} edge${push.delta.edges === 1 ? '' : 's'}`)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-3 rounded-xl border transition-all focus-ring ${
        selected
          ? 'border-accent bg-accent/5 shadow-sm'
          : 'border-border bg-white hover:border-accent/25 hover:bg-black/[0.02]'
      }`}
    >
      <div className="flex items-start gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[11px] font-semibold text-accent">
          {who.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-text-primary truncate">{who}</span>
            <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{sourceLabel}</span>
          </div>
          <p className="text-[10.5px] text-text-tertiary mt-0.5">
            {relativeTime(push.processed_at)} · {formatAbsolute(push.processed_at)}
          </p>
        </div>
      </div>

      {push.summary && (
        <p className="text-[12px] text-text-secondary leading-snug line-clamp-2 mb-2 pl-9">{push.summary}</p>
      )}

      {deltaParts.length > 0 && (
        <p className="text-[11px] font-medium text-accent pl-9 mb-2">{deltaParts.join(' · ')}</p>
      )}

      {push.graph_totals_at_snapshot && (
        <p className="text-[10.5px] text-text-tertiary pl-9 mb-2">
          Graph then: {push.graph_totals_at_snapshot.nodes} nodes · {push.graph_totals_at_snapshot.edges} edges
        </p>
      )}

      {push.nodes.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-9">
          {push.nodes.map((n) => (
            <span
              key={n.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10.5px] text-text-primary bg-black/[0.02]"
            >
              <span className="font-medium">{n.label}</span>
              <span className="text-text-tertiary">
                {NODE_TYPE_LABEL[n.type as NodeType] ?? n.type}
              </span>
            </span>
          ))}
          {push.nodes_hidden > 0 && (
            <span className="text-[10px] text-text-tertiary self-center">+{push.nodes_hidden} more</span>
          )}
        </div>
      )}
    </button>
  )
}
