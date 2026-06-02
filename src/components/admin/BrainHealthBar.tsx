type Props = {
  label: string
  value: number | null
}

export function BrainHealthBar({ label, value }: Props) {
  const pct = value === null ? 0 : Math.round(value * 100)
  const text = value === null ? '--%' : `${pct}%`
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-text-secondary">{label}</span>
        <span className="text-[11.5px] text-text-primary font-medium">{text}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value === null ? 0 : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 rounded-full bg-black/[0.06] overflow-hidden"
      >
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
