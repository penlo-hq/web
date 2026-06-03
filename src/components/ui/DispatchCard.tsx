import { CheckCircle2, Clock, Loader2, X } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { Spinner } from './Spinner'
import type { DispatchCardDTO } from '../../lib/api/endpoints'

export type DispatchPhase = 'pending' | 'queued' | 'building' | 'complete' | 'failed'
export type DispatchActionState = 'idle' | 'auto' | 'queue' | 'discarding' | 'error'

type Props = {
  card: DispatchCardDTO
  phase: DispatchPhase
  action: DispatchActionState
  executorEnabled: boolean
  prUrl?: string | null
  failureError?: string | null
  relativeTime: string
  expiresLabel: string
  onApprove: (mode: 'auto' | 'mcp') => void
  onDiscard: () => void
}

export function DispatchCard({
  card,
  phase,
  action,
  executorEnabled,
  prUrl,
  failureError,
  relativeTime,
  expiresLabel,
  onApprove,
  onDiscard,
}: Props) {
  const busy = action === 'auto' || action === 'queue' || action === 'discarding'
  const simple = card.complexity === 'simple'
  const complex = card.complexity === 'complex'

  return (
    <Card shadow padding="lg" className="space-y-2">
      <div className="text-body font-semibold text-text-primary leading-snug">
        {card.feature_label}
      </div>

      {card.feature_summary && phase === 'pending' && (
        <p className="text-caption text-text-secondary leading-relaxed line-clamp-2">
          {card.feature_summary}
        </p>
      )}

      {phase === 'pending' && (
        <div className="text-caption-sm uppercase tracking-section text-text-secondary">
          {(card.source || 'unknown').toUpperCase()} · extracted {relativeTime} · {expiresLabel}
        </div>
      )}

      {phase === 'queued' && (
        <div className="flex items-center gap-1.5 text-caption text-text-secondary">
          <Clock className="w-3.5 h-3.5" />
          Queued for developer
        </div>
      )}

      {phase === 'building' && (
        <div className="flex items-center gap-2 text-caption text-text-secondary">
          <Spinner size="sm" />
          Building…
        </div>
      )}

      {phase === 'complete' && (
        <div className="flex items-center gap-3 text-caption text-text-secondary flex-wrap">
          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PR opened
          </span>
          {prUrl && /^https?:\/\//i.test(prUrl) && (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent font-medium hover:underline underline-offset-2"
            >
              View PR
            </a>
          )}
        </div>
      )}

      {phase === 'failed' && (
        <div className="space-y-2">
          {failureError && (
            <p className="text-caption-sm text-destructive line-clamp-2">{failureError}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={action === 'queue'}
            onClick={() => onApprove('mcp')}
          >
            {action === 'queue' ? 'Queuing…' : 'Retry as queue'}
          </Button>
        </div>
      )}

      {phase === 'pending' && (
        <>
          {action === 'error' && (
            <p className="text-caption-sm text-destructive">Couldn&apos;t update — try again.</p>
          )}
          <div className="flex gap-2 items-center pt-1">
            {executorEnabled && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onApprove('auto')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption-sm font-semibold transition-colors disabled:opacity-40 focus-ring ${
                  simple || !complex
                    ? 'bg-accent text-white hover:bg-accent/90'
                    : 'bg-accent-tint text-accent hover:bg-accent/15'
                }`}
              >
                {action === 'auto' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : null}
                {action === 'auto' ? 'Starting…' : 'Auto-build'}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onApprove('mcp')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption-sm font-semibold transition-colors disabled:opacity-40 focus-ring ${
                complex
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-accent-tint text-accent hover:bg-accent/15'
              }`}
            >
              {action === 'queue' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : null}
              {action === 'queue' ? 'Queuing…' : 'Queue for dev'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onDiscard}
              aria-label="Discard"
              className="ml-auto w-7 h-7 flex items-center justify-center rounded-full bg-black/[0.06] text-text-secondary hover:bg-black/[0.1] transition-colors disabled:opacity-40 focus-ring"
            >
              {action === 'discarding' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </>
      )}
    </Card>
  )
}
