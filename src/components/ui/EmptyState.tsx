import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center motion-safe-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="font-semibold text-body text-text-primary mb-1.5 tracking-[-0.01em]">{title}</h3>
      {description && (
        <p className="text-caption text-text-secondary max-w-[320px] leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  )
}
