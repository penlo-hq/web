import { create } from 'zustand'
import type { NotificationDTO, NotificationPreferenceDTO, ToastItem } from '../types/notification'
import { notificationsApi } from '../lib/api/endpoints'

type NotificationState = {
  items: NotificationDTO[]
  unreadCount: number
  panelOpen: boolean
  toasts: ToastItem[]
  preferences: NotificationPreferenceDTO[]
  loaded: boolean
  wsConnected: boolean
  setWsConnected: (v: boolean) => void
  setPanelOpen: (v: boolean) => void
  togglePanel: () => void
  setItems: (items: NotificationDTO[]) => void
  prepend: (n: NotificationDTO) => void
  markReadLocal: (id: string) => void
  markAllReadLocal: () => void
  setUnreadCount: (n: number) => void
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void
  dismissToast: (id: string) => void
  setPreferences: (prefs: NotificationPreferenceDTO[]) => void
  bootstrap: () => Promise<void>
  fetchMore: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

let toastCounter = 0

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  panelOpen: false,
  toasts: [],
  preferences: [],
  loaded: false,
  wsConnected: false,

  setWsConnected: (v) => set({ wsConnected: v }),
  setPanelOpen: (v) => set({ panelOpen: v }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  setItems: (items) => set({ items }),

  prepend: (n) =>
    set((s) => {
      if (s.items.some((i) => i.id === n.id)) return s
      const unread = n.read_at ? s.unreadCount : s.unreadCount + 1
      return { items: [n, ...s.items], unreadCount: unread }
    }),

  markReadLocal: (id) =>
    set((s) => {
      const item = s.items.find((i) => i.id === id)
      const wasUnread = item && !item.read_at
      return {
        items: s.items.map((i) =>
          i.id === id ? { ...i, read_at: i.read_at ?? new Date().toISOString() } : i,
        ),
        unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      }
    }),

  markAllReadLocal: () =>
    set((s) => ({
      items: s.items.map((i) => ({
        ...i,
        read_at: i.read_at ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),

  addToast: (toast) => {
    const id = `toast-${++toastCounter}`
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id, createdAt: Date.now() }].slice(-5),
    }))
    if (!toast.sticky) {
      setTimeout(() => get().dismissToast(id), 5000)
    }
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setPreferences: (preferences) => set({ preferences }),

  bootstrap: async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationsApi.count(),
        notificationsApi.list({ limit: 50 }),
      ])
      set({
        unreadCount: countRes.count,
        items: listRes,
        loaded: true,
      })
    } catch (exc) {
      console.error('notification bootstrap failed', exc)
      set({ loaded: true })
    }
  },

  fetchMore: async () => {
    const { items } = get()
    const last = items[items.length - 1]
    if (!last) return
    try {
      const older = await notificationsApi.list({ limit: 50, before: last.created_at })
      if (older.length === 0) return
      set((s) => {
        const existing = new Set(s.items.map((i) => i.id))
        return { items: [...s.items, ...older.filter((n) => !existing.has(n.id))] }
      })
    } catch (exc) {
      console.error('fetchMore notifications failed', exc)
    }
  },

  markRead: async (id) => {
    get().markReadLocal(id)
    try {
      await notificationsApi.markRead(id)
    } catch (exc) {
      console.error('markRead failed', exc)
    }
  },

  markAllRead: async () => {
    get().markAllReadLocal()
    try {
      await notificationsApi.markAllRead()
    } catch (exc) {
      console.error('markAllRead failed', exc)
    }
  },
}))
