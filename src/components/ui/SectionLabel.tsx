type Props = { children: string; className?: string }

export function SectionLabel({ children, className = '' }: Props) {
  return (
    <div
      className={`text-caption-sm font-semibold uppercase tracking-section text-text-secondary ${className}`}
    >
      {children}
    </div>
  )
}
