import { Bell } from 'lucide-react'
import { useGraphStore } from '../../store/graphStore'
import { useNotificationStore } from '../../store/notificationStore'
import { MobileMenuButton } from './Sidebar'

type Props = {
  title: string
  subtitle?: string
  onMenuClick?: () => void
  actions?: React.ReactNode
  /** When true, show timeline replay date instead of subtitle if timelineAt is set. */
  useTimelineEyebrow?: boolean
}

export function TopBar({ title, subtitle, onMenuClick, actions, useTimelineEyebrow = false }: Props) {
  const timelineAt = useGraphStore((s) => s.timelineAt)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const wsConnected = useNotificationStore((s) => s.wsConnected)
  const togglePanel = useNotificationStore((s) => s.togglePanel)

  const eyebrow =
    useTimelineEyebrow && timelineAt
      ? `Viewing ${new Date(timelineAt).toLocaleDateString()}`
      : subtitle ?? null

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 border-b border-border bg-canvas/95 backdrop-blur-sm sticky top-0 z-10">
      {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold tracking-[0.10em] text-text-tertiary uppercase">
              {eyebrow}
            </span>
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-success' : 'bg-text-tertiary'}`}
              title={wsConnected ? 'Connected' : 'Reconnecting…'}
            />
          </div>
        )}
        <h1 className="font-semibold text-[20px] text-text-primary leading-tight tracking-[-0.02em] truncate">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      <button
        type="button"
        className="relative min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-accent-tint focus-ring shrink-0"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={togglePanel}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
