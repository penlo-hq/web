type Props = {
  label: string
  value: string | number
  sublabel?: string
}

export function StatCard({ label, value, sublabel }: Props) {
  return (
    <dl className="px-5 py-4 rounded-card bg-surface hairline-border shadow-card">
      <dt className="text-caption-sm uppercase tracking-section text-text-secondary">{label}</dt>
      <dd className="mt-1 font-display font-semibold text-[24px] text-text-primary leading-none">{value}</dd>
      {sublabel && <dd className="mt-1 text-caption-sm text-text-secondary">{sublabel}</dd>}
    </dl>
  )
}
