import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { dispatchApi, type DispatchCardDTO } from '../lib/api/endpoints'
import { useDispatchStore, type BuildPhase } from '../store/dispatchStore'
import { markEntityNotificationsRead } from '../lib/notifications/orchestrator'
import { DispatchCard, CardSkeleton, EmptyState } from '../components/ui'

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

import type { PageProps } from '../types/layout'

type Props = PageProps

export function Dispatch({ onMenuClick }: Props) {
  const [cards, setCards] = useState<DispatchCardDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executorEnabled, setExecutorEnabled] = useState(false)
  const [actionState, setActionState] = useState<Record<string, ActionState>>({})
  const setPendingCount = useDispatchStore((s) => s.setPendingCount)
  const decrement = useDispatchStore((s) => s.decrement)
  const pendingCount = useDispatchStore((s) => s.pendingCount)
  const buildStates = useDispatchStore((s) => s.buildStates)

  const refresh = useCallback(async () => {
    try {
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
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    fetch(`${base}/health`)
      .then((r) => r.json())
      .then((data: { executor_enabled?: boolean }) => setExecutorEnabled(Boolean(data.executor_enabled)))
      .catch(() => setExecutorEnabled(false))
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [pendingCount, refresh])

  useEffect(() => {
    if (Object.keys(buildStates).length > 0) void refresh()
  }, [buildStates, refresh])

  function patchCard(id: string, patch: Partial<DispatchCardDTO>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function handleApprove(id: string, mode: 'auto' | 'mcp') {
    setActionState((s) => ({ ...s, [id]: mode === 'auto' ? 'auto' : 'queue' }))
    try {
      const updated = await dispatchApi.approve(id, mode)
      patchCard(id, { status: updated.status, mode: updated.mode })
      setActionState((s) => ({ ...s, [id]: 'idle' }))
      decrement()
      markEntityNotificationsRead(id)
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
      markEntityNotificationsRead(id)
    } catch (exc) {
      console.error(exc)
      setActionState((s) => ({ ...s, [id]: 'error' }))
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar title="Dispatch" subtitle="Approve agent work" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading && (
          <div className="space-y-3 max-w-2xl">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {!loading && error && <p className="text-caption text-destructive">{error}</p>}
        {!loading && !error && cards.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="No dispatches"
            description="When the agent proposes work, it will appear here for approval."
          />
        )}
        <div className="space-y-3 max-w-2xl">
          {!loading &&
            cards.map((card) => {
              const action = actionState[card.id] ?? 'idle'
              const live = buildStates[card.id]
              const phase = resolvePhase(card, live?.phase)
              return (
                <DispatchCard
                  key={card.id}
                  card={card}
                  phase={phase}
                  action={action}
                  executorEnabled={executorEnabled}
                  prUrl={live?.pr_url ?? card.pr_url}
                  failureError={live?.error ?? card.error}
                  relativeTime={relativeTime(card.created_at)}
                  expiresLabel={expiresLabel(card.expires_at)}
                  onApprove={(mode) => handleApprove(card.id, mode)}
                  onDiscard={() => handleDiscard(card.id)}
                />
              )
            })}
        </div>
      </div>
    </motion.div>
  )
}
