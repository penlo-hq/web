import { roleBadgeClass, roleLabel } from './roleConfig'

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${roleBadgeClass(role)}`}
    >
      {roleLabel(role)}
    </span>
  )
}
