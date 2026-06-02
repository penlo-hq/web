import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'capsule'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent/90 disabled:opacity-50',
  secondary:
    'bg-surface text-text-primary hairline-border hover:bg-black/[0.03] disabled:opacity-50',
  ghost:
    'text-accent hover:bg-accent-tint disabled:opacity-50',
  destructive:
    'bg-destructive-tint text-destructive border border-destructive/15 hover:bg-destructive/10 disabled:opacity-50',
  capsule:
    'bg-accent text-white hover:bg-accent/90 rounded-full disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-caption-sm font-semibold rounded-lg',
  md: 'px-4 py-2 text-caption font-semibold rounded-xl',
  lg: 'px-5 py-2.5 text-body font-semibold rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref,
) {
  const radius = variant === 'capsule' ? 'rounded-full' : sizeClasses[size].includes('rounded') ? '' : 'rounded-xl'
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors focus-ring ${variantClasses[variant]} ${sizeClasses[size]} ${radius} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
