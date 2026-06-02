export type NotificationCategory = 'action_required' | 'progress' | 'awareness' | 'system'
export type NotificationSeverity = 'critical' | 'important' | 'info'

export type NotificationDTO = {
  id: string
  company_id: string
  user_id: string
  category: NotificationCategory
  severity: NotificationSeverity
  type: string
  title: string
  body: string
  action_url: string | null
  entity_type: string | null
  entity_id: string | null
  meta: Record<string, unknown>
  read_at: string | null
  dismissed_at: string | null
  created_at: string
}

export type NotificationPreferenceDTO = {
  category: string
  channel: string
  enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string | null
}

export type ToastItem = {
  id: string
  notificationId?: string
  title: string
  body: string
  severity: NotificationSeverity
  actionUrl?: string | null
  sticky: boolean
  createdAt: number
}
