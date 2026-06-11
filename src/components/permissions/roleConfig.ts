import type { MemberRole } from '../../lib/api/endpoints'

export type RoleMeta = {
  value: MemberRole
  label: string
  short: string
  description: string
  capabilities: string[]
}

export const ROLE_META: RoleMeta[] = [
  {
    value: 'admin',
    label: 'Admin',
    short: 'Admin',
    description: 'Full company access — integrations, teams, roles, and invites.',
    capabilities: [
      'Manage all teams and members',
      'Change roles and send invites',
      'Dispatch, Outbox, and admin settings',
      'See all company knowledge',
    ],
  },
  {
    value: 'team_lead',
    label: 'Team lead',
    short: 'Lead',
    description: 'Leads a team — can run Dispatch and Outbox, with team-scoped private context.',
    capabilities: [
      'Approve dispatch and broadcast drafts',
      'Invite and manage members on your team',
      'View Team Brain and team-private nodes',
    ],
  },
  {
    value: 'employee',
    label: 'Employee',
    short: 'Member',
    description: 'Day-to-day access to Brain, Tasks, and shared company knowledge.',
    capabilities: [
      'Ask Brain and use Timeline',
      'Manage personal tasks',
      'No admin or dispatch controls',
    ],
  },
]

export const ROLE_BY_VALUE = Object.fromEntries(ROLE_META.map((r) => [r.value, r])) as Record<MemberRole, RoleMeta>

export function roleLabel(role: string): string {
  return ROLE_BY_VALUE[role as MemberRole]?.label ?? role.replace(/_/g, ' ')
}

export function roleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-accent/10 text-accent border-accent/20'
    case 'team_lead':
      return 'bg-violet-500/10 text-violet-700 border-violet-500/20'
    default:
      return 'bg-black/[0.04] text-text-secondary border-border'
  }
}
