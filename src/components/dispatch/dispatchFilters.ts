import type { DispatchCardDTO } from '../../lib/api/endpoints'
import type { DispatchInboxFilter } from './types'

export function filterDispatchCards(cards: DispatchCardDTO[], filter: DispatchInboxFilter): DispatchCardDTO[] {
  switch (filter) {
    case 'inbox':
      return cards.filter((c) => c.status === 'pending')
    case 'active':
      return cards.filter((c) => c.status === 'approved' || c.status === 'building')
    case 'done':
      return cards.filter((c) => c.status === 'completed' || c.status === 'failed')
    case 'all':
    default:
      return cards
  }
}

export function countPending(cards: DispatchCardDTO[]): number {
  return cards.filter((c) => c.status === 'pending').length
}
