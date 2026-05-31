import { create } from 'zustand'

type OutboxState = {
  pendingCount: number
  setPendingCount: (n: number) => void
  decrement: () => void
}

export const useOutboxStore = create<OutboxState>((set) => ({
  pendingCount: 0,
  setPendingCount: (n) => set({ pendingCount: Math.max(0, n) }),
  decrement: () => set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),
}))
