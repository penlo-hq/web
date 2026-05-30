import { create } from 'zustand'
import type { User } from '../types/graph'
import { publicApi } from '../lib/api/client'

type AuthState = {
  user: User | null
  isLoaded: boolean
  bootstrap: () => Promise<void>
  setUser: (user: User) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoaded: false,

  bootstrap: async () => {
    try {
      localStorage.removeItem('penlo-auth')
    } catch {
      // ignore (SSR / disabled storage)
    }
    try {
      const { data } = await publicApi.get('/api/v1/auth/me')
      set({ user: data.user, isLoaded: true })
    } catch {
      set({ user: null, isLoaded: true })
    }
  },

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
