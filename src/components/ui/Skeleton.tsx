type Props = { className?: string }

export function Skeleton({ className = '' }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface ${className}`}
      aria-hidden
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-card p-5 hairline-border shadow-card space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-8 w-32 mt-2" />
    </div>
  )
}
