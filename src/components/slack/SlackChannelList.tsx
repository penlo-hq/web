import { useMemo, useState } from 'react'
import { AlertTriangle, Hash, Loader2, Lock, RefreshCw, Search } from 'lucide-react'
import type { SlackChannelDTO } from '../../lib/api/endpoints'

type Props = {
  channels: SlackChannelDTO[]
  loading: boolean
  toggling: Set<string>
  onToggle: (channel: SlackChannelDTO, enabled: boolean) => void
  onRefresh: () => void
  onSubscribeAll: () => void
  onUnsubscribeAll: () => void
}

export function SlackChannelList({
  channels,
  loading,
  toggling,
  onToggle,
  onRefresh,
  onSubscribeAll,
  onUnsubscribeAll,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? channels.filter((c) => c.name.toLowerCase().includes(q)) : channels
  }, [channels, search])

  const subscribable = filtered.filter((c) => c.is_member)
  const needsInvite = filtered.filter((c) => !c.is_member)
  const subscribedCount = channels.filter((c) => c.is_subscribed).length
  const subscribableMemberCount = channels.filter((c) => c.is_member).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter channels…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-black/[0.08] text-[12.5px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 bg-white"
            aria-label="Filter channels"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh channels (run after inviting the bot to new channels)"
          className="p-2 rounded-lg border border-black/[0.08] bg-white hover:bg-black/[0.03] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          aria-label="Refresh channels"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {subscribableMemberCount > 1 && (
        <div className="flex items-center gap-3 text-[12px]">
          <button
            type="button"
            onClick={onSubscribeAll}
            className="font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Subscribe all ({subscribableMemberCount})
          </button>
          {subscribedCount > 0 && (
            <>
              <span className="text-text-tertiary">·</span>
              <button
                type="button"
                onClick={onUnsubscribeAll}
                className="font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Unsubscribe all
              </button>
            </>
          )}
        </div>
      )}

      {loading && channels.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-black/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && channels.length === 0 && (
        <div className="flex items-center gap-2 py-4 text-[12.5px] text-text-secondary">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          No channels visible. Invite the Penlo bot to at least one channel first, then refresh.
        </div>
      )}

      {subscribable.length > 0 && (
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-tertiary mb-1.5">
            Available ({subscribable.length})
          </p>
          <ul className="space-y-1">
            {subscribable.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                toggling={toggling.has(c.id)}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </div>
      )}

      {needsInvite.length > 0 && (
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-tertiary mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Bot not in channel ({needsInvite.length})
          </p>
          <ul className="space-y-1">
            {needsInvite.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                toggling={toggling.has(c.id)}
                onToggle={onToggle}
                disabled
              />
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-text-tertiary leading-snug">
            Type <code className="bg-black/[0.04] rounded px-1">/invite @YourApp</code> in the
            channel in Slack, then click Refresh.
          </p>
        </div>
      )}
    </div>
  )
}

function ChannelRow({
  channel,
  toggling,
  onToggle,
  disabled = false,
}: {
  channel: SlackChannelDTO
  toggling: boolean
  onToggle: (c: SlackChannelDTO, enabled: boolean) => void
  disabled?: boolean
}) {
  const canToggle = !disabled && !toggling

  return (
    <li className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors ${
      disabled
        ? 'border-black/[0.05] bg-canvas opacity-60'
        : channel.is_subscribed
          ? 'border-accent/20 bg-accent/[0.03]'
          : 'border-black/[0.08] bg-white hover:border-black/[0.12]'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {channel.is_private ? (
          <Lock className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
        ) : (
          <Hash className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
        )}
        <span className="text-[13px] text-text-primary truncate">{channel.name}</span>
        {channel.is_private && (
          <span className="text-[10px] font-medium text-text-tertiary bg-black/[0.04] rounded px-1.5 py-0.5 shrink-0">
            private
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {toggling && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-tertiary" />}
        <Toggle
          checked={channel.is_subscribed}
          disabled={!canToggle}
          onChange={(v) => onToggle(channel, v)}
          label={`${channel.is_subscribed ? 'Unsubscribe' : 'Subscribe'} #${channel.name}`}
        />
      </div>
    </li>
  )
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors focus-ring disabled:opacity-50 ${
        checked ? 'bg-accent' : 'bg-black/[0.15]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )
}
