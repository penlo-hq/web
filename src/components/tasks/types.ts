export type TaskInboxFilter = 'active' | 'pending' | 'running' | 'completed' | 'failed' | 'all'

export const TASK_FILTERS: { id: TaskInboxFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'To do' },
  { id: 'running', label: 'In progress' },
  { id: 'completed', label: 'Done' },
  { id: 'failed', label: 'Failed' },
  { id: 'all', label: 'All' },
]
