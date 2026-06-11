import type { GraphNode, GraphEdge } from './graph'
import type { NotificationDTO } from './notification'

export type WSMessage =
  | { type: 'node_added'; payload: GraphNode }
  | { type: 'node_updated'; payload: Partial<GraphNode> & { id: string } }
  | { type: 'edge_added'; payload: GraphEdge }
  | { type: 'ingestion_event'; payload: {
      event_id: string | null
      source: string
      summary: string
      node_ids: string[]
      processed_at: string | null
      user_id: string | null
      user_name: string | null
    } }
  | { type: 'broadcast_pending'; payload: { count: number } }
  | { type: 'broadcast_acted'; payload: { id: string; action: 'approved' | 'discarded' } }
  | { type: 'dispatch_pending'; payload: { count: number } }
  | { type: 'dispatch_building'; payload: { dispatch_id: string } }
  | { type: 'dispatch_complete'; payload: { dispatch_id: string; pr_url: string } }
  | { type: 'dispatch_failed'; payload: { dispatch_id: string; error: string } }
  | { type: 'notification'; payload: NotificationDTO }
  | { type: 'ping' }
  | { type: 'pong' }
