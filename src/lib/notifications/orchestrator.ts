import type { NotificationDTO } from '../../types/notification'
import { useNotificationStore } from '../../store/notificationStore'
import { useAuthStore } from '../../store/authStore'

function shouldToast(severity: NotificationDTO['severity']): boolean {
  return severity === 'critical' || severity === 'important'
}

export function handleNotificationPayload(payload: NotificationDTO): void {
  const user = useAuthStore.getState().user
  if (user && payload.user_id && payload.user_id !== user.id) return

  const store = useNotificationStore.getState()
  store.prepend(payload)

  if (shouldToast(payload.severity)) {
    store.addToast({
      notificationId: payload.id,
      title: payload.title,
      body: payload.body,
      severity: payload.severity,
      actionUrl: payload.action_url,
      sticky: payload.severity === 'critical',
    })
  }
}

export function markEntityNotificationsRead(entityId: string): void {
  const store = useNotificationStore.getState()
  for (const item of store.items) {
    if (item.entity_id === entityId && !item.read_at) {
      void store.markRead(item.id)
    }
  }
}
