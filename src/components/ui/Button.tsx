import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'capsule'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:opacity-50',
  secondary: 'bg-surface text-text-primary hairline-border hover:bg-black/[0.03] dark:hover:bg-white/[0.04] disabled:opacity-50',
  ghost: 'text-accent hover:bg-accent-tint disabled:opacity-50',
  destructive: 'bg-destructive-tint text-destructive border border-destructive/15 hover:bg-destructive/10 disabled:opacity-50',
  capsule: 'bg-accent text-white hover:bg-accent-hover rounded-full disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-[32px] px-3 py-1.5 text-caption-sm font-semibold rounded-lg gap-1.5',
  md: 'min-h-[40px] px-4 py-2 text-caption font-semibold rounded-xl gap-2',
  lg: 'min-h-[44px] px-5 py-2.5 text-body font-semibold rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    className = '',
    children,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  const radius = variant === 'capsule' ? 'rounded-full' : ''

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-colors focus-ring ${variantClasses[variant]} ${sizeClasses[size]} ${radius} ${className}`}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />}
      {!loading && icon && iconPosition === 'left' && <span className="shrink-0" aria-hidden>{icon}</span>}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0" aria-hidden>{icon}</span>}
    </button>
  )
})
