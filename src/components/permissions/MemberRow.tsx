import { Link } from 'react-router-dom'
import type { AdminUserDTO, MemberRole } from '../../lib/api/endpoints'
import { MemberAvatar } from './MemberAvatar'
import { RoleBadge } from './RoleBadge'
import { RoleSelect } from './RoleSelect'

type Props = {
  member: AdminUserDTO
  teamName: string | null
  isSelf: boolean
  canEditRole: boolean
  canManageTeams: boolean
  saving: boolean
  onRoleChange: (role: MemberRole) => void
}

export function MemberRow({
  member,
  teamName,
  isSelf,
  canEditRole,
  canManageTeams,
  saving,
  onRoleChange,
}: Props) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl border border-black/[0.08] bg-white hover:border-black/[0.12] transition-colors">
      <MemberAvatar name={member.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-medium text-text-primary truncate">{member.name}</p>
          {isSelf && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              You
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-tertiary truncate">{member.email}</p>
        {teamName && (
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Team:{' '}
            {canManageTeams ? (
              <Link to="/admin/teams" className="text-text-secondary hover:text-accent transition-colors">
                {teamName}
              </Link>
            ) : (
              <span className="text-text-secondary">{teamName}</span>
            )}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {canEditRole && !isSelf ? (
          <RoleSelect value={member.role as MemberRole} saving={saving} onChange={onRoleChange} />
        ) : (
          <RoleBadge role={member.role} />
        )}
      </div>
    </li>
  )
}
