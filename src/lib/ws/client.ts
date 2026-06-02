import type { WSMessage } from '../../types/ws'
import { useGraphStore } from '../../store/graphStore'
import { useAuthStore } from '../../store/authStore'
import { useActivityStore } from '../../store/activityStore'
import { useOutboxStore } from '../../store/outboxStore'
import { useDispatchStore } from '../../store/dispatchStore'
import { api } from '../api/client'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'

class BrainWSClient {
  private ws: WebSocket | null = null
  private companyId: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxDelay = 30_000
  private intentionalClose = false
  private _buffer: WSMessage[] = []
  private _unsubHydration: (() => void) | null = null

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
    }

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as WSMessage
        this._handle(msg)
      } catch { /* ignore malformed */ }
    }

    this.ws.onclose = () => {
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
    if (!useGraphStore.getState().isHydrated) {
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
      case 'edge_removed':
        store.removeEdge(msg.payload.id)
        break
      case 'graph_snapshot':
        store.setGraph(msg.payload.nodes, msg.payload.edges)
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
        break
      }
      case 'broadcast_pending':
        useOutboxStore.getState().setPendingCount(msg.payload.count)
        break
      case 'broadcast_acted':
        useOutboxStore.getState().decrement()
        break
      case 'dispatch_pending':
        useDispatchStore.getState().setPendingCount(msg.payload.count)
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
    }
  }

  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }))
    }
  }
}

export const wsClient = new BrainWSClient()
