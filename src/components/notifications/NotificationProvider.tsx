import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { NotificationCenter } from './NotificationCenter'
import { ToastHost } from './ToastHost'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const bootstrap = useNotificationStore((s) => s.bootstrap)
  const panelOpen = useNotificationStore((s) => s.panelOpen)
  const setPanelOpen = useNotificationStore((s) => s.setPanelOpen)
  const loaded = useNotificationStore((s) => s.loaded)

  useEffect(() => {
    if (!user) return
    void bootstrap()
  }, [user?.id, bootstrap])

  if (!user) return <>{children}</>

  return (
    <>
      {children}
      {loaded && (
        <>
          <ToastHost />
          <NotificationCenter open={panelOpen} onClose={() => setPanelOpen(false)} />
        </>
      )}
    </>
  )
}
