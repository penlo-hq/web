import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  Building2,
  ClipboardList,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Send,
  Settings,
  Shield,
  Sparkles,
  Users,
  Zap,
  Link2,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useOutboxStore } from '../../store/outboxStore'
import { useDispatchStore } from '../../store/dispatchStore'
import { useActivityStore } from '../../store/activityStore'
import { publicApi } from '../../lib/api/client'
import { broadcastsApi, dispatchApi } from '../../lib/api/endpoints'
import { Badge } from '../ui/Badge'
import { SectionLabel } from '../ui/SectionLabel'

type NavItem = {
  to: string
  label: string
  icon: typeof Sparkles
  adminOnly?: boolean
  adminOrLead?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/brain/ask', label: 'Ask Brain', icon: Sparkles },
  { to: '/brain/company', label: 'Company Brain', icon: Building2 },
  { to: '/brain/me', label: 'My Brain', icon: GitBranch },
  { to: '/timeline', label: 'Timeline', icon: Activity },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/drafts', label: 'Drafts', icon: FileText },
  { to: '/activity', label: 'Activity', icon: MessageSquare },
  { to: '/connect', label: 'Connect App', icon: Link2 },
  { to: '/dispatch', label: 'Dispatch', icon: Zap, adminOrLead: true },
  { to: '/outbox', label: 'Outbox', icon: Send, adminOrLead: true },
  { to: '/slack-settings', label: 'Slack', icon: MessageSquare, adminOnly: true },
  { to: '/admin/permissions', label: 'Permissions', icon: Shield, adminOrLead: true },
  { to: '/linear-settings', label: 'Linear', icon: Settings, adminOnly: true },
  { to: '/admin/dashboard', label: 'Admin', icon: LayoutDashboard, adminOnly: true },
  { to: '/admin/teams', label: 'Teams', icon: Users, adminOnly: true },
]

function canSeeOutbox(role: string | undefined): boolean {
  return role === 'admin' || role === 'team_lead'
}

function initials(name?: string): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

type SidebarProps = {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const navigate = useNavigate()
  const pendingCount = useOutboxStore((s) => s.pendingCount)
  const setPendingCount = useOutboxStore((s) => s.setPendingCount)
  const dispatchCount = useDispatchStore((s) => s.pendingCount)
  const setDispatchCount = useDispatchStore((s) => s.setPendingCount)
  const activityUnread = useActivityStore((s) => s.unreadCount)
  useEffect(() => {
    if (!canSeeOutbox(user?.role)) {
      setPendingCount(0)
      setDispatchCount(0)
      return
    }
    broadcastsApi.count()
      .then((r) => setPendingCount(r.count))
      .catch((exc) => console.error('outbox count fetch failed', exc))
    dispatchApi.count()
      .then((r) => setDispatchCount(r.count))
      .catch((exc) => console.error('dispatch count fetch failed', exc))
  }, [user?.id, user?.role, setPendingCount, setDispatchCount])

  const items = NAV_ITEMS.filter((n) => {
    if (n.adminOnly) return user?.role === 'admin'
    if (n.adminOrLead) return canSeeOutbox(user?.role)
    return true
  })

  const firstAdminIdx = items.findIndex((n) => n.adminOnly || n.adminOrLead)

  async function handleLogout() {
    try {
      await publicApi.post('/api/v1/auth/logout')
    } catch {
      // best-effort
    }
    clearUser()
    navigate('/login', { replace: true })
  }

  const navContent = (
    <>
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel className="mb-1">Penlo</SectionLabel>
            <div className="font-display font-semibold text-headline text-text-primary leading-tight">
              Enterprise Brain
            </div>
          </div>
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/[0.06] focus-ring"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={item.to}>
              {firstAdminIdx > 0 && idx === firstAdminIdx && (
                <hr className="my-2 border-text-secondary/15" />
              )}
              <NavLink
                to={item.to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors focus-ring ${
                    isActive
                      ? 'bg-accent-tint text-accent'
                      : 'text-text-primary hover:bg-black/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-text-secondary'}`}
                      strokeWidth={1.75}
                    />
                    <span className="text-body font-medium leading-tight flex-1">{item.label}</span>
                    {item.to === '/outbox' && pendingCount > 0 && (
                      <Badge variant={isActive ? 'accent' : 'accent'}>{pendingCount}</Badge>
                    )}
                    {item.to === '/dispatch' && dispatchCount > 0 && (
                      <Badge pulse variant="accent">
                        {dispatchCount}
                      </Badge>
                    )}
                    {item.to === '/activity' && activityUnread > 0 && (
                      <Badge variant="accent">{activityUnread}</Badge>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-text-secondary/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent-tint text-accent flex items-center justify-center text-caption-sm font-semibold">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-caption font-medium text-text-primary truncate">{user?.name}</div>
            <div className="text-caption-sm text-text-secondary truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-caption-sm text-text-secondary hover:text-text-primary transition-colors focus-ring rounded-lg px-1 py-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[300px] shrink-0 h-screen flex-col bg-surface">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] flex flex-col bg-surface transform transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/[0.06] focus-ring"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5 text-text-primary" />
    </button>
  )
}
