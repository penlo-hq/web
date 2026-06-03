import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  shadow?: boolean
  frosted?: boolean
  padding?: 'none' | 'md' | 'lg'
  children: ReactNode
}

const paddingClasses = {
  none: '',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({
  shadow = false,
  frosted = false,
  padding = 'lg',
  className = '',
  children,
  ...props
}: Props) {
  const base = frosted
    ? 'frosted-pill rounded-card'
    : 'bg-surface rounded-card hairline-border'
  const shadowClass = shadow ? 'shadow-card' : ''
  return (
    <div className={`${base} ${paddingClasses[padding]} ${shadowClass} ${className}`} {...props}>
      {children}
    </div>
  )
}
