import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
      <Icon className="w-11 h-11 text-text-secondary/35 mb-4" strokeWidth={1.25} />
      <h3 className="text-body font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-caption text-text-secondary max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
