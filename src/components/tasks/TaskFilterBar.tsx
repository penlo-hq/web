import { TASK_FILTERS, type TaskInboxFilter } from './types'

type Props = {
  filter: TaskInboxFilter
  onChange: (f: TaskInboxFilter) => void
  counts: Record<TaskInboxFilter, number>
}

export function TaskFilterBar({ filter, onChange, counts }: Props) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-black/[0.04] overflow-x-auto"
      role="tablist"
      aria-label="Task filters"
    >
      {TASK_FILTERS.map(({ id, label }) => {
        const active = filter === id
        const count = counts[id]
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`shrink-0 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors focus-ring ${
              active
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {label}
              {count > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold inline-flex items-center justify-center ${
                    active ? 'bg-accent-tint text-accent' : 'bg-black/[0.08] text-text-secondary'
                  }`}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
