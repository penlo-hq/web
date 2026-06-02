import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { dispatchApi, type DispatchCardDTO } from '../lib/api/endpoints'
import { useDispatchStore, type BuildPhase } from '../store/dispatchStore'

// Transient per-card UI state for in-flight requests (separate from the
// server-driven dispatch.status and the WS-driven build phase).
type ActionState = 'idle' | 'auto' | 'queue' | 'discarding' | 'error'

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
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function expiresLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const totalMin = Math.floor(ms / 60_000)
  const days = Math.floor(totalMin / (60 * 24))
  const hr = Math.floor((totalMin - days * 60 * 24) / 60)
  if (days > 0) return `Expires in ${days}d ${hr}h`
  if (hr > 0) return `Expires in ${hr}h`
  return `Expires in ${totalMin}m`
}

// Effective lifecycle phase: a live WS build event wins over the status the
// card was loaded with (so a card refetched as 'building' flips to
// 'complete'/'failed' the moment the event arrives).
type Phase = 'pending' | 'queued' | 'building' | 'complete' | 'failed'

function resolvePhase(card: DispatchCardDTO, live?: BuildPhase): Phase {
  if (live === 'complete') return 'complete'
  if (live === 'failed') return 'failed'
  if (live === 'building') return 'building'
  switch (card.status) {
    case 'building':
      return 'building'
    case 'completed':
      return 'complete'
    case 'failed':
      return 'failed'
    case 'approved':
      return 'queued'
    default:
      return 'pending'
  }
}

export function Dispatch() {
  const [cards, setCards] = useState<DispatchCardDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionState, setActionState] = useState<Record<string, ActionState>>({})
  const setPendingCount = useDispatchStore((s) => s.setPendingCount)
  const decrement = useDispatchStore((s) => s.decrement)
  const buildStates = useDispatchStore((s) => s.buildStates)

  const refresh = useCallback(async () => {
    try {
      // 'active' returns pending + approved + building + completed + failed so
      // mid-lifecycle cards survive a page refresh.
      const data = await dispatchApi.list('active')
      data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setCards(data)
      setPendingCount(data.filter((c) => c.status === 'pending').length)
      setActionState({})
    } catch (exc) {
      console.error(exc)
      setError('Failed to load dispatches')
    } finally {
      setLoading(false)
    }
  }, [setPendingCount])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function patchCard(id: string, patch: Partial<DispatchCardDTO>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function handleApprove(id: string, mode: 'auto' | 'mcp') {
    setActionState((s) => ({ ...s, [id]: mode === 'auto' ? 'auto' : 'queue' }))
    try {
      const updated = await dispatchApi.approve(id, mode)
      // Trust the server's resulting status (auto -> 'building' when the
      // executor fired, else 'approved'). WS events take over from here.
      patchCard(id, { status: updated.status, mode: updated.mode })
      setActionState((s) => ({ ...s, [id]: 'idle' }))
      decrement()
    } catch (exc) {
      console.error(exc)
      setActionState((s) => ({ ...s, [id]: 'error' }))
    }
  }

  async function handleDiscard(id: string) {
    setActionState((s) => ({ ...s, [id]: 'discarding' }))
    try {
      await dispatchApi.discard(id)
      setCards((prev) => prev.filter((c) => c.id !== id))
      decrement()
    } catch (exc) {
      console.error(exc)
      setActionState((s) => ({ ...s, [id]: 'error' }))
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen">
      <TopBar title="Dispatch" subtitle="Approve agent work" />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading && <p className="text-[13px] text-stone">Loading dispatches…</p>}
        {!loading && error && <p className="text-[13px] text-red-600">{error}</p>}
        {!loading && !error && cards.length === 0 && (
          <p className="text-[13px] text-stone">No dispatches awaiting approval.</p>
        )}
        <div className="space-y-3 max-w-2xl">
          {cards.map((card) => {
            const action = actionState[card.id] ?? 'idle'
            const live = buildStates[card.id]
            const phase = resolvePhase(card, live?.phase)
            const prUrl = live?.pr_url ?? card.pr_url
            const failureError = live?.error ?? card.error

            // ----- Terminal / in-progress states (no two-path buttons) -----
            if (phase === 'queued') {
              return (
                <div key={card.id} className="px-4 py-3 rounded-xl border border-mist bg-paper text-stone">
                  <div className="text-[13px] font-medium text-graphite leading-snug mb-1">{card.feature_label}</div>
                  <span className="text-[12.5px]">Queued for developer</span>
                </div>
              )
            }

            if (phase === 'building') {
              return (
                <div key={card.id} className="px-4 py-3 rounded-xl border border-mist bg-white">
                  <div className="text-[13px] font-medium text-ink leading-snug mb-1">{card.feature_label}</div>
                  <div className="flex items-center gap-2 text-[12.5px] text-graphite">
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-graphite border-t-transparent animate-spin" />
                    Building…
                  </div>
                </div>
              )
            }

            if (phase === 'complete') {
              return (
                <div key={card.id} className="px-4 py-3 rounded-xl border border-mist bg-paper">
                  <div className="text-[13px] font-medium text-ink leading-snug mb-1">{card.feature_label}</div>
                  <div className="flex items-center gap-3 text-[12.5px] text-graphite">
                    <span>✓ PR opened</span>
                    {prUrl && /^https?:\/\//i.test(prUrl) && (
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline underline-offset-2 hover:opacity-80"
                      >
                        View PR →
                      </a>
                    )}
                  </div>
                </div>
              )
            }

            if (phase === 'failed') {
              return (
                <div key={card.id} className="px-4 py-3 rounded-xl border border-red-200 bg-white">
                  <div className="text-[13px] font-medium text-ink leading-snug mb-1">{card.feature_label}</div>
                  <p className="text-[12px] text-red-600 mb-2">
                    Build failed{failureError ? ` — ${failureError}` : ''}
                  </p>
                  <button
                    type="button"
                    disabled={action === 'queue'}
                    onClick={() => handleApprove(card.id, 'mcp')}
                    className="px-3 py-1.5 rounded-xl border border-mist text-graphite text-[11px] uppercase tracking-[0.16em] hover:border-graphite transition-colors disabled:opacity-40"
                  >
                    {action === 'queue' ? 'Queuing…' : 'Retry as queue'}
                  </button>
                </div>
              )
            }

            // ----- Pending: two-path approval UI -----
            const busy = action === 'auto' || action === 'queue' || action === 'discarding'
            const simple = card.complexity === 'simple'
            const complex = card.complexity === 'complex'

            const autoClasses = simple
              ? 'bg-ink text-white border border-ink hover:opacity-90'
              : 'border border-mist text-graphite hover:border-graphite'
            const queueClasses = complex
              ? 'bg-ink text-white border border-ink hover:opacity-90'
              : 'border border-mist text-graphite hover:border-graphite'

            return (
              <div
                key={card.id}
                className="px-4 py-3 rounded-xl border border-mist bg-white hover:border-graphite transition-colors"
              >
                <div className="text-[13px] font-medium text-ink leading-snug mb-1">{card.feature_label}</div>
                <p className="text-[12.5px] text-graphite leading-relaxed mb-2">{card.feature_summary}</p>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone mb-3">
                  {(card.source || 'unknown').toUpperCase()} · extracted {relativeTime(card.created_at)} ·{' '}
                  {expiresLabel(card.expires_at)}
                </div>

                {action === 'error' && (
                  <p className="text-[11px] text-red-600 mb-2">Couldn’t update — try again.</p>
                )}

                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(card.id, 'auto')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] transition-colors disabled:opacity-40 ${autoClasses}`}
                  >
                    {action === 'auto' ? 'Starting…' : 'Auto-build'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(card.id, 'mcp')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-[0.16em] transition-colors disabled:opacity-40 ${queueClasses}`}
                  >
                    {action === 'queue' ? 'Queuing…' : 'Queue for dev'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDiscard(card.id)}
                    aria-label="Discard"
                    title="Discard"
                    className="ml-auto px-3 py-1.5 rounded-xl border border-mist text-graphite text-[11px] hover:border-graphite transition-colors disabled:opacity-40"
                  >
                    {action === 'discarding' ? '…' : '✕'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
