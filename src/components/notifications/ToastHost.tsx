import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import { Button } from '../ui/Button'

export function ToastHost() {
  const toasts = useNotificationStore((s) => s.toasts)
  const dismissToast = useNotificationStore((s) => s.dismissToast)
  const markRead = useNotificationStore((s) => s.markRead)
  const navigate = useNavigate()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-card border border-text-secondary/15 bg-surface shadow-lg p-4 animate-in slide-in-from-right-4"
          role="status"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text-primary text-sm">{t.title}</div>
              <div className="text-text-secondary text-sm mt-0.5 line-clamp-3">{t.body}</div>
              {t.actionUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    if (t.notificationId) void markRead(t.notificationId)
                    dismissToast(t.id)
                    navigate(t.actionUrl!)
                  }}
                >
                  View
                </Button>
              )}
            </div>
            <button
              type="button"
              className="text-text-secondary hover:text-text-primary p-1 -mr-1 -mt-1"
              aria-label="Dismiss"
              onClick={() => dismissToast(t.id)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
