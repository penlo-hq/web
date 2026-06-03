import { Loader2, Mail, Trash2 } from 'lucide-react'
import type { PendingInvitationDTO } from '../../lib/api/endpoints'
import { RoleBadge } from './RoleBadge'

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

type Props = {
  invite: PendingInvitationDTO
  revoking: boolean
  onRevoke: () => void
}

export function InvitationRow({ invite, revoking, onRevoke }: Props) {
  const daysLeft = daysUntil(invite.expires_at)

  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl border border-black/[0.08] bg-white">
      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
        <Mail className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-text-primary truncate">{invite.email}</p>
        <p className="text-[12px] text-text-tertiary mt-0.5">
          Sent {new Date(invite.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
        </p>
      </div>
      <RoleBadge role={invite.role} />
      <button
        type="button"
        disabled={revoking}
        onClick={onRevoke}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-text-secondary hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50 focus-ring shrink-0"
        aria-label={`Revoke invite for ${invite.email}`}
      >
        {revoking ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{revoking ? 'Revoking…' : 'Revoke'}</span>
      </button>
    </li>
  )
}
