import type { Task } from '../../types/graph'
import type { TaskInboxFilter } from './types'

export function filterTasks(tasks: Task[], filter: TaskInboxFilter): Task[] {
  switch (filter) {
    case 'active':
      return tasks.filter((t) => t.status === 'pending' || t.status === 'running')
    case 'pending':
      return tasks.filter((t) => t.status === 'pending')
    case 'running':
      return tasks.filter((t) => t.status === 'running')
    case 'completed':
      return tasks.filter((t) => t.status === 'completed')
    case 'failed':
      return tasks.filter((t) => t.status === 'failed')
    case 'all':
    default:
      return tasks
  }
}

export function countByFilter(tasks: Task[]): Record<TaskInboxFilter, number> {
  return {
    active: tasks.filter((t) => t.status === 'pending' || t.status === 'running').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    all: tasks.length,
  }
}
