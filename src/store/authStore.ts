import { create } from 'zustand'
import type { User } from '../types/graph'
import type { BillingSnapshot } from '../types/billing'
import { publicApi } from '../lib/api/client'
import { useBillingStore } from './billingStore'

type AuthState = {
  user: User | null
  isLoaded: boolean
  bootstrap: () => Promise<void>
  setUser: (user: User, billing?: BillingSnapshot | null) => void
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
      useBillingStore.getState().setBilling(data.billing ?? null)
      set({ user: data.user, isLoaded: true })
      return
    } catch {
      // Access token cookie is likely expired. Before giving up (and bouncing the
      // user to /login), attempt a one-shot refresh using the rotating refresh
      // cookie — publicApi has no interceptor so we must do this explicitly here.
    }
    try {
      const { data } = await publicApi.post('/api/v1/auth/refresh')
      if (data?.user) {
        useBillingStore.getState().setBilling(data.billing ?? null)
        set({ user: data.user, isLoaded: true })
        return
      }
      // Refresh only rotated cookies — re-fetch the session.
      const me = await publicApi.get('/api/v1/auth/me')
      useBillingStore.getState().setBilling(me.data.billing ?? null)
      set({ user: me.data.user, isLoaded: true })
    } catch {
      useBillingStore.getState().setBilling(null)
      set({ user: null, isLoaded: true })
    }
  },

  setUser: (user, billing) => {
    if (billing !== undefined) {
      useBillingStore.getState().setBilling(billing)
    }
    set({ user })
  },
  clearUser: () => {
    useBillingStore.getState().setBilling(null)
    set({ user: null })
  },
}))
