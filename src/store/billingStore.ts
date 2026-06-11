import { create } from 'zustand'
import type { BillingSnapshot } from '../types/billing'

type BillingState = {
  billing: BillingSnapshot | null
  setBilling: (billing: BillingSnapshot | null) => void
}

export const useBillingStore = create<BillingState>()((set) => ({
  billing: null,
  setBilling: (billing) => set({ billing }),
}))
