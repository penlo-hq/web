type Props = { size?: 'sm' | 'md' | 'lg'; className?: string }

const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }

export function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizeMap[size]} border-2 border-accent/20 border-t-accent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
