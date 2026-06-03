import { create } from 'zustand'

export type ActivityEvent = {
  id: string
  source: string
  summary: string
  node_ids: string[]
  node_count: number
  processed_at: string
  user_id: string | null
  user_name: string | null
}

type ActivityState = {
  events: ActivityEvent[]
  hasMore: boolean
  nextCursor: string | null
  unreadCount: number
  setInitial: (events: ActivityEvent[], hasMore: boolean, cursor: string | null) => void
  prependLive: (event: ActivityEvent) => void
  appendOlder: (events: ActivityEvent[], hasMore: boolean, cursor: string | null) => void
  reset: () => void
  incrementUnread: () => void
  clearUnread: () => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  events: [],
  hasMore: false,
  nextCursor: null,
  unreadCount: 0,

  setInitial: (events, hasMore, cursor) => set({ events, hasMore, nextCursor: cursor }),

  prependLive: (event) =>
    set((s) => {
      if (s.events.some((e) => e.id === event.id)) return s
      return { events: [event, ...s.events] }
    }),

  appendOlder: (events, hasMore, cursor) =>
    set((s) => {
      const existing = new Set(s.events.map((e) => e.id))
      const merged = [...s.events, ...events.filter((e) => !existing.has(e.id))]
      return { events: merged, hasMore, nextCursor: cursor }
    }),

  reset: () => set({ events: [], hasMore: false, nextCursor: null, unreadCount: 0 }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}))
