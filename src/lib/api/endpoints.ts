import { api, publicApi } from './client'
import type {
  GraphNode,
  GraphEdge,
  Invitation,
  NodeCitation,
  NodeRelationship,
  QueryResult,
  Task,
  Draft,
  User,
} from '../../types/graph'

type GraphResponse = { nodes: GraphNode[]; edges: GraphEdge[] }
type SnapshotResponse = GraphResponse & { snapshot_at: string | null }

export type GraphSnapshotMarker = {
  snapshot_at: string
  node_count: number
  edge_count: number
}

export const graphApi = {
  company: (): Promise<GraphResponse> => api.get('/api/v1/graph/company').then((r) => r.data),
  me: (): Promise<GraphResponse> => api.get('/api/v1/graph/me').then((r) => r.data),
  team: (teamId: string): Promise<GraphResponse> => api.get(`/api/v1/graph/team/${teamId}`).then((r) => r.data),
  snapshot: (at: string): Promise<SnapshotResponse> => api.get('/api/v1/graph/snapshot', { params: { at } }).then((r) => r.data),
  snapshots: (): Promise<{ snapshots: GraphSnapshotMarker[] }> =>
    api.get('/api/v1/graph/snapshots').then((r) => r.data),
}

export type TimelinePushNode = { id: string; label: string; type: string }

export type TimelinePushDTO = {
  id: string
  source: string
  summary: string
  processed_at: string
  user_id: string | null
  user_name: string | null
  delta: { created: number; merged: number; edges: number }
  nodes: TimelinePushNode[]
  nodes_hidden: number
  snapshot_at: string | null
  graph_totals_at_snapshot: { nodes: number; edges: number } | null
}

export type TimelinePushesResponse = {
  pushes: TimelinePushDTO[]
  has_more: boolean
  next_cursor: string | null
}

export const timelineApi = {
  pushes: (params: {
    since?: string
    before?: string
    limit?: number
    source?: string
  } = {}): Promise<TimelinePushesResponse> =>
    api.get('/api/v1/timeline/pushes', { params }).then((r) => r.data),
}

export const nodeApi = {
  get: (id: string) => api.get(`/api/v1/nodes/${id}`).then((r) => r.data),
  patch: (id: string, body: Partial<GraphNode>) => api.patch(`/api/v1/nodes/${id}`, body).then((r) => r.data),
  citations: (id: string): Promise<NodeCitation[]> =>
    api.get(`/api/v1/nodes/${id}/citations`).then((r) => r.data),
  relationships: (id: string): Promise<NodeRelationship[]> =>
    api.get(`/api/v1/nodes/${id}/relationships`).then((r) => r.data),
  resolveAlert: (alertId: string, keepNodeId: string) =>
    api.post(`/api/v1/nodes/${alertId}/resolve`, { keep_node_id: keepNodeId }).then((r) => r.data),
}

export const queryApi = {
  ask: (question: string, scope: string = 'company'): Promise<QueryResult> =>
    api.post('/api/v1/query', { question, scope }).then((r) => r.data),
  feedback: (body: {
    query_id: string
    rating: 'up' | 'down'
    comment?: string
    question?: string
    answer?: string
  }) => api.post('/api/v1/query/feedback', body).then((r) => r.data),
}

function normalizeTaskStatus(raw: unknown): Task['status'] {
  const s = typeof raw === 'string' ? raw.toLowerCase().replace(/-/g, '_') : ''
  if (s === 'running' || s === 'in_progress') return 'running'
  if (s === 'completed' || s === 'done') return 'completed'
  if (s === 'failed') return 'failed'
  return 'pending'
}

/** Map API node or flat task payload to Task (defensive for legacy nested properties). */
export function normalizeTask(row: Record<string, unknown>): Task {
  const props = (row.properties as Record<string, unknown> | undefined) ?? {}
  const statusRaw = row.status ?? props.status
  const assignee = row.assigned_to ?? props.assignee ?? props.assigned_to
  let assigned: string | null = null
  if (typeof assignee === 'string') assigned = assignee
  else if (assignee && typeof assignee === 'object' && 'name' in assignee) {
    assigned = String((assignee as { name?: string }).name ?? '')
  }
  return {
    id: String(row.id),
    label: String(row.label ?? ''),
    detail: row.detail != null ? String(row.detail) : null,
    status: normalizeTaskStatus(statusRaw),
    assigned_to: assigned,
    node_id: row.node_id != null ? String(row.node_id) : String(row.id),
    company_id: String(row.company_id),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    importance: typeof row.importance === 'number' ? row.importance : undefined,
    is_stale: Boolean(row.is_stale),
    meta: row.meta != null ? String(row.meta) : null,
    last_seen_at: row.last_seen_at != null ? String(row.last_seen_at) : undefined,
  }
}

export const tasksApi = {
  list: (): Promise<Task[]> =>
    api.get('/api/v1/tasks').then((r) => (r.data as Record<string, unknown>[]).map(normalizeTask)),
  patch: (id: string, body: { status?: string; detail?: string }): Promise<Task> =>
    api.patch(`/api/v1/tasks/${id}`, body).then((r) => normalizeTask(r.data as Record<string, unknown>)),
}

export function normalizeDraft(row: Record<string, unknown>): Draft {
  const props = (row.properties as Record<string, unknown> | undefined) ?? {}
  return {
    id: String(row.id),
    label: String(row.label ?? ''),
    detail: row.detail != null ? String(row.detail) : null,
    kind: (row.kind ?? props.kind) != null ? String(row.kind ?? props.kind) : null,
    role: (row.role ?? props.role) != null ? String(row.role ?? props.role) : null,
    generated_at:
      (row.generated_at ?? props.generated_at) != null
        ? String(row.generated_at ?? props.generated_at)
        : null,
    generated_by_user_id:
      (row.generated_by_user_id ?? props.generated_by_user_id) != null
        ? String(row.generated_by_user_id ?? props.generated_by_user_id)
        : null,
    user_id: row.user_id != null ? String(row.user_id) : null,
    team_id: row.team_id != null ? String(row.team_id) : null,
    is_private: Boolean(row.is_private),
    importance: typeof row.importance === 'number' ? row.importance : undefined,
    is_stale: Boolean(row.is_stale),
    meta: row.meta != null ? String(row.meta) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    last_seen_at: String(row.last_seen_at ?? row.updated_at ?? ''),
    company_id: String(row.company_id ?? ''),
  }
}

export const draftsApi = {
  list: (): Promise<Draft[]> =>
    api.get('/api/v1/drafts').then((r) => (r.data as Record<string, unknown>[]).map(normalizeDraft)),
  patch: (id: string, body: { detail?: string }): Promise<Draft> =>
    api.patch(`/api/v1/drafts/${id}`, body).then((r) => normalizeDraft(r.data as Record<string, unknown>)),
  delete: (id: string): Promise<void> => api.delete(`/api/v1/drafts/${id}`).then(() => undefined),
}

export const ingestApi = {
  penlo: (transcript: string, confidence = 1.0) =>
    api.post('/api/v1/ingest/penlo', { transcript, confidence }).then((r) => r.data),
  standup: (transcript: string, meeting_type = 'standup') =>
    api.post('/api/v1/ingest/standup', { transcript, meeting_type }).then((r) => r.data),
}

export type ApiKeyEntry = {
  id: string
  label: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export const apiKeysApi = {
  list: (): Promise<ApiKeyEntry[]> => api.get('/api/v1/auth/api-keys').then((r) => r.data),
  create: (label: string): Promise<ApiKeyEntry & { key: string }> =>
    api.post('/api/v1/auth/api-keys', { label }).then((r) => r.data),
  revoke: (id: string): Promise<void> =>
    api.delete(`/api/v1/auth/api-keys/${id}`).then((r) => r.data),
}

export type ActivityEventDTO = {
  id: string
  source: string
  summary: string
  node_ids: string[]
  node_count: number
  processed_at: string
  user_id: string | null
  user_name: string | null
}

export type ActivityResponse = {
  events: ActivityEventDTO[]
  has_more: boolean
  next_cursor: string | null
}

export const activityApi = {
  list: (params: { since?: string; before?: string; limit?: number } = {}): Promise<ActivityResponse> =>
    api.get('/api/v1/activity', { params }).then((r) => r.data),
}

export type PendingBroadcastDTO = {
  id: string
  channel_id: string
  channel_name: string
  message_text: string
  node_ids: string[]
  nodes: { id: string; label: string; type: string }[]
  created_at: string
  expires_at: string
}

export const broadcastsApi = {
  list: (): Promise<PendingBroadcastDTO[]> =>
    api.get('/api/v1/broadcasts').then((r) => r.data),
  patch: (id: string, body: { message_text: string }): Promise<PendingBroadcastDTO> =>
    api.patch(`/api/v1/broadcasts/${id}`, body).then((r) => r.data),
  approve: (id: string): Promise<void> =>
    api.post(`/api/v1/broadcasts/${id}/approve`).then(() => undefined),
  discard: (id: string): Promise<void> =>
    api.post(`/api/v1/broadcasts/${id}/discard`).then(() => undefined),
  count: (): Promise<{ count: number }> =>
    api.get('/api/v1/broadcasts/count').then((r) => r.data),
}

export type DispatchMode = 'auto' | 'mcp'

export type DispatchRelatedDecision = {
  label: string
  detail: string | null
}

export type DispatchRelatedPerson = {
  label: string
}

export type DispatchExecutionTraceEntry = {
  tool: string
  input: Record<string, string>
  result: string
}

export type DispatchCardDTO = {
  id: string
  feature_node_id: string | null
  feature_label: string
  feature_summary: string
  source: string | null
  complexity: string | null
  node_type: string | null
  detail: string | null
  related_decisions: DispatchRelatedDecision[]
  related_people: DispatchRelatedPerson[]
  acceptance_criteria: string[]
  build_brief_preview: string | null
  execution_trace?: DispatchExecutionTraceEntry[]
  github_repo: string | null
  github_base_branch: string
  status: string
  mode: DispatchMode
  pr_url: string | null
  error: string | null
  started_at: string | null
  created_at: string
  expires_at: string
}

export type ApproveOptions = {
  mode: DispatchMode
  github_repo?: string | null
  github_base_branch?: string
}

export const dispatchApi = {
  list: (status?: string): Promise<DispatchCardDTO[]> =>
    api.get('/api/v1/dispatches', { params: status ? { status } : {} }).then((r) => r.data),
  count: (): Promise<{ count: number }> =>
    api.get('/api/v1/dispatches/count').then((r) => r.data),
  approve: (id: string, opts: ApproveOptions): Promise<DispatchCardDTO> =>
    api.post(`/api/v1/dispatches/${id}/approve`, opts).then((r) => r.data),
  discard: (id: string): Promise<void> =>
    api.post(`/api/v1/dispatches/${id}/discard`).then(() => undefined),
  getGitHubSettings: (): Promise<{ github_repo: string | null; github_base_branch: string }> =>
    api.get('/api/v1/admin/github-settings').then((r) => r.data),
  upsertGitHubSettings: (github_repo: string, github_base_branch = 'main') =>
    api.post('/api/v1/admin/github-settings', { github_repo, github_base_branch }).then((r) => r.data),
}

export type SlackWorkspaceDTO = {
  id: string
  slack_team_id: string
  slack_team_name: string
  bot_user_id: string
  installed_by_user_id: string | null
  installed_at: string
}

export type SlackChannelDTO = {
  id: string
  name: string
  is_member: boolean
  is_private: boolean
  is_subscribed: boolean
}

export type SlackStatusDTO = {
  oauth_configured: boolean
  signing_secret_configured: boolean
  events_webhook_url: string
  slash_command_url: string
  workspaces_connected: number
}

export const slackApi = {
  getStatus: (): Promise<SlackStatusDTO> =>
    api.get('/api/v1/slack/status').then((r) => r.data),
  getAuthorizeUrl: (): Promise<{ url: string }> =>
    api.get('/api/v1/slack/oauth/authorize-url').then((r) => r.data),
  listWorkspaces: (): Promise<SlackWorkspaceDTO[]> =>
    api.get('/api/v1/slack/workspaces').then((r) => r.data),
  listChannels: (wsId: string): Promise<SlackChannelDTO[]> =>
    api.get(`/api/v1/slack/workspaces/${wsId}/channels`).then((r) => r.data),
  setSubscription: (wsId: string, channelId: string, enabled: boolean, channelName: string): Promise<{ status: string }> =>
    api.put(`/api/v1/slack/workspaces/${wsId}/channels/${channelId}`, { enabled, channel_name: channelName }).then((r) => r.data),
  disconnect: (wsId: string): Promise<{ status: string }> =>
    api.delete(`/api/v1/slack/workspaces/${wsId}`).then((r) => r.data),
}

export type OnboardingBriefDTO = {
  draft_node_id: string
  draft: GraphNode
  source_node_ids: string[]
}

export type AdminUserDTO = {
  id: string
  name: string
  email: string
  role: string
  team_id: string | null
}

export type AdminTeamDTO = {
  id: string
  name: string
  color: string
  is_private: boolean
}

export const onboardingApi = {
  listUsers: (): Promise<AdminUserDTO[]> =>
    api.get('/api/v1/onboarding/users').then((r) => r.data),
  listTeams: (): Promise<AdminTeamDTO[]> =>
    api.get('/api/v1/onboarding/teams').then((r) => r.data),
  generate: (body: { new_user_id: string; role: string; team_id: string }): Promise<OnboardingBriefDTO> =>
    api.post('/api/v1/onboarding/brief', body).then((r) => r.data),
}

export type MemberRole = 'admin' | 'team_lead' | 'employee'

export type PendingInvitationDTO = {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

export const teamPermissionsApi = {
  listMembers: (): Promise<AdminUserDTO[]> =>
    api.get('/api/v1/onboarding/users').then((r) => r.data),
  listInvitations: (): Promise<PendingInvitationDTO[]> =>
    api.get('/api/v1/auth/invitations').then((r) => r.data),
  updateRole: (userId: string, role: MemberRole): Promise<{ id: string; role: string }> =>
    api.patch(`/api/v1/onboarding/users/${userId}/role`, { role }).then((r) => r.data),
  revokeInvitation: (inviteId: string): Promise<void> =>
    api.delete(`/api/v1/auth/invitations/${inviteId}`).then(() => undefined),
}

export type TeamDTO = {
  id: string
  name: string
  color: string
  is_private: boolean
  member_count: number
  created_at: string
}

export type TeamMemberDTO = {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export const teamsApi = {
  list: (): Promise<TeamDTO[]> => api.get('/api/v1/teams').then((r) => r.data),
  create: (body: { name: string; color?: string; is_private?: boolean }): Promise<TeamDTO> =>
    api.post('/api/v1/teams', body).then((r) => r.data),
  update: (id: string, body: { name?: string; color?: string; is_private?: boolean }): Promise<TeamDTO> =>
    api.put(`/api/v1/teams/${id}`, body).then((r) => r.data),
  remove: (id: string): Promise<void> => api.delete(`/api/v1/teams/${id}`).then((r) => r.data),
  listMembers: (id: string): Promise<TeamMemberDTO[]> =>
    api.get(`/api/v1/teams/${id}/members`).then((r) => r.data),
  addMember: (id: string, userId: string): Promise<TeamMemberDTO> =>
    api.post(`/api/v1/teams/${id}/members`, { user_id: userId }).then((r) => r.data),
  removeMember: (teamId: string, userId: string): Promise<void> =>
    api.delete(`/api/v1/teams/${teamId}/members/${userId}`).then((r) => r.data),
}

export type AdminStatsDTO = {
  node_counts: {
    total: number
    active: number
    stale: number
    by_type: Record<string, number>
  }
  user_counts: {
    total: number
    by_role: Record<string, number>
  }
  team_count: number
  ingestion_events_7d: number
  ingestion_events_30d: number
  active_users_30d: number
  slack_workspaces_connected: number
  brain_health: {
    pct_embedded: number | null
    pct_fresh: number | null
  }
}

export type AdminUserRowDTO = {
  id: string
  name: string
  email: string
  role: string
  team_id: string | null
  team_name: string | null
  created_at: string
}

export type AdminUsersResponse = {
  users: AdminUserRowDTO[]
  next_cursor: string | null
}

export const adminApi = {
  getStats: (opts: { refresh?: boolean } = {}): Promise<AdminStatsDTO> =>
    api.get('/api/v1/admin/stats', { params: opts.refresh ? { refresh: 1 } : {} }).then((r) => r.data),
  listUsers: (cursor?: string, limit?: number): Promise<AdminUsersResponse> =>
    api.get('/api/v1/admin/users', { params: { cursor, limit } }).then((r) => r.data),
}

export type InviteInfoDTO = {
  company_name: string
  team_name: string | null
  is_valid: boolean
}

export type AuthTokenResponse = {
  access_token?: string
  refresh_token?: string
  user: User
}

export const authApi = {
  createInvite: (body: { email: string; role: string; team_id: string | null }): Promise<Invitation> =>
    api.post('/api/v1/auth/invite', body).then((r) => r.data),
  getInvite: (token: string): Promise<InviteInfoDTO> =>
    publicApi.get(`/api/v1/auth/invite/${token}`).then((r) => r.data),
  acceptInvite: (token: string, name: string, password: string): Promise<AuthTokenResponse> =>
    publicApi.post('/api/v1/auth/register', { token, name, password }).then((r) => r.data),
  google: (idToken: string): Promise<AuthTokenResponse> =>
    publicApi.post('/api/v1/auth/google', { id_token: idToken }).then((r) => r.data),
  createCompany: (body: {
    company_name: string
    admin_name: string
    admin_email: string
    admin_password: string
  }): Promise<AuthTokenResponse> =>
    publicApi.post('/api/v1/auth/company', body).then((r) => r.data),
  me: (): Promise<{ user: User }> =>
    publicApi.get('/api/v1/auth/me').then((r) => r.data),
  logout: (): Promise<void> =>
    publicApi.post('/api/v1/auth/logout').then(() => undefined),
  forgotPassword: (email: string): Promise<void> =>
    publicApi.post('/api/v1/auth/forgot-password', { email }).then(() => undefined),
  resetPassword: (token: string, password: string): Promise<AuthTokenResponse> =>
    publicApi.post('/api/v1/auth/reset-password', { token, password }).then((r) => r.data),
}

export type LinearStatusDTO = {
  connected: boolean
  org_id: string | null
  org_name: string | null
  connected_at: string | null
}

export type LinearConnectResponse = {
  org_id: string
  org_name: string
  connected: boolean
}

export const linearApi = {
  status: (): Promise<LinearStatusDTO> =>
    api.get('/api/v1/linear/status').then((r) => r.data),
  connect: (apiToken: string, webhookSecret: string): Promise<LinearConnectResponse> =>
    api.post('/api/v1/linear/connect', { api_token: apiToken, webhook_secret: webhookSecret }).then((r) => r.data),
  disconnect: (): Promise<{ status: string }> =>
    api.delete('/api/v1/linear/disconnect').then((r) => r.data),
}

export type NotificationDTO = import('../../types/notification').NotificationDTO
export type NotificationPreferenceDTO = import('../../types/notification').NotificationPreferenceDTO

export const notificationsApi = {
  list: (params: { unread_only?: boolean; limit?: number; before?: string } = {}): Promise<NotificationDTO[]> =>
    api.get('/api/v1/notifications', { params }).then((r) => r.data),
  count: (): Promise<{ count: number }> =>
    api.get('/api/v1/notifications/count').then((r) => r.data),
  markRead: (id: string): Promise<NotificationDTO> =>
    api.post(`/api/v1/notifications/${id}/read`).then((r) => r.data),
  markAllRead: (): Promise<{ updated: number }> =>
    api.post('/api/v1/notifications/read-all').then((r) => r.data),
  getPreferences: (): Promise<NotificationPreferenceDTO[]> =>
    api.get('/api/v1/notifications/preferences').then((r) => r.data),
  patchPreference: (body: {
    category: string
    channel: string
    enabled: boolean
    quiet_hours_start?: string | null
    quiet_hours_end?: string | null
    timezone?: string | null
  }): Promise<NotificationPreferenceDTO> =>
    api.patch('/api/v1/notifications/preferences', body).then((r) => r.data),
  registerDevice: (platform: 'web' | 'ios', token: string): Promise<{ id: string; registered: boolean }> =>
    api.post('/api/v1/notifications/devices', { platform, token }).then((r) => r.data),
  unregisterDevice: (id: string): Promise<{ deleted: boolean }> =>
    api.delete(`/api/v1/notifications/devices/${id}`).then((r) => r.data),
  vapidPublicKey: (): Promise<{ public_key: string }> =>
    api.get('/api/v1/notifications/vapid-public-key').then((r) => r.data),
}
