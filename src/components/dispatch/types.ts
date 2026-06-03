export type DispatchInboxFilter = 'inbox' | 'active' | 'done' | 'all'

export const DISPATCH_FILTERS: { id: DispatchInboxFilter; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
]
