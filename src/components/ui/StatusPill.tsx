type Variant = 'pending' | 'running' | 'completed' | 'failed' | 'default'

const STYLES: Record<Variant, string> = {
  pending: 'bg-surface text-text-secondary border-text-secondary/10',
  running: 'bg-accent text-white border-accent',
  completed: 'bg-surface text-text-secondary border-text-secondary/10',
  failed: 'bg-red-50 text-red-700 border-red-200',
  default: 'bg-surface text-text-secondary border-text-secondary/10',
}

type Props = { label: string; variant?: Variant }

export function StatusPill({ label, variant = 'default' }: Props) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.16em] border ${STYLES[variant]}`}>
      {label}
    </span>
  )
}
