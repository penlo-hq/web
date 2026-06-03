import { Activity, Database, TrendingUp, Users, Zap } from 'lucide-react'

type IconKey = 'database' | 'activity' | 'users' | 'team' | 'zap' | 'trending' | 'slack'

const ICONS: Record<IconKey, typeof Database> = {
  database: Database,
  activity: Activity,
  users: Users,
  team: Users,
  zap: Zap,
  trending: TrendingUp,
  slack: Activity,
}

type Props = {
  label: string
  value: string | number
  sublabel?: string
  icon?: IconKey
}

export function StatCard({ label, value, sublabel, icon }: Props) {
  const Icon = icon ? ICONS[icon] : null
  return (
    <dl className="px-4 py-4 rounded-2xl bg-white border border-black/[0.06] relative overflow-hidden hover:shadow-card-hover transition-shadow">
      {Icon && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-accent-tint flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
        </div>
      )}
      <dt className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-tertiary mb-1">{label}</dt>
      <dd className="font-semibold text-[26px] text-text-primary leading-none tracking-[-0.02em]">{value}</dd>
      {sublabel && <dd className="mt-1 text-[11px] text-text-tertiary">{sublabel}</dd>}
    </dl>
  )
}
