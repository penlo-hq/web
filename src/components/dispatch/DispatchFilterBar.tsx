import { DISPATCH_FILTERS, type DispatchInboxFilter } from './types'

type Props = {
  filter: DispatchInboxFilter
  onChange: (f: DispatchInboxFilter) => void
  counts: { inbox: number; active: number; done: number }
}

export function DispatchFilterBar({ filter, onChange, counts }: Props) {
  const badgeFor = (id: DispatchInboxFilter): number | null => {
    if (id === 'inbox' && counts.inbox > 0) return counts.inbox
    if (id === 'active' && counts.active > 0) return counts.active
    if (id === 'done' && counts.done > 0) return counts.done
    return null
  }

  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-black/[0.04] w-full max-w-3xl"
      role="tablist"
      aria-label="Dispatch filters"
    >
      {DISPATCH_FILTERS.map(({ id, label }) => {
        const active = filter === id
        const badge = badgeFor(id)
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex-1 min-w-0 px-2 py-2 rounded-lg text-[13px] font-medium transition-colors focus-ring ${
              active
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              {label}
              {badge != null && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold inline-flex items-center justify-center ${
                    active ? 'bg-accent-tint text-accent' : 'bg-black/[0.08] text-text-secondary'
                  }`}
                >
                  {badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
