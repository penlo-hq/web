import { create } from 'zustand'

export type BuildPhase = 'building' | 'complete' | 'failed'

export type BuildState = {
  phase: BuildPhase
  pr_url?: string | null
  error?: string | null
}

type DispatchState = {
  pendingCount: number
  setPendingCount: (n: number) => void
  decrement: () => void
  increment: () => void
  // Live build status per dispatch id, driven by WS events so cards update
  // without a refetch.
  buildStates: Record<string, BuildState>
  setBuildState: (id: string, state: BuildState) => void
  clearBuildState: (id: string) => void
}

export const useDispatchStore = create<DispatchState>((set) => ({
  pendingCount: 0,
  setPendingCount: (n) => set({ pendingCount: Math.max(0, n) }),
  decrement: () => set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),
  increment: () => set((s) => ({ pendingCount: s.pendingCount + 1 })),
  buildStates: {},
  setBuildState: (id, state) =>
    set((s) => ({ buildStates: { ...s.buildStates, [id]: state } })),
  clearBuildState: (id) =>
    set((s) => {
      const next = { ...s.buildStates }
      delete next[id]
      return { buildStates: next }
    }),
}))
