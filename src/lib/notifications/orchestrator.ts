import type { WSMessage } from '../../types/ws'
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

/** Map legacy domain WS events to toasts when no persisted notification exists yet. */
export function handleDomainEventForToast(msg: WSMessage): void {
  const store = useNotificationStore.getState()
  switch (msg.type) {
    case 'dispatch_pending':
      store.addToast({
        title: 'New dispatch',
        body: `${msg.payload.count} item${msg.payload.count === 1 ? '' : 's'} awaiting approval`,
        severity: 'critical',
        actionUrl: '/dispatch',
        sticky: true,
      })
      break
    case 'broadcast_pending':
      store.addToast({
        title: 'Outbox',
        body: 'A Slack broadcast is ready for approval',
        severity: 'critical',
        actionUrl: '/outbox',
        sticky: true,
      })
      break
    case 'dispatch_complete':
      store.addToast({
        title: 'Dispatch complete',
        body: 'A pull request was opened',
        severity: 'important',
        actionUrl: '/dispatch',
        sticky: false,
      })
      break
    case 'dispatch_failed':
      store.addToast({
        title: 'Dispatch failed',
        body: msg.payload.error,
        severity: 'critical',
        actionUrl: '/dispatch',
        sticky: true,
      })
      break
    default:
      break
  }
}
