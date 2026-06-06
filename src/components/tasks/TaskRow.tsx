import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Loader2, Network } from 'lucide-react'
import type { Task, TaskStatus } from '../../types/graph'
import {
  TASK_STATUS_CONFIG,
  nextTaskStatus,
  relativeTaskTime,
  statusActionLabel,
} from './taskStatus'

type Props = {
  task: Task
  actionError?: string | null
  onStatusChange: (id: string, status: TaskStatus) => void
  onViewInBrain: (nodeId: string) => void
}

export function TaskRow({ task, actionError, onStatusChange, onViewInBrain }: Props) {
  const [updating, setUpdating] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const status = task.status
  const cfg = TASK_STATUS_CONFIG[status]
  const Icon = cfg.Icon
  const isDone = status === 'completed'
  const isFailed = status === 'failed'
  const detail = task.detail?.trim()
  const showExpand = Boolean(detail && detail.length > 120)

  async function handleToggle() {
    const next = nextTaskStatus(status)
    setUpdating(true)
    try {
      await Promise.resolve(onStatusChange(task.id, next))
    } finally {
      setUpdating(false)
    }
  }

  const nodeId = task.node_id ?? task.id
  const timeLabel = relativeTaskTime(task.last_seen_at ?? task.updated_at)

  return (
    <div
      className={`flex flex-col gap-2 px-4 py-3.5 bg-white border rounded-2xl transition-all group ${
        isFailed
          ? 'border-destructive/20 hover:border-destructive/30'
          : 'border-border hover:border-black/[0.12] hover:shadow-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={updating}
          className={`mt-0.5 shrink-0 ${cfg.color} hover:opacity-70 transition-opacity focus-ring rounded-full`}
          aria-label={statusActionLabel(status)}
        >
          {updating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Icon
              className={`w-5 h-5 ${status === 'running' ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          )}
        </button>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <p
              className={`text-[14px] font-medium leading-snug flex-1 min-w-0 ${
                isDone ? 'text-text-tertiary line-through' : 'text-text-primary'
              }`}
            >
              {task.label}
            </p>
            <span
              className={`shrink-0 inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${cfg.chipClass}`}
            >
              {cfg.label}
            </span>
          </div>

          {detail && (
            <p
              className={`text-[12px] text-text-secondary leading-relaxed ${
                expanded || !showExpand ? '' : 'line-clamp-2'
              }`}
            >
              {detail}
            </p>
          )}

          {showExpand && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent/80"
            >
              {expanded ? 'Show less' : 'Show more'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {task.meta && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary px-1.5 py-0.5 rounded bg-black/[0.04]">
                {task.meta}
              </span>
            )}
            {task.assigned_to && (
              <span className="text-[11px] text-text-secondary">Assigned: {task.assigned_to}</span>
            )}
            {task.is_stale && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Stale
              </span>
            )}
            {timeLabel && <span className="text-[11px] text-text-tertiary">Updated {timeLabel}</span>}
          </div>

          {actionError && <p className="text-[12px] text-destructive">{actionError}</p>}

          {isFailed && (
            <button
              type="button"
              onClick={() => void onStatusChange(task.id, 'pending')}
              className="text-[12px] font-medium text-accent hover:underline"
            >
              Mark active again
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end pl-8">
        <button
          type="button"
          onClick={() => onViewInBrain(nodeId)}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors focus-ring rounded-md px-1 py-0.5"
        >
          <Network className="w-3.5 h-3.5" />
          View in Company Brain
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      </div>
    </div>
  )
}
