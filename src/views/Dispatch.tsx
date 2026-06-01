import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { dispatchApi, type DispatchCardDTO } from '../lib/api/endpoints'
import { useDispatchStore } from '../store/dispatchStore'

type CardState = 'idle' | 'approving' | 'discarding' | 'approved' | 'error'

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

export function Dispatch() {
  const [cards, setCards] = useState<DispatchCardDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cardState, setCardState] = useState<Record<string, CardState>>({})
  const setPendingCount = useDispatchStore((s) => s.setPendingCount)
  const decrement = useDispatchStore((s) => s.decrement)

  const refresh = useCallback(async () => {
    try {
      const data = await dispatchApi.list()
      // Oldest first (backend returns ASC; sort defensively).
      data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setCards(data)
      setPendingCount(data.length)
      setCardState({})
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

  async function handleApprove(id: string) {
    setCardState((s) => ({ ...s, [id]: 'approving' }))
    try {
      await dispatchApi.approve(id)
      setCardState((s) => ({ ...s, [id]: 'approved' }))
      decrement()
    } catch (exc) {
      console.error(exc)
      setCardState((s) => ({ ...s, [id]: 'error' }))
    }
  }

  async function handleDiscard(id: string) {
    setCardState((s) => ({ ...s, [id]: 'discarding' }))
    try {
      await dispatchApi.discard(id)
      setCards((prev) => prev.filter((c) => c.id !== id))
      decrement()
    } catch (exc) {
      console.error(exc)
      setCardState((s) => ({ ...s, [id]: 'error' }))
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
            const state = cardState[card.id] ?? 'idle'

            if (state === 'approved') {
              return (
                <div
                  key={card.id}
                  className="px-4 py-3 rounded-xl border border-mist bg-paper text-stone"
                >
                  <span className="text-[12.5px]">✓ Approved — queued for agent</span>
                </div>
              )
            }

            const busy = state === 'approving' || state === 'discarding'
            return (
              <div
                key={card.id}
                className="px-4 py-3 rounded-xl border border-mist bg-white hover:border-graphite transition-colors"
              >
                <div className="text-[13px] font-medium text-ink leading-snug mb-1">
                  {card.feature_label}
                </div>
                <p className="text-[12.5px] text-graphite leading-relaxed mb-2">
                  {card.feature_summary}
                </p>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone mb-3">
                  {(card.source || 'unknown').toUpperCase()} · extracted {relativeTime(card.created_at)} ·{' '}
                  {expiresLabel(card.expires_at)}
                </div>

                {state === 'error' && (
                  <p className="text-[11px] text-red-600 mb-2">Couldn’t update — try again.</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(card.id)}
                    className="px-3 py-1.5 rounded-xl bg-ink text-white text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {state === 'approving' ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDiscard(card.id)}
                    className="px-3 py-1.5 rounded-xl border border-mist text-graphite text-[11px] uppercase tracking-[0.16em] hover:border-graphite transition-colors disabled:opacity-40"
                  >
                    {state === 'discarding' ? 'Discarding…' : 'Discard'}
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
