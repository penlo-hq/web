import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  pulse?: boolean
  variant?: 'accent' | 'neutral' | 'success' | 'destructive'
  className?: string
}

const variantClasses = {
  accent: 'bg-accent-tint text-accent',
  neutral: 'bg-black/[0.06] text-text-secondary',
  success: 'bg-green-50 text-green-700',
  destructive: 'bg-destructive-tint text-destructive',
}

export function Badge({ children, pulse = false, variant = 'accent', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 min-w-[18px] h-[18px] px-1.5 rounded-full text-caption-sm font-semibold ${variantClasses[variant]} ${className}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden />
      )}
      {children}
    </span>
  )
}
