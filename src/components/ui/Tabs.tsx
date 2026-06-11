import type { ReactNode } from 'react'

export type TabItem = { id: string; label: string; badge?: number }

type Props = {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
  'aria-label'?: string
}

export function Tabs({ tabs, active, onChange, className = '', 'aria-label': ariaLabel }: Props) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel ?? 'Tabs'}
      className={`flex gap-1 p-1 rounded-xl bg-surface border border-border ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-h-[36px] px-3 py-1.5 rounded-lg text-caption font-semibold transition-colors focus-ring ${
              isActive
                ? 'bg-canvas text-text-primary shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="ml-1.5 text-caption-sm opacity-70">({tab.badge})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ children, id, activeId }: { children: ReactNode; id: string; activeId: string }) {
  if (id !== activeId) return null
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  )
}
