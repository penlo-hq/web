import { create } from 'zustand'

type OutboxState = {
  pendingCount: number
  lastActedId: string | null
  setPendingCount: (n: number) => void
  decrement: () => void
  removeById: (id: string) => void
}

export const useOutboxStore = create<OutboxState>((set) => ({
  pendingCount: 0,
  lastActedId: null,
  setPendingCount: (n) => set({ pendingCount: Math.max(0, n) }),
  decrement: () => set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),
  removeById: (id) =>
    set((s) => ({
      pendingCount: Math.max(0, s.pendingCount - 1),
      lastActedId: id,
    })),
}))
