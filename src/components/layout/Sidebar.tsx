import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  GitBranch,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useOutboxStore } from '../../store/outboxStore'
import { useDispatchStore } from '../../store/dispatchStore'
import { useActivityStore } from '../../store/activityStore'
import { publicApi } from '../../lib/api/client'
import { broadcastsApi, dispatchApi } from '../../lib/api/endpoints'
import { Badge } from '../ui/Badge'

type NavItem = {
  to: string
  label: string
  icon: typeof Sparkles
  adminOnly?: boolean
  adminOrLead?: boolean
}

type NavSection = {
  label?: string
  items: NavItem[]
  adminOnly?: boolean
  adminOrLead?: boolean
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/brain/ask', label: 'Ask Brain', icon: Sparkles },
      { to: '/brain/company', label: 'Company Brain', icon: Building2 },
      { to: '/brain/me', label: 'My Brain', icon: GitBranch },
      { to: '/timeline', label: 'Timeline', icon: Activity },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/tasks', label: 'Tasks', icon: ClipboardList },
      { to: '/dispatch', label: 'Dispatch', icon: Zap, adminOrLead: true },
      { to: '/outbox', label: 'Outbox', icon: Send, adminOrLead: true },
    ],
  },
  {
    label: 'Team',
    adminOrLead: true,
    items: [
      { to: '/admin/permissions', label: 'Permissions', icon: Shield, adminOrLead: true },
      { to: '/admin/teams', label: 'Teams', icon: Users, adminOnly: true },
      { to: '/slack-settings', label: 'Slack', icon: MessageSquare, adminOnly: true },
      { to: '/linear-settings', label: 'Linear', icon: GitBranch, adminOnly: true },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
      { to: '/admin/drafts', label: 'Drafts', icon: FileText, adminOnly: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings/notifications', label: 'Notifications', icon: Bell },
      { to: '/connect', label: 'Connect App', icon: Link2 },
    ],
  },
]

function canSeeAdminOrLead(role: string | undefined): boolean {
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

function NavItemRow({
  item,
  pendingCount,
  dispatchCount,
  activityUnread,
  onMobileClose,
}: {
  item: NavItem
  pendingCount: number
  dispatchCount: number
  activityUnread: number
  onMobileClose?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onMobileClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors focus-ring group ${
          isActive
            ? 'bg-accent-tint text-accent'
            : 'text-text-primary hover:bg-black/[0.04]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'
            }`}
            strokeWidth={isActive ? 2 : 1.75}
          />
          <span className="text-body font-medium leading-tight flex-1 truncate">{item.label}</span>
          {item.to === '/outbox' && pendingCount > 0 && (
            <Badge variant="accent">{pendingCount}</Badge>
          )}
          {item.to === '/dispatch' && dispatchCount > 0 && (
            <Badge pulse variant="accent">{dispatchCount}</Badge>
          )}
          {item.to === '/timeline' && activityUnread > 0 && (
            <Badge variant="accent">{activityUnread}</Badge>
          )}
        </>
      )}
    </NavLink>
  )
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
    if (!canSeeAdminOrLead(user?.role)) {
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

  async function handleLogout() {
    try {
      await publicApi.post('/api/v1/auth/logout')
    } catch {
      // best-effort
    }
    clearUser()
    navigate('/login', { replace: true })
  }

  const visibleSections = NAV_SECTIONS.map((section) => {
    const items = section.items.filter((item) => {
      if (item.adminOnly) return user?.role === 'admin'
      if (item.adminOrLead) return canSeeAdminOrLead(user?.role)
      return true
    })
    return { ...section, items }
  }).filter((section) => {
    if (section.adminOnly) return user?.role === 'admin'
    if (section.adminOrLead) return canSeeAdminOrLead(user?.role)
    return section.items.length > 0
  })

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="font-semibold text-[13px] leading-tight text-text-primary tracking-[-0.01em]">
              Penlo
            </div>
            <div className="text-[10px] text-text-tertiary leading-tight">Enterprise Brain</div>
          </div>
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.06] focus-ring"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        )}
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {visibleSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className={sectionIdx > 0 ? 'pt-3' : ''}>
            {section.label && (
              <div className="px-3 pb-1">
                <span className="text-[10px] font-semibold tracking-[0.10em] text-text-tertiary uppercase">
                  {section.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  pendingCount={pendingCount}
                  dispatchCount={dispatchCount}
                  activityUnread={activityUnread}
                  onMobileClose={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: user identity + sign out */}
      <div className="px-3 py-3 border-t border-black/[0.06]">
        <div className="flex items-center gap-2.5 px-1 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-text-primary truncate leading-tight">
              {user?.name}
            </div>
            <div className="text-[11px] text-text-tertiary truncate leading-tight">
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-text-secondary hover:text-text-primary hover:bg-black/[0.04] transition-colors focus-ring"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] shrink-0 h-screen flex-col bg-surface border-r border-black/[0.06]">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-surface border-r border-black/[0.06] transform transition-transform duration-300 ease-out md:hidden ${
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
