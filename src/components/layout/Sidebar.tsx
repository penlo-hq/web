import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { publicApi } from '../../lib/api/client'

type NavItem = { to: string; label: string; sublabel: string; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { to: '/brain/ask', label: 'Ask Brain', sublabel: 'Query in plain English' },
  { to: '/brain/company', label: 'Company Brain', sublabel: 'Federation view' },
  { to: '/brain/me', label: 'My Brain', sublabel: 'Personal graph' },
  { to: '/timeline', label: 'Timeline', sublabel: 'Replay history' },
  { to: '/tasks', label: 'Tasks', sublabel: 'Action items' },
  { to: '/drafts', label: 'Drafts', sublabel: 'Pending comms' },
  { to: '/activity', label: 'Activity', sublabel: 'What the brain just learned' },
  { to: '/connect', label: 'Connect App', sublabel: 'Link Penlo device' },
  { to: '/slack-settings', label: 'Slack', sublabel: 'Manage integration', adminOnly: true },
  { to: '/admin/dashboard', label: 'Admin', sublabel: 'Dashboard', adminOnly: true },
  { to: '/admin/teams', label: 'Teams', sublabel: 'Manage members', adminOnly: true },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const navigate = useNavigate()
  const items = NAV_ITEMS.filter((n) => !n.adminOnly || user?.role === 'admin')

  async function handleLogout() {
    try {
      await publicApi.post('/api/v1/auth/logout')
    } catch {
      // best-effort: navigate regardless
    }
    clearUser()
    navigate('/login', { replace: true })
  }

  const firstAdminIdx = items.findIndex((n) => n.adminOnly)

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
                  <span className="text-[13px] font-medium leading-tight">{item.label}</span>
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
