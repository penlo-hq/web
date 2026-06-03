import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

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
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-black/[0.04] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-[15px] text-text-primary mb-1.5 tracking-[-0.01em]">{title}</h3>
      {description && (
        <p className="text-[13px] text-text-secondary max-w-[280px] leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  )
}
