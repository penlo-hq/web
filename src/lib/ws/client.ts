import type { WSMessage } from '../../types/ws'
import { useGraphStore } from '../../store/graphStore'
import { useAuthStore } from '../../store/authStore'
import { useActivityStore } from '../../store/activityStore'
import { useOutboxStore } from '../../store/outboxStore'
import { useDispatchStore } from '../../store/dispatchStore'
import { useNotificationStore } from '../../store/notificationStore'
import { handleNotificationPayload } from '../notifications/orchestrator'
import { api } from '../api/client'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'
const COUNT_DEBOUNCE_MS = 2000

// Only graph-mutating events must wait for the initial graph hydration before they
// can be applied incrementally. Everything else (notifications, dispatch/broadcast
// badges, activity feed) is independent of the graph and must be delivered live —
// otherwise the bell, toasts, and pending counts stay dead until a Brain graph view
// is opened.
const GRAPH_EVENT_TYPES: ReadonlySet<string> = new Set([
  'node_added',
  'node_updated',
  'edge_added',
])

class BrainWSClient {
  private ws: WebSocket | null = null
  private companyId: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxDelay = 30_000
  private intentionalClose = false
  private _buffer: WSMessage[] = []
  private _unsubHydration: (() => void) | null = null
  private _dispatchPendingTimer: ReturnType<typeof setTimeout> | null = null
  private _broadcastPendingTimer: ReturnType<typeof setTimeout> | null = null
  private _pendingDispatchCount: number | null = null
  private _pendingBroadcastCount: number | null = null

  private _setConnected(connected: boolean): void {
    useNotificationStore.getState().setWsConnected(connected)
  }

  private _debouncedDispatchCount(count: number): void {
    this._pendingDispatchCount = count
    if (this._dispatchPendingTimer) return
    this._dispatchPendingTimer = setTimeout(() => {
      if (this._pendingDispatchCount !== null) {
        useDispatchStore.getState().setPendingCount(this._pendingDispatchCount)
      }
      this._pendingDispatchCount = null
      this._dispatchPendingTimer = null
    }, COUNT_DEBOUNCE_MS)
  }

  private _debouncedBroadcastCount(count: number): void {
    this._pendingBroadcastCount = count
    if (this._broadcastPendingTimer) return
    this._broadcastPendingTimer = setTimeout(() => {
      if (this._pendingBroadcastCount !== null) {
        useOutboxStore.getState().setPendingCount(this._pendingBroadcastCount)
      }
      this._pendingBroadcastCount = null
      this._broadcastPendingTimer = null
    }, COUNT_DEBOUNCE_MS)
  }

  connect(companyId: string): void {
    this.companyId = companyId
    this.intentionalClose = false

    this._unsubHydration?.()
    this._unsubHydration = useGraphStore.subscribe((state) => {
      if (state.isHydrated && this._buffer.length > 0) {
        const msgs = this._buffer.splice(0)
        for (const m of msgs) this._dispatch(m)
      }
    })

    void this._open()
  }

  disconnect(): void {
    this.intentionalClose = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this._unsubHydration?.()
    this._unsubHydration = null
    this._buffer = []
    this.ws?.close()
  }

  private async _open(): Promise<void> {
    const user = useAuthStore.getState().user
    if (!user || !this.companyId) return

    let ticket: string
    try {
      const { data } = await api.post('/api/v1/auth/ws-ticket')
      ticket = data.ticket as string
    } catch {
      this._scheduleReconnect()
      return
    }

    this.ws = new WebSocket(`${WS_BASE}/api/v1/ws/${this.companyId}?ticket=${encodeURIComponent(ticket)}`)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
      this._setConnected(true)
    }

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as WSMessage
        this._handle(msg)
      } catch { /* ignore malformed */ }
    }

    this.ws.onclose = () => {
      this._setConnected(false)
      if (!this.intentionalClose) this._scheduleReconnect()
    }

    this.ws.onerror = () => this.ws?.close()
  }

  private _scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
      void this._open()
    }, this.reconnectDelay)
  }

  private _handle(msg: WSMessage): void {
    if (GRAPH_EVENT_TYPES.has(msg.type) && !useGraphStore.getState().isHydrated) {
      this._buffer.push(msg)
      return
    }
    this._dispatch(msg)
  }

  private _dispatch(msg: WSMessage): void {
    const store = useGraphStore.getState()
    switch (msg.type) {
      case 'node_added':
        store.addNode(msg.payload)
        break
      case 'node_updated':
        store.updateNode(msg.payload.id, msg.payload)
        break
      case 'edge_added':
        store.addEdge(msg.payload)
        break
      case 'ingestion_event': {
        const p = msg.payload
        if (!p.event_id) break
        useActivityStore.getState().prependLive({
          id: p.event_id,
          source: p.source,
          summary: p.summary,
          node_ids: p.node_ids,
          node_count: p.node_ids.length,
          processed_at: p.processed_at ?? new Date().toISOString(),
          user_id: p.user_id,
          user_name: p.user_name,
        })
        if (!window.location.pathname.startsWith('/timeline')) {
          useActivityStore.getState().incrementUnread()
        }
        break
      }
      case 'broadcast_pending':
        this._debouncedBroadcastCount(msg.payload.count)
        break
      case 'broadcast_acted':
        useOutboxStore.getState().removeById(msg.payload.id)
        break
      case 'dispatch_pending':
        this._debouncedDispatchCount(msg.payload.count)
        break
      case 'dispatch_building':
        useDispatchStore.getState().setBuildState(msg.payload.dispatch_id, { phase: 'building' })
        break
      case 'dispatch_complete':
        useDispatchStore.getState().setBuildState(msg.payload.dispatch_id, {
          phase: 'complete',
          pr_url: msg.payload.pr_url,
        })
        break
      case 'dispatch_failed':
        useDispatchStore.getState().setBuildState(msg.payload.dispatch_id, {
          phase: 'failed',
          error: msg.payload.error,
        })
        break
      case 'notification':
        handleNotificationPayload(msg.payload)
        break
    }
  }

  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }))
    }
  }
}

export const wsClient = new BrainWSClient()
