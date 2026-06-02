import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { broadcastsApi, type PendingBroadcastDTO } from '../lib/api/endpoints'
import { useGraphStore } from '../store/graphStore'
import { useOutboxStore } from '../store/outboxStore'
import type { PageProps } from '../types/layout'
import { Button, Card, CardSkeleton, EmptyState, Textarea } from '../components/ui'

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

export function Outbox({ onMenuClick }: PageProps) {
  const [rows, setRows] = useState<PendingBroadcastDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionErrorId, setActionErrorId] = useState<string | null>(null)
  const setSelected = useGraphStore((s) => s.setSelected)
  const setPendingCount = useOutboxStore((s) => s.setPendingCount)
  const decrement = useOutboxStore((s) => s.decrement)
  const pendingCount = useOutboxStore((s) => s.pendingCount)
  const lastActedId = useOutboxStore((s) => s.lastActedId)
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

  useEffect(() => {
    void refresh()
  }, [pendingCount, refresh])

  useEffect(() => {
    if (lastActedId) {
      setRows((prev) => prev.filter((r) => r.id !== lastActedId))
    }
  }, [lastActedId])

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar onMenuClick={onMenuClick} title="Outbox" subtitle="Pending Slack messages" />
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading && (
          <div className="space-y-3 max-w-2xl">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {!loading && error && <p className="text-caption text-destructive">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <EmptyState icon={Send} title="No pending messages" description="Slack broadcasts awaiting approval will appear here." />
        )}
        <div className="space-y-3 max-w-2xl">
          {rows.map((row) => {
            const disabled = busyId === row.id
            return (
              <Card key={row.id} padding="md" className="bg-canvas space-y-2">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-[13px] font-medium text-text-primary truncate">
                      #{row.channel_name || 'channel'}
                    </span>
                    <span className="text-[10.5px] text-text-secondary">{relativeTime(row.created_at)}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary whitespace-nowrap">
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
                        className="shrink-0 px-2 py-0.5 rounded-full bg-surface text-[10.5px] text-text-primary hover:bg-mist transition-colors"
                        title={n.type}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}

                <Textarea
                  value={row.message_text}
                  onChange={(e) => handleEdit(row.id, e.target.value)}
                  onBlur={() => handleBlur(row)}
                  className="min-h-[88px] text-caption"
                />

                {actionErrorId === row.id && (
                  <p className="text-caption-sm text-destructive">Action failed. Try again.</p>
                )}

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" disabled={disabled} onClick={() => handleApprove(row.id)}>
                    Approve
                  </Button>
                  <Button variant="secondary" size="sm" disabled={disabled} onClick={() => handleDiscard(row.id)}>
                    Discard
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
