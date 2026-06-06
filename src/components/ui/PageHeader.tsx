import type { ReactNode } from 'react'
import { MobileMenuButton } from '../layout/Sidebar'

type Props = {
  title: string
  subtitle?: string
  eyebrow?: string
  onMenuClick?: () => void
  actions?: ReactNode
  children?: ReactNode
}

/** Unified page header for all authenticated product views. */
export function PageHeader({ title, subtitle, eyebrow, onMenuClick, actions, children }: Props) {
  return (
    <header className="shrink-0 border-b border-border bg-canvas/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-start justify-between gap-4 px-5 py-4 min-h-[56px]">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase mb-0.5">
                {eyebrow}
              </p>
            )}
            <h1 className="text-headline text-text-primary truncate">{title}</h1>
            {subtitle && (
              <p className="text-caption text-text-secondary mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
