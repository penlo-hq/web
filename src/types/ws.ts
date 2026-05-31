import type { GraphNode, GraphEdge } from './graph'

export type WSMessage =
  | { type: 'node_added'; payload: GraphNode }
  | { type: 'node_updated'; payload: Partial<GraphNode> & { id: string } }
  | { type: 'edge_added'; payload: GraphEdge }
  | { type: 'edge_removed'; payload: { id: string } }
  | { type: 'graph_snapshot'; payload: { nodes: GraphNode[]; edges: GraphEdge[] } }
  | { type: 'ingestion_event'; payload: {
      event_id: string | null
      source: string
      summary: string
      node_ids: string[]
      processed_at: string | null
      user_id: string | null
      user_name: string | null
    } }
  | { type: 'agent_action'; payload: { action: string; status: 'started' | 'completed' | 'failed'; node_id?: string } }
  | { type: 'broadcast_pending'; payload: { count: number } }
  | { type: 'broadcast_acted'; payload: { id: string; action: 'approved' | 'discarded' } }
  | { type: 'ping' }
  | { type: 'pong' }
