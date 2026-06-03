import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, Send, Sparkles, X, Zap } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import type { NotificationCategory, NotificationDTO } from '../../types/notification'
import { Button } from '../ui/Button'

function categoryIcon(category: NotificationCategory) {
  switch (category) {
    case 'action_required':
      return Zap
    case 'progress':
      return Send
    case 'awareness':
      return Sparkles
    case 'system':
      return AlertTriangle
    default:
      return Bell
  }
}

function formatGroupDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupNotifications(items: NotificationDTO[]) {
  const groups = new Map<string, NotificationDTO[]>()
  for (const n of items) {
    const key = formatGroupDate(n.created_at)
    const list = groups.get(key) ?? []
    list.push(n)
    groups.set(key, list)
  }
  return [...groups.entries()]
}

type Props = {
  open: boolean
  onClose: () => void
}

export function NotificationCenter({ open, onClose }: Props) {
  const items = useNotificationStore((s) => s.items)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const fetchMore = useNotificationStore((s) => s.fetchMore)
  const navigate = useNavigate()

  const groups = useMemo(() => groupNotifications(items), [items])

  if (!open) return null

  async function openItem(n: NotificationDTO) {
    if (!n.read_at) await markRead(n.id)
    if (n.action_url) {
      onClose()
      navigate(n.action_url)
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] bg-black/20"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 z-[95] h-full w-full max-w-md bg-surface border-l border-text-secondary/10 shadow-xl flex flex-col">
        <div className="px-5 py-4 border-b border-text-secondary/10 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-text-primary">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-caption-sm text-text-secondary">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
                Mark all read
              </Button>
            )}
            <button type="button" className="p-2 text-text-secondary hover:text-text-primary" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">You're all caught up</div>
          ) : (
            groups.map(([label, list]) => (
              <div key={label}>
                <div className="px-5 py-2 text-caption-sm uppercase tracking-section text-text-secondary bg-canvas/50">
                  {label}
                </div>
                <ul>
                  {list.map((n) => {
                    const Icon = categoryIcon(n.category)
                    const unread = !n.read_at
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={`w-full text-left px-5 py-3 flex gap-3 border-b border-text-secondary/5 hover:bg-canvas/60 transition-colors ${
                            unread ? 'bg-accent/5' : ''
                          }`}
                          onClick={() => void openItem(n)}
                        >
                          <div className={`mt-0.5 ${unread ? 'text-accent' : 'text-text-secondary'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-text-primary truncate">{n.title}</span>
                              {unread && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">{n.body}</p>
                            <p className="text-caption-sm text-text-secondary/70 mt-1">
                              {new Date(n.created_at).toLocaleTimeString(undefined, {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {items.length >= 50 && (
          <div className="p-4 border-t border-text-secondary/10">
            <Button variant="ghost" className="w-full" onClick={() => void fetchMore()}>
              Load older
            </Button>
          </div>
        )}

        <div className="p-4 border-t border-text-secondary/10">
          <Button variant="ghost" className="w-full" onClick={() => { onClose(); navigate('/settings/notifications') }}>
            Notification settings
          </Button>
        </div>
      </aside>
    </>
  )
}
