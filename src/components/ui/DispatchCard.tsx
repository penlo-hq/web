import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  GitBranch,
  Loader2,
  Network,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { Spinner } from './Spinner'
import { ConfirmModal } from './ConfirmModal'
import type { DispatchCardDTO } from '../../lib/api/endpoints'
import { isExpired } from '../dispatch/dispatchTime'

export type DispatchPhase = 'pending' | 'queued' | 'building' | 'complete' | 'failed'
export type DispatchActionState = 'idle' | 'auto' | 'queue' | 'discarding' | 'error'

type ApprovePayload = {
  mode: 'auto' | 'mcp'
  github_repo?: string
  github_base_branch?: string
}

type Props = {
  card: DispatchCardDTO
  phase: DispatchPhase
  action: DispatchActionState
  executorEnabled: boolean
  prUrl?: string | null
  failureError?: string | null
  relativeTime: string
  expiresLabel: string
  actionError?: string | null
  highlighted?: boolean
  onApprove: (payload: ApprovePayload) => void
  onDiscard: () => void
  onViewInBrain?: () => void
}

function TypeBadge({ nodeType }: { nodeType: string | null }) {
  if (!nodeType) return null
  const label = nodeType.charAt(0).toUpperCase() + nodeType.slice(1)
  const isTask = nodeType === 'task'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption-sm font-medium ${
        isTask ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
      }`}
    >
      <Zap className="w-3 h-3" />
      {label}
    </span>
  )
}

function StatusChip({ phase }: { phase: DispatchPhase }) {
  if (phase === 'pending') return null
  const config: Record<Exclude<DispatchPhase, 'pending'>, { label: string; className: string }> = {
    queued: { label: 'Queued', className: 'bg-black/[0.06] text-text-secondary' },
    building: { label: 'Building', className: 'bg-accent-tint text-accent' },
    complete: { label: 'PR opened', className: 'bg-green-50 text-green-700' },
    failed: { label: 'Failed', className: 'bg-destructive-tint text-destructive' },
  }
  const { label, className } = config[phase]
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-caption-sm font-semibold shrink-0 ${className}`}>
      {label}
    </span>
  )
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
  actionError,
  highlighted = false,
  onApprove,
  onDiscard,
  onViewInBrain,
}: Props) {
  const busy = action === 'auto' || action === 'queue' || action === 'discarding'
  const simple = card.complexity === 'simple'
  const complex = card.complexity === 'complex'
  const expired = phase === 'pending' && isExpired(card.expires_at)
  const [expanded, setExpanded] = useState(false)
  const [briefExpanded, setBriefExpanded] = useState(false)
  const [traceExpanded, setTraceExpanded] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [autoBuildOpen, setAutoBuildOpen] = useState(false)
  const [repoInput, setRepoInput] = useState(card.github_repo ?? '')
  const [branchInput, setBranchInput] = useState(card.github_base_branch ?? 'main')

  const hasContext =
    card.detail ||
    card.acceptance_criteria.length > 0 ||
    card.related_people.length > 0 ||
    card.related_decisions.length > 0
  const needsDiscardConfirm = hasContext || Boolean(card.build_brief_preview)

  function openAutoBuildPanel() {
    setRepoInput(card.github_repo ?? '')
    setBranchInput(card.github_base_branch ?? 'main')
    setAutoBuildOpen(true)
  }

  function confirmAutoBuild() {
    onApprove({
      mode: 'auto',
      github_repo: repoInput.trim() || undefined,
      github_base_branch: branchInput.trim() || 'main',
    })
    setAutoBuildOpen(false)
  }

  function handleDiscardClick() {
    if (needsDiscardConfirm) {
      setDiscardOpen(true)
    } else {
      onDiscard()
    }
  }

  return (
    <>
      <Card
        shadow
        padding="lg"
        className={`space-y-2 transition-shadow ${
          expired ? 'opacity-60' : ''
        } ${highlighted ? 'ring-2 ring-accent ring-offset-2' : ''}`}
      >
        <div className="flex items-start gap-2">
          <div className="text-body font-semibold text-text-primary leading-snug flex-1">
            {card.feature_label}
          </div>
          <StatusChip phase={phase} />
          <TypeBadge nodeType={card.node_type} />
        </div>

        {onViewInBrain && card.feature_node_id && (
          <button
            type="button"
            onClick={onViewInBrain}
            className="inline-flex items-center gap-1 text-caption-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <Network className="w-3 h-3" />
            View in Company Brain
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        )}

        {card.feature_summary && phase === 'pending' && (
          <p className="text-caption text-text-secondary leading-relaxed line-clamp-2">
            {card.feature_summary}
          </p>
        )}

        {phase === 'pending' && complex && (
          <p className="text-caption-sm text-text-tertiary bg-black/[0.03] rounded-lg px-2.5 py-2">
            This work looks complex — <span className="font-medium text-text-secondary">Queue for dev</span> is recommended.
          </p>
        )}

        {phase === 'pending' && (
          <div className="text-caption-sm uppercase tracking-section text-text-secondary">
            {(card.source || 'unknown').toUpperCase()} · extracted {relativeTime} ·{' '}
            {expired ? 'Expired' : expiresLabel}
          </div>
        )}

        {phase === 'pending' && hasContext && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-caption-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              {expanded ? 'Hide context' : 'Show context'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {expanded && (
              <div className="space-y-3 pl-1 border-l-2 border-accent/20 ml-0.5">
                {card.detail && (
                  <div className="pl-3">
                    <p className="text-caption text-text-secondary leading-relaxed">{card.detail}</p>
                  </div>
                )}
                {card.acceptance_criteria.length > 0 && (
                  <div className="pl-3 space-y-1">
                    <p className="text-caption-sm font-medium text-text-secondary uppercase tracking-section">
                      Acceptance criteria
                    </p>
                    <ul className="space-y-0.5">
                      {card.acceptance_criteria.map((criterion, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-caption text-text-secondary">
                          <span className="text-accent mt-0.5 shrink-0">•</span>
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {card.related_people.length > 0 && (
                  <div className="pl-3 space-y-1">
                    <p className="text-caption-sm font-medium text-text-secondary uppercase tracking-section">
                      People involved
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {card.related_people.map((person, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/[0.04] rounded-full text-caption-sm text-text-secondary"
                        >
                          <Users className="w-3 h-3" />
                          {person.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {card.related_decisions.length > 0 && (
                  <div className="pl-3 space-y-1">
                    <p className="text-caption-sm font-medium text-text-secondary uppercase tracking-section">
                      Related decisions
                    </p>
                    <ul className="space-y-1">
                      {card.related_decisions.map((decision, i) => (
                        <li key={i} className="text-caption text-text-secondary">
                          <span className="font-medium">{decision.label}</span>
                          {decision.detail && (
                            <span className="text-text-tertiary"> — {decision.detail}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase === 'pending' && card.build_brief_preview && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setBriefExpanded(!briefExpanded)}
              className="inline-flex items-center gap-1 text-caption-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <FileText className="w-3 h-3" />
              {briefExpanded ? 'Hide build plan' : 'What the agent will build'}
              {briefExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {briefExpanded && (
              <div className="pl-3 border-l-2 border-blue-200 ml-0.5">
                <p className="text-caption text-text-secondary leading-relaxed whitespace-pre-line">
                  {card.build_brief_preview}
                </p>
              </div>
            )}
          </div>
        )}

        {phase === 'queued' && (
          <div className="flex items-center gap-1.5 text-caption text-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            Queued for developer — ready for MCP or manual pickup
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
                className="text-accent font-medium hover:underline underline-offset-2 inline-flex items-center gap-1"
              >
                View PR
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {phase === 'failed' && (
          <div className="space-y-2">
            {failureError && (
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-caption-sm text-destructive">{failureError}</p>
              </div>
            )}
            {card.execution_trace && card.execution_trace.length > 0 && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setTraceExpanded(!traceExpanded)}
                  className="inline-flex items-center gap-1 text-caption-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {traceExpanded ? 'Hide trace' : 'Show execution trace'}
                  {traceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {traceExpanded && (
                  <div className="space-y-1 pl-2 border-l-2 border-destructive/20 ml-0.5">
                    {card.execution_trace.map((entry, i) => (
                      <div key={i} className="text-caption-sm font-mono text-text-tertiary">
                        <span className="text-text-secondary">{entry.tool}</span>
                        {' → '}
                        <span className="line-clamp-2">{entry.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                disabled={action === 'auto' || action === 'queue'}
                onClick={() => onApprove({ mode: 'mcp' })}
              >
                {action === 'queue' ? 'Queuing…' : 'Retry as queue'}
              </Button>
              {executorEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={action === 'auto' || action === 'queue'}
                  onClick={openAutoBuildPanel}
                >
                  {action === 'auto' ? 'Starting…' : 'Retry auto-build'}
                </Button>
              )}
            </div>
          </div>
        )}

        {phase === 'pending' && !expired && (
          <>
            {actionError && (
              <p className="text-caption-sm text-destructive">{actionError}</p>
            )}
            {action === 'error' && !actionError && (
              <p className="text-caption-sm text-destructive">Couldn&apos;t update — try again.</p>
            )}

            {autoBuildOpen && (
              <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-3 space-y-3">
                <p className="text-caption-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Configure auto-build target
                </p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-caption-sm font-medium text-text-secondary" htmlFor={`repo-${card.id}`}>
                      GitHub repo
                      <span className="text-text-tertiary font-normal"> (owner/repo)</span>
                    </label>
                    <input
                      id={`repo-${card.id}`}
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="e.g. myorg/my-app"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 bg-white text-caption text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-caption-sm font-medium text-text-secondary" htmlFor={`branch-${card.id}`}>
                      Base branch
                    </label>
                    <input
                      id={`branch-${card.id}`}
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      placeholder="main"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 bg-white text-caption text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !repoInput.trim()}
                    onClick={confirmAutoBuild}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption-sm font-semibold bg-accent text-white hover:bg-accent/90 disabled:opacity-40 transition-colors focus-ring"
                  >
                    {action === 'auto' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {action === 'auto' ? 'Starting…' : 'Build it'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoBuildOpen(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption-sm font-medium text-text-secondary hover:text-text-primary transition-colors focus-ring"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 items-center pt-1 flex-wrap">
              {executorEnabled && !autoBuildOpen && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={openAutoBuildPanel}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption-sm font-semibold transition-colors disabled:opacity-40 focus-ring ${
                    simple || !complex
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-accent-tint text-accent hover:bg-accent/15'
                  }`}
                >
                  {action === 'auto' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {action === 'auto' ? 'Starting…' : 'Auto-build'}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => onApprove({ mode: 'mcp' })}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption-sm font-semibold transition-colors disabled:opacity-40 focus-ring ${
                  complex
                    ? 'bg-accent text-white hover:bg-accent/90'
                    : 'bg-accent-tint text-accent hover:bg-accent/15'
                }`}
              >
                {action === 'queue' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {action === 'queue' ? 'Queuing…' : 'Queue for dev'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDiscardClick}
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

      <ConfirmModal
        open={discardOpen}
        title="Discard dispatch?"
        message={`Remove "${card.feature_label}" from your inbox? This cannot be undone.`}
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setDiscardOpen(false)
          onDiscard()
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}
