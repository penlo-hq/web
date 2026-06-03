import { AlertTriangle, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { Task, TaskStatus } from '../../types/graph'

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; chipClass: string; Icon: typeof Circle }
> = {
  pending: {
    label: 'To do',
    color: 'text-text-tertiary',
    chipClass: 'bg-black/[0.06] text-text-secondary',
    Icon: Circle,
  },
  running: {
    label: 'In progress',
    color: 'text-accent',
    chipClass: 'bg-accent-tint text-accent',
    Icon: Loader2,
  },
  completed: {
    label: 'Done',
    color: 'text-success',
    chipClass: 'bg-green-50 text-green-700',
    Icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'text-destructive',
    chipClass: 'bg-destructive-tint text-destructive',
    Icon: AlertTriangle,
  },
}

/** Next status when user clicks the status control. */
export function nextTaskStatus(current: TaskStatus): TaskStatus {
  switch (current) {
    case 'pending':
      return 'running'
    case 'running':
      return 'completed'
    case 'completed':
      return 'pending'
    case 'failed':
      return 'pending'
    default:
      return 'pending'
  }
}

export function statusActionLabel(current: TaskStatus): string {
  const next = nextTaskStatus(current)
  return `Mark as ${TASK_STATUS_CONFIG[next].label.toLowerCase()}`
}

export function relativeTaskTime(iso: string | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

export function formatLastRefreshed(at: Date | null): string {
  if (!at) return ''
  const sec = Math.floor((Date.now() - at.getTime()) / 1000)
  if (sec < 10) return 'Updated just now'
  if (sec < 60) return `Updated ${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `Updated ${min}m ago`
  return `Updated at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

export function matchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    task.label.toLowerCase().includes(q) ||
    (task.detail?.toLowerCase().includes(q) ?? false) ||
    (task.assigned_to?.toLowerCase().includes(q) ?? false) ||
    (task.meta?.toLowerCase().includes(q) ?? false)
  )
}
