import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { Spinner } from './components/ui'
import { NotificationProvider } from './components/notifications/NotificationProvider'
import { BrainQuery } from './views/BrainQuery'
import { CompanyBrain } from './views/CompanyBrain'
import { ConnectApp } from './views/ConnectApp'
import { MyBrain } from './views/MyBrain'
import { Timeline } from './views/Timeline'
import { Tasks } from './views/Tasks'
import { Drafts } from './views/Drafts'
import { Outbox } from './views/Outbox'
import { Dispatch } from './views/Dispatch'
import { SlackSettings } from './views/SlackSettings'
import { LinearSettings } from './views/LinearSettings'
import { LoginView } from './views/LoginView'
import { InviteAccept } from './views/InviteAccept'
import { ForgotPassword } from './views/ForgotPassword'
import { ResetPassword } from './views/ResetPassword'
import { CompanySignup } from './views/CompanySignup'
import { TeamManagement } from './views/TeamManagement'
import { TeamPermissions } from './views/TeamPermissions'
import { AdminDashboard } from './views/AdminDashboard'
import { LandingView } from './views/LandingView'
import { PricingView } from './views/PricingView'
import { OnboardingView } from './views/OnboardingView'
import { NotificationSettings } from './views/NotificationSettings'
import { useAuthStore } from './store/authStore'
import { wsClient } from './lib/ws/client'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'admin') return <Navigate to="/brain/company" replace />
  return <>{children}</>
}

function RequireAdminOrLead({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'admin' && user?.role !== 'team_lead')
    return <Navigate to="/brain/company" replace />
  return <>{children}</>
}

function BootGate({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const isLoaded = useAuthStore((s) => s.isLoaded)
  useEffect(() => {
    bootstrap()
  }, [bootstrap])
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Spinner size="lg" />
      </div>
    )
  }
  return <>{children}</>
}

const WEB_ONBOARDING_KEY = 'penlo.web.onboarding.completed'

function PrivateLayout() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (user?.company_id) {
      wsClient.connect(user.company_id)
    }
    return () => wsClient.disconnect()
  }, [user?.company_id])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!user) return
    if (location.pathname === '/onboarding') return
    try {
      if (!localStorage.getItem(WEB_ONBOARDING_KEY)) {
        navigate('/onboarding', { replace: true })
      }
    } catch {
      // ignore storage errors
    }
  }, [user, location.pathname, navigate])

  if (!user) return <Navigate to="/login" replace />

  const menuProps = { onMenuClick: () => setMobileOpen(true) }

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/onboarding" element={<OnboardingView {...menuProps} />} />
              <Route path="/brain/ask" element={<BrainQuery {...menuProps} />} />
              <Route path="/brain/company" element={<CompanyBrain {...menuProps} />} />
              <Route path="/brain/me" element={<MyBrain {...menuProps} />} />
              <Route path="/timeline" element={<Timeline {...menuProps} />} />
              <Route path="/tasks" element={<Tasks {...menuProps} />} />
              <Route path="/drafts" element={<Navigate to="/admin/drafts" replace />} />
              <Route path="/admin/drafts" element={<RequireAdmin><Drafts {...menuProps} /></RequireAdmin>} />
              <Route path="/activity" element={<Navigate to="/timeline" replace />} />
              <Route path="/connect" element={<ConnectApp {...menuProps} />} />
              <Route path="/outbox" element={<RequireAdminOrLead><Outbox {...menuProps} /></RequireAdminOrLead>} />
              <Route path="/dispatch" element={<RequireAdminOrLead><Dispatch {...menuProps} /></RequireAdminOrLead>} />
              <Route path="/settings/notifications" element={<NotificationSettings {...menuProps} />} />
              <Route path="/slack-settings" element={<SlackSettings {...menuProps} />} />
              <Route path="/linear-settings" element={<RequireAdmin><LinearSettings {...menuProps} /></RequireAdmin>} />
              <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard {...menuProps} /></RequireAdmin>} />
              <Route path="/admin/teams" element={<RequireAdmin><TeamManagement {...menuProps} /></RequireAdmin>} />
              <Route path="/admin/permissions" element={<RequireAdminOrLead><TeamPermissions {...menuProps} /></RequireAdminOrLead>} />
              <Route path="*" element={<Navigate to="/brain/company" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </NotificationProvider>
  )
}

export default function App() {
  return (
    <BootGate>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/pricing" element={<PricingView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/signup" element={<CompanySignup />} />
        <Route path="/*" element={<PrivateLayout />} />
      </Routes>
    </BootGate>
  )
}
