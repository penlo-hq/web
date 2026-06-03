import { Link2, Mic, MessageSquare, Smartphone } from 'lucide-react'
import type { Citation, GraphNodeWithSource } from '../../types/graph'
import { NODE_TYPE_LABEL } from '../../types/graph'

function sourceLabel(source?: string): string {
  if (!source) return 'Knowledge graph'
  const s = source.toLowerCase()
  if (s.includes('penlo') || s.includes('flow') || s.includes('brain')) return 'Flow / Penlo sync'
  if (s.includes('slack')) return 'Slack'
  if (s.includes('standup') || s.includes('meeting')) return 'Meeting capture'
  return source
}

function SourceIcon({ source }: { source?: string }) {
  const s = (source ?? '').toLowerCase()
  if (s.includes('slack')) return <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
  if (s.includes('penlo') || s.includes('flow')) return <Smartphone className="w-3.5 h-3.5" strokeWidth={1.75} />
  if (s.includes('standup') || s.includes('meeting')) return <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />
  return <Link2 className="w-3.5 h-3.5" strokeWidth={1.75} />
}

function formatWhen(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 48) return `${hr}h ago`
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

export function buildSourcesFromResponse(
  citations: Citation[],
  relevantNodes: GraphNodeWithSource[],
): Citation[] {
  if (citations.length > 0) return citations
  return relevantNodes.slice(0, 8).map((n) => ({
    node_id: n.id,
    label: n.label,
    type: n.type,
    importance: n.importance,
    contribution: (n.detail ?? '').slice(0, 120) || `Context node: ${n.label}`,
    near_expiry: n.near_expiry,
    detail_snippet: n.detail?.slice(0, 240),
    source_event: n._source_event,
  }))
}

type Props = {
  sources: Citation[]
  onOpenNode: (nodeId: string) => void
}

export function SourcesPanel({ sources, onOpenNode }: Props) {
  if (sources.length === 0) return null

  return (
    <div className="mt-4 pt-3 border-t border-black/[0.08]">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Where this came from
        </span>
        <span className="text-[11px] text-text-tertiary">({sources.length})</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {sources.map((c) => (
          <button
            key={c.node_id}
            type="button"
            onClick={() => onOpenNode(c.node_id)}
            className="text-left p-3 rounded-xl border border-black/[0.08] bg-canvas hover:border-accent/30 hover:bg-accent-tint/30 transition-all focus-ring group"
          >
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent-tint flex items-center justify-center shrink-0 text-accent">
                <SourceIcon source={c.source_event?.source} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {NODE_TYPE_LABEL[c.type] ?? c.type}
                </p>
                <p className="text-[13px] font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                  {c.label}
                </p>
                {c.source_event && (
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    {sourceLabel(c.source_event.source)}
                    {c.source_event.processed_at
                      ? ` · ${formatWhen(c.source_event.processed_at)}`
                      : ''}
                  </p>
                )}
                {(c.detail_snippet || c.contribution) && (
                  <p className="text-[12px] text-text-secondary mt-1 line-clamp-2 leading-snug">
                    {c.detail_snippet ?? c.contribution}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-tertiary mt-2">
        Tap a source to open it in Company Brain
      </p>
    </div>
  )
}
