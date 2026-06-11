import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import { SettingsSection } from '../components/ui'
import { notificationsApi } from '../lib/api/endpoints'
import { useNotificationStore } from '../store/notificationStore'
import type { PageProps } from '../types/layout'

const CATEGORIES = [
  { id: 'action_required', label: 'Action required', desc: 'Dispatches, broadcasts, drift alerts' },
  { id: 'progress', label: 'Build progress', desc: 'Dispatch building, complete, failed' },
  { id: 'awareness', label: 'Brain activity', desc: 'Significant ingestion events' },
  { id: 'system', label: 'Account & security', desc: 'Role changes, invites, integrations' },
] as const

const CHANNELS = [
  { id: 'in_app', label: 'In-app' },
  { id: 'push', label: 'Push' },
  { id: 'email', label: 'Email' },
] as const

function prefEnabled(
  prefs: { category: string; channel: string; enabled: boolean }[],
  category: string,
  channel: string,
): boolean {
  const row = prefs.find((p) => p.category === category && p.channel === channel)
  if (row) return row.enabled
  if (channel === 'email' && category !== 'system') return false
  if (channel === 'push' && category === 'awareness') return false
  return true
}

export function NotificationSettings({ onMenuClick }: PageProps) {
  const [prefs, setPrefs] = useState<ReturnType<typeof useNotificationStore.getState>['preferences']>([])
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('08:00')
  const [pushStatus, setPushStatus] = useState<string>('unsupported')
  const [saving, setSaving] = useState(false)
  const setPreferences = useNotificationStore((s) => s.setPreferences)
  const addToast = useNotificationStore((s) => s.addToast)

  const load = useCallback(async () => {
    const rows = await notificationsApi.getPreferences()
    setPrefs(rows)
    setPreferences(rows)
    const q = rows.find((p) => p.quiet_hours_start)
    if (q?.quiet_hours_start) setQuietStart(q.quiet_hours_start)
    if (q?.quiet_hours_end) setQuietEnd(q.quiet_hours_end)
  }, [setPreferences])

  useEffect(() => {
    void load().catch(console.error)
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushStatus(Notification.permission)
    }
  }, [load])

  async function toggle(category: string, channel: string) {
    const enabled = !prefEnabled(prefs, category, channel)
    setSaving(true)
    try {
      const updated = await notificationsApi.patchPreference({ category, channel, enabled })
      setPrefs((prev) => {
        const idx = prev.findIndex((p) => p.category === category && p.channel === channel)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...updated }
          return next
        }
        return [...prev, updated]
      })
    } finally {
      setSaving(false)
    }
  }

  async function saveQuietHours() {
    setSaving(true)
    try {
      await notificationsApi.patchPreference({
        category: 'action_required',
        channel: 'push',
        enabled: prefEnabled(prefs, 'action_required', 'push'),
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    } finally {
      setSaving(false)
    }
  }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      return
    }
    const perm = await Notification.requestPermission()
    setPushStatus(perm)
    if (perm !== 'granted') return

    const reg = await navigator.serviceWorker.register('/sw.js')
    const { public_key: vapidKey } = await notificationsApi.vapidPublicKey()
    if (!vapidKey) {
      addToast({
        title: 'Push not configured',
        body: 'Server VAPID keys are not set',
        severity: 'important',
        sticky: false,
      })
      return
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })
    await notificationsApi.registerDevice('web', JSON.stringify(sub.toJSON()))
    addToast({
      title: 'Push enabled',
      body: 'You will receive browser notifications for critical alerts',
      severity: 'info',
      sticky: false,
    })
  }

  async function sendTest() {
    addToast({
      title: 'Test notification',
      body: 'If you see this, in-app toasts are working',
      severity: 'important',
      sticky: false,
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar title="Notifications" subtitle="Delivery preferences" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto px-5 py-5 max-w-2xl space-y-5">
        {CATEGORIES.map((cat) => (
          <SettingsSection key={cat.id} title={cat.label} description={cat.desc}>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((ch) => (
                <label key={ch.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefEnabled(prefs, cat.id, ch.id)}
                    disabled={saving}
                    onChange={() => void toggle(cat.id, ch.id)}
                    className="rounded border-text-secondary/30 text-accent focus:ring-accent"
                  />
                  {ch.label}
                </label>
              ))}
            </div>
          </SettingsSection>
        ))}

        <SettingsSection title="Quiet hours" description="Push and email suppressed during these hours (inbox still updates)">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="input-field w-auto"
            />
            <span className="text-[13px] text-text-secondary">to</span>
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="input-field w-auto"
            />
            <button
              onClick={() => void saveQuietHours()}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-[12px] font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Browser push" description="Get alerts when Penlo is in the background">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => void enablePush()}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-[12px] font-medium hover:bg-accent/90 transition-colors"
            >
              Enable push notifications
            </button>
            <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
              pushStatus === 'granted' ? 'bg-success-tint text-success' : 'bg-black/[0.05] text-text-secondary'
            }`}>
              {pushStatus === 'granted' ? 'Enabled' : pushStatus === 'denied' ? 'Blocked' : pushStatus}
            </span>
          </div>
        </SettingsSection>

        <button
          onClick={() => void sendTest()}
          className="px-4 py-2 rounded-xl border border-border text-[13px] text-text-secondary hover:text-text-primary hover:bg-black/[0.02] transition-colors"
        >
          Send test notification
        </button>
      </div>
    </motion.div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}
