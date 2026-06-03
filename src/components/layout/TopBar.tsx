import { Bell } from 'lucide-react'
import { useGraphStore } from '../../store/graphStore'
import { useNotificationStore } from '../../store/notificationStore'
import { MobileMenuButton } from './Sidebar'

type Props = {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function TopBar({ title, subtitle, onMenuClick }: Props) {
  const timelineAt = useGraphStore((s) => s.timelineAt)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const wsConnected = useNotificationStore((s) => s.wsConnected)
  const togglePanel = useNotificationStore((s) => s.togglePanel)

  const eyebrow = timelineAt
    ? `Viewing ${new Date(timelineAt).toLocaleDateString()}`
    : subtitle ?? 'Live'

  return (
    <div className="px-5 py-4 flex items-center gap-3 border-b border-text-secondary/10">
      {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-caption-sm uppercase tracking-section text-text-secondary mb-0.5">
          <span>{eyebrow}</span>
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-text-secondary/40'}`}
            title={wsConnected ? 'Connected' : 'Reconnecting…'}
          />
        </div>
        <h1 className="font-display font-semibold text-[22px] text-text-primary leading-tight truncate">
          {title}
        </h1>
      </div>
      <button
        type="button"
        className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-black/[0.04] transition-colors shrink-0"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={togglePanel}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>
    </div>
  )
}
