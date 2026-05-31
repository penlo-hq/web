import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { broadcastsApi, type PendingBroadcastDTO } from '../lib/api/endpoints'
import { useGraphStore } from '../store/graphStore'
import { useOutboxStore } from '../store/outboxStore'

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
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `Expires in ${min}m`
  const hr = Math.floor(min / 60)
  return `Expires in ${hr}h`
}

export function Outbox() {
  const [rows, setRows] = useState<PendingBroadcastDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionErrorId, setActionErrorId] = useState<string | null>(null)
  const setSelected = useGraphStore((s) => s.setSelected)
  const setPendingCount = useOutboxStore((s) => s.setPendingCount)
  const decrement = useOutboxStore((s) => s.decrement)
  const editsRef = useRef<Record<string, string>>({})

  const refresh = useCallback(async () => {
    try {
      const data = await broadcastsApi.list()
      setRows(data)
      setPendingCount(data.length)
      editsRef.current = {}
    } catch (exc) {
      console.error(exc)
      setError('Failed to load outbox')
    } finally {
      setLoading(false)
    }
  }, [setPendingCount])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function handleEdit(id: string, value: string) {
    editsRef.current[id] = value
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, message_text: value } : r)))
  }

  async function handleBlur(row: PendingBroadcastDTO) {
    const pending = editsRef.current[row.id]
    if (pending === undefined || pending === row.message_text) return
    try {
      const updated = await broadcastsApi.patch(row.id, { message_text: pending })
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)))
      delete editsRef.current[row.id]
    } catch (exc) {
      console.error(exc)
      setActionErrorId(row.id)
    }
  }

  async function handleApprove(id: string) {
    setBusyId(id)
    setActionErrorId(null)
    try {
      await broadcastsApi.approve(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      decrement()
    } catch (exc) {
      console.error(exc)
      setActionErrorId(id)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDiscard(id: string) {
    setBusyId(id)
    setActionErrorId(null)
    try {
      await broadcastsApi.discard(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      decrement()
    } catch (exc) {
      console.error(exc)
      setActionErrorId(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen">
      <TopBar title="Outbox" subtitle="Pending Slack messages" />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading && <p className="text-[13px] text-stone">Loading…</p>}
        {!loading && error && <p className="text-[13px] text-red-600">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-[13px] text-stone">No pending messages.</p>
        )}
        <div className="space-y-3 max-w-2xl">
          {rows.map((row) => {
            const disabled = busyId === row.id
            return (
              <div
                key={row.id}
                className="px-4 py-3 rounded-xl border border-mist bg-white hover:border-graphite transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-[13px] font-medium text-ink truncate">
                      #{row.channel_name || 'channel'}
                    </span>
                    <span className="text-[10.5px] text-stone">{relativeTime(row.created_at)}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-stone whitespace-nowrap">
                    {expiresLabel(row.expires_at)}
                  </span>
                </div>

                {row.nodes.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2">
                    {row.nodes.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelected(n.id)}
                        className="shrink-0 px-2 py-0.5 rounded-full bg-paper text-[10.5px] text-ink hover:bg-mist transition-colors"
                        title={n.type}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={row.message_text}
                  onChange={(e) => handleEdit(row.id, e.target.value)}
                  onBlur={() => handleBlur(row)}
                  className="w-full min-h-[88px] resize-y rounded-lg border border-mist bg-white px-3 py-2 text-[12.5px] text-ink leading-relaxed focus:outline-none focus:border-graphite"
                />

                {actionErrorId === row.id && (
                  <p className="text-[11px] text-red-600 mt-1.5">Action failed. Try again.</p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleApprove(row.id)}
                    className="px-3 py-1.5 rounded-xl bg-ink text-white text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDiscard(row.id)}
                    className="px-3 py-1.5 rounded-xl border border-mist text-graphite text-[11px] uppercase tracking-[0.16em] hover:border-graphite transition-colors disabled:opacity-40"
                  >
                    Discard
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
