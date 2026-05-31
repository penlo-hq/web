import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useOutboxStore } from '../../store/outboxStore'
import { publicApi } from '../../lib/api/client'
import { broadcastsApi } from '../../lib/api/endpoints'

type NavItem = {
  to: string
  label: string
  sublabel: string
  adminOnly?: boolean
  adminOrLead?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/brain/ask', label: 'Ask Brain', sublabel: 'Query in plain English' },
  { to: '/brain/company', label: 'Company Brain', sublabel: 'Federation view' },
  { to: '/brain/me', label: 'My Brain', sublabel: 'Personal graph' },
  { to: '/timeline', label: 'Timeline', sublabel: 'Replay history' },
  { to: '/tasks', label: 'Tasks', sublabel: 'Action items' },
  { to: '/drafts', label: 'Drafts', sublabel: 'Pending comms' },
  { to: '/activity', label: 'Activity', sublabel: 'What the brain just learned' },
  { to: '/connect', label: 'Connect App', sublabel: 'Link Penlo device' },
  { to: '/outbox', label: 'Outbox', sublabel: 'Pending Slack messages', adminOrLead: true },
  { to: '/slack-settings', label: 'Slack', sublabel: 'Manage integration', adminOnly: true },
  { to: '/admin/dashboard', label: 'Admin', sublabel: 'Dashboard', adminOnly: true },
  { to: '/admin/teams', label: 'Teams', sublabel: 'Manage members', adminOnly: true },
]

function canSeeOutbox(role: string | undefined): boolean {
  return role === 'admin' || role === 'team_lead'
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const navigate = useNavigate()
  const pendingCount = useOutboxStore((s) => s.pendingCount)
  const setPendingCount = useOutboxStore((s) => s.setPendingCount)

  useEffect(() => {
    if (!canSeeOutbox(user?.role)) {
      setPendingCount(0)
      return
    }
    broadcastsApi.count()
      .then((r) => setPendingCount(r.count))
      .catch((exc) => console.error('outbox count fetch failed', exc))
  }, [user?.id, user?.role, setPendingCount])

  const items = NAV_ITEMS.filter((n) => {
    if (n.adminOnly) return user?.role === 'admin'
    if (n.adminOrLead) return canSeeOutbox(user?.role)
    return true
  })

  async function handleLogout() {
    try {
      await publicApi.post('/api/v1/auth/logout')
    } catch {
      // best-effort: navigate regardless
    }
    clearUser()
    navigate('/login', { replace: true })
  }

  const firstAdminIdx = items.findIndex((n) => n.adminOnly || n.adminOrLead)

  return (
    <aside className="w-[220px] shrink-0 h-screen flex flex-col border-r border-mist bg-white">
      <div className="px-5 pt-6 pb-4 border-b border-mist">
        <div className="text-[9.5px] uppercase tracking-[0.22em] text-stone mb-1">Penlo</div>
        <div className="font-display font-bold text-[16px] tracking-tightest text-ink leading-tight">
          Enterprise Brain
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item, idx) => (
          <div key={item.to}>
            {firstAdminIdx > 0 && idx === firstAdminIdx && (
              <hr className="my-2 border-mist" />
            )}
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-ink text-white' : 'text-graphite hover:bg-paper hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="text-[13px] font-medium leading-tight flex items-center gap-1.5">
                    {item.label}
                    {item.to === '/outbox' && pendingCount > 0 && (
                      <span
                        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                          isActive ? 'bg-white text-ink' : 'bg-ink text-white'
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'text-white/60' : 'text-stone'}`}>
                    {item.sublabel}
                  </span>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-mist">
        <div className="text-[12px] font-medium text-ink truncate">{user?.name}</div>
        <div className="text-[10.5px] text-stone truncate">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="mt-2 text-[10.5px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
