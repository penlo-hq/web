import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { dispatchApi, type DispatchCardDTO, type ApproveOptions } from '../lib/api/endpoints'
import { extractApiError } from '../lib/api/errors'
import { useDispatchStore, type BuildPhase } from '../store/dispatchStore'
import { useGraphStore } from '../store/graphStore'
import { markEntityNotificationsRead } from '../lib/notifications/orchestrator'
import { DispatchCard, CardSkeleton } from '../components/ui'
import { useDispatchCapabilities } from '../hooks/useDispatchCapabilities'
import { DispatchFilterBar } from '../components/dispatch/DispatchFilterBar'
import { DispatchPageToolbar } from '../components/dispatch/DispatchPageToolbar'
import { GitHubDefaultsPanel } from '../components/dispatch/GitHubDefaultsPanel'
import { DispatchEmptyState } from '../components/dispatch/DispatchEmptyState'
import { AutoBuildHint } from '../components/dispatch/AutoBuildHint'
import { ActionErrorBanner } from '../components/dispatch/ActionErrorBanner'
import { filterDispatchCards, countPending } from '../components/dispatch/dispatchFilters'
import { relativeTime, expiresLabel } from '../components/dispatch/dispatchTime'
import type { DispatchInboxFilter } from '../components/dispatch/types'
import type { PageProps } from '../types/layout'

type ActionState = 'idle' | 'auto' | 'queue' | 'discarding' | 'error'

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

function applyBuildStatePatch(
  cards: DispatchCardDTO[],
  id: string,
  live: { phase: BuildPhase; pr_url?: string | null; error?: string | null },
): DispatchCardDTO[] {
  return cards.map((c) => {
    if (c.id !== id) return c
    if (live.phase === 'building') {
      return { ...c, status: 'building' }
    }
    if (live.phase === 'complete') {
      return {
        ...c,
        status: 'completed',
        pr_url: live.pr_url ?? c.pr_url,
        error: null,
      }
    }
    if (live.phase === 'failed') {
      return {
        ...c,
        status: 'failed',
        error: live.error ?? c.error,
      }
    }
    return c
  })
}

export function Dispatch({ onMenuClick }: PageProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')

  const [cards, setCards] = useState<DispatchCardDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [filter, setFilter] = useState<DispatchInboxFilter>('inbox')
  const [defaultRepo, setDefaultRepo] = useState('')
  const [actionState, setActionState] = useState<Record<string, ActionState>>({})
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
  const [lastActionError, setLastActionError] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const prevPendingCount = useRef<number | null>(null)
  const setPendingCount = useDispatchStore((s) => s.setPendingCount)
  const decrement = useDispatchStore((s) => s.decrement)
  const pendingCountStore = useDispatchStore((s) => s.pendingCount)
  const buildStates = useDispatchStore((s) => s.buildStates)
  const setSelected = useGraphStore((s) => s.setSelected)

  const capabilities = useDispatchCapabilities(defaultRepo)

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const data = await dispatchApi.list('active')
        data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setCards(data)
        setPendingCount(countPending(data))
        setError(null)
        setLastRefreshedAt(new Date())
      } catch (exc) {
        console.error(exc)
        setError(extractApiError(exc, 'Failed to load dispatches'))
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    },
    [setPendingCount],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (prevPendingCount.current === null) {
      prevPendingCount.current = pendingCountStore
      return
    }
    if (prevPendingCount.current !== pendingCountStore) {
      prevPendingCount.current = pendingCountStore
      void refresh(true)
    }
  }, [pendingCountStore, refresh])

  useEffect(() => {
    const ids = Object.keys(buildStates)
    if (ids.length === 0) return
    setCards((prev) => {
      let next = prev
      for (const id of ids) {
        const live = buildStates[id]
        if (live) next = applyBuildStatePatch(next, id, live)
      }
      return next
    })
    const needsRefetch = ids.some((id) => buildStates[id]?.phase === 'complete')
    if (needsRefetch) {
      void refresh(true)
    }
  }, [buildStates, refresh])

  useEffect(() => {
    if (!highlightId || cards.length === 0) return
    setHighlightedId(highlightId)
    const el = cardRefs.current[highlightId]
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    const t = window.setTimeout(() => {
      setHighlightedId(null)
      searchParams.delete('highlight')
      setSearchParams(searchParams, { replace: true })
    }, 2500)
    return () => window.clearTimeout(t)
  }, [highlightId, cards.length, searchParams, setSearchParams])

  const displayCards = useMemo(() => {
    let list = filterDispatchCards(cards, filter)
    return list.map((c) => {
      const live = buildStates[c.id]
      if (!live) return c
      return applyBuildStatePatch([c], c.id, live)[0]
    })
  }, [cards, filter, buildStates])

  const filterCounts = useMemo(
    () => ({
      inbox: cards.filter((c) => c.status === 'pending').length,
      active: cards.filter((c) => c.status === 'approved' || c.status === 'building').length,
      done: cards.filter((c) => c.status === 'completed' || c.status === 'failed').length,
    }),
    [cards],
  )

  const pendingCount = countPending(cards)
  const showGitHubPanel = filter === 'inbox' || filter === 'all'
  const showAutoBuildHint =
    capabilities.executorEnabled &&
    filter !== 'done' &&
    capabilities.autoBuildDisabledReason != null

  function patchCard(id: string, patch: Partial<DispatchCardDTO>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function handleApprove(id: string, opts: ApproveOptions) {
    setActionState((s) => ({ ...s, [id]: opts.mode === 'auto' ? 'auto' : 'queue' }))
    setActionErrors((s) => {
      const next = { ...s }
      delete next[id]
      return next
    })
    setLastActionError(null)
    try {
      const updated = await dispatchApi.approve(id, opts)
      patchCard(id, { status: updated.status, mode: updated.mode })
      setActionState((s) => ({ ...s, [id]: 'idle' }))
      if (updated.status === 'pending') return
      decrement()
      markEntityNotificationsRead(id)
    } catch (exc) {
      const msg = extractApiError(exc, "Couldn't approve dispatch.")
      setActionState((s) => ({ ...s, [id]: 'error' }))
      setActionErrors((s) => ({ ...s, [id]: msg }))
      setLastActionError(msg)
    }
  }

  async function handleDiscard(id: string) {
    setActionState((s) => ({ ...s, [id]: 'discarding' }))
    setActionErrors((s) => {
      const next = { ...s }
      delete next[id]
      return next
    })
    setLastActionError(null)
    try {
      await dispatchApi.discard(id)
      setCards((prev) => prev.filter((c) => c.id !== id))
      decrement()
      markEntityNotificationsRead(id)
    } catch (exc) {
      const msg = extractApiError(exc, "Couldn't discard dispatch.")
      setActionState((s) => ({ ...s, [id]: 'error' }))
      setLastActionError(msg)
    }
  }

  function viewInBrain(nodeId: string) {
    setSelected(nodeId)
    navigate('/brain/company')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar title="Dispatch" subtitle="Approve agent work" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto max-w-3xl space-y-4">
          <DispatchPageToolbar
            pendingCount={pendingCount}
            isRefreshing={isRefreshing}
            lastRefreshedAt={lastRefreshedAt}
            onRefresh={() => void refresh()}
          />

          <DispatchFilterBar filter={filter} onChange={setFilter} counts={filterCounts} />

          {showAutoBuildHint && capabilities.autoBuildDisabledReason && (
            <AutoBuildHint message={capabilities.autoBuildDisabledReason} />
          )}

          {lastActionError && (
            <ActionErrorBanner message={lastActionError} onDismiss={() => setLastActionError(null)} />
          )}

          {error && !loading && (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <WifiOff className="w-8 h-8 text-text-tertiary" strokeWidth={1.5} />
              <p className="text-[13px] text-destructive max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90"
              >
                Try again
              </button>
            </div>
          )}

          {!error && (
            <>
              {showGitHubPanel && (
                <GitHubDefaultsPanel
                  executorEnabled={capabilities.executorEnabled}
                  emphasizeRequired={!defaultRepo.trim()}
                  onRepoChange={setDefaultRepo}
                />
              )}

              {loading && (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              )}

              {!loading && displayCards.length === 0 && <DispatchEmptyState filter={filter} />}

              {!loading && displayCards.length > 0 && (
                <div className="space-y-3">
                  {displayCards.map((card) => {
                    const action = actionState[card.id] ?? 'idle'
                    const live = buildStates[card.id]
                    const phase = resolvePhase(card, live?.phase)
                    return (
                      <div
                        key={card.id}
                        ref={(el) => {
                          cardRefs.current[card.id] = el
                        }}
                      >
                        <DispatchCard
                          card={card}
                          phase={phase}
                          action={action}
                          executorEnabled={capabilities.executorEnabled}
                          prUrl={live?.pr_url ?? card.pr_url}
                          failureError={live?.error ?? card.error}
                          relativeTime={relativeTime(card.created_at)}
                          expiresLabel={expiresLabel(card.expires_at)}
                          actionError={actionErrors[card.id]}
                          highlighted={highlightedId === card.id}
                          onApprove={(payload) => void handleApprove(card.id, payload)}
                          onDiscard={() => void handleDiscard(card.id)}
                          onViewInBrain={
                            card.feature_node_id
                              ? () => viewInBrain(card.feature_node_id!)
                              : undefined
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
