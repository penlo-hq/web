export type NodeType =
  | 'company'
  | 'team'
  | 'person'
  | 'client'
  | 'topic'
  | 'task'
  | 'event'
  | 'draft'
  | 'agent'
  | 'feature'
  | 'decision'
  | 'architecture'
  | 'alert'

export type EdgeKind =
  | 'spoke_with'
  | 'mentioned_in'
  | 'assigned_to'
  | 'related_to'
  | 'blocks'
  | 'created'
  | 'owns'
  | 'decided_in'
  | 'resulted_in'
  | 'conflicts_with'

export type GraphNode = {
  id: string
  type: NodeType
  label: string
  company_id: string
  team_id?: string
  user_id?: string
  importance: number
  recency: number
  is_private: boolean
  detail?: string
  meta?: string
  properties: Record<string, unknown>
  created_at: string
  updated_at: string
  last_seen_at: string
  decay_class?: string
  valid_until?: string | null
  is_stale?: boolean
  stale_at?: string | null
  source_event_id?: string | null
  superseded_by?: string | null
}

export type GraphEdge = {
  id: string
  source_id: string
  target_id: string
  kind: EdgeKind
  weight: number
  company_id: string
  created_at: string
}

export type GraphSnapshot = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  snapshot_at?: string
}

export type User = {
  id: string
  email: string
  name: string
  role: 'employee' | 'team_lead' | 'admin'
  company_id: string
  team_id?: string
}

export type Team = {
  id: string
  company_id: string
  name: string
  color: string
  is_private: boolean
}

export type Invitation = {
  invite_id: string
  invite_url: string
  email: string
  expires_at: string
  team_name: string | null
}

export type Draft = {
  id: string
  label: string
  detail: string | null
  kind: string | null
  role: string | null
  generated_at: string | null
  generated_by_user_id: string | null
  user_id: string | null
  team_id: string | null
  is_private: boolean
  importance?: number
  is_stale?: boolean
  meta: string | null
  created_at: string
  updated_at: string
  last_seen_at: string
  company_id: string
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export type Task = {
  id: string
  label: string
  detail?: string | null
  status: TaskStatus
  assigned_to?: string | null
  node_id?: string
  company_id: string
  created_at: string
  updated_at: string
  importance?: number
  is_stale?: boolean
  meta?: string | null
  last_seen_at?: string
}

export type CitationSourceEvent = {
  id: string
  source: string
  processed_at: string
}

export type Citation = {
  node_id: string
  label: string
  type: NodeType
  importance: number
  contribution: string
  near_expiry?: boolean
  detail_snippet?: string
  source_event?: CitationSourceEvent
}

export type GraphNodeWithSource = GraphNode & {
  _source_event?: CitationSourceEvent
  near_expiry?: boolean
}

export type Contradiction = {
  node_a_id: string
  node_b_id: string
  summary: string
}

export type QueryResult = {
  query_id: string
  answer: string
  citations: Citation[]
  contradictions: Contradiction[]
  relevant_nodes: GraphNode[]
  sub_agent: 'people' | 'decision' | 'task' | null
}

export type NodeRelationship = {
  person: GraphNode
  interaction_count: number
  most_recent_at: string | null
  top_topics: GraphNode[]
}

export type NodeCitation = {
  id: string
  query_id: string
  question: string | null
  contribution: string | null
  created_at: string
}

export const NODE_TYPE_LABEL: Record<NodeType, string> = {
  company: 'Company',
  team: 'Team',
  person: 'Person',
  client: 'Client',
  topic: 'Topic',
  task: 'Task',
  event: 'Event',
  draft: 'Draft',
  agent: 'Agent',
  feature: 'Feature',
  decision: 'Decision',
  architecture: 'Architecture',
  alert: 'Alert',
}

export const NODE_TYPE_ORDER: NodeType[] = [
  'company',
  'team',
  'person',
  'client',
  'topic',
  'task',
  'event',
  'feature',
  'decision',
  'architecture',
  'draft',
  'agent',
  'alert',
]
