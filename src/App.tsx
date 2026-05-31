import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { BrainQuery } from './views/BrainQuery'
import { CompanyBrain } from './views/CompanyBrain'
import { ConnectApp } from './views/ConnectApp'
import { MyBrain } from './views/MyBrain'
import { Timeline } from './views/Timeline'
import { Tasks } from './views/Tasks'
import { Drafts } from './views/Drafts'
import { ActivityFeed } from './views/ActivityFeed'
import { Outbox } from './views/Outbox'
import { SlackSettings } from './views/SlackSettings'
import { LoginView } from './views/LoginView'
import { InviteAccept } from './views/InviteAccept'
import { ForgotPassword } from './views/ForgotPassword'
import { ResetPassword } from './views/ResetPassword'
import { CompanySignup } from './views/CompanySignup'
import { TeamManagement } from './views/TeamManagement'
import { AdminDashboard } from './views/AdminDashboard'
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
  if (!isLoaded) return null
  return <>{children}</>
}

function PrivateLayout() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  useEffect(() => {
    if (user?.company_id) {
      wsClient.connect(user.company_id)
    }
    return () => wsClient.disconnect()
  }, [user?.company_id])

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/brain/ask" element={<BrainQuery />} />
            <Route path="/brain/company" element={<CompanyBrain />} />
            <Route path="/brain/me" element={<MyBrain />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/drafts" element={<Drafts />} />
            <Route path="/activity" element={<ActivityFeed />} />
            <Route path="/connect" element={<ConnectApp />} />
            <Route path="/outbox" element={<RequireAdminOrLead><Outbox /></RequireAdminOrLead>} />
            <Route path="/slack-settings" element={<SlackSettings />} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/teams" element={<RequireAdmin><TeamManagement /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/brain/company" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BootGate>
      <Routes>
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
