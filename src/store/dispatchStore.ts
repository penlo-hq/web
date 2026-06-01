import { create } from 'zustand'

type DispatchState = {
  pendingCount: number
  setPendingCount: (n: number) => void
  decrement: () => void
  increment: () => void
}

export const useDispatchStore = create<DispatchState>((set) => ({
  pendingCount: 0,
  setPendingCount: (n) => set({ pendingCount: Math.max(0, n) }),
  decrement: () => set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),
  increment: () => set((s) => ({ pendingCount: s.pendingCount + 1 })),
}))
