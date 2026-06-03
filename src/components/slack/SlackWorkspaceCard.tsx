import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, PlugZap, RotateCcw, Trash2 } from 'lucide-react'
import { slackApi, type SlackChannelDTO, type SlackWorkspaceDTO } from '../../lib/api/endpoints'
import { SlackChannelList } from './SlackChannelList'
import { slackApiError } from './slackErrors'

type Props = {
  workspace: SlackWorkspaceDTO
  defaultExpanded?: boolean
  onDisconnect: () => void
  onError: (msg: string) => void
}

export function SlackWorkspaceCard({ workspace, defaultExpanded = false, onDisconnect, onError }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [channels, setChannels] = useState<SlackChannelDTO[]>([])
  const [channelsLoaded, setChannelsLoaded] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const loadRef = useRef(false)

  const loadChannels = useCallback(async () => {
    if (loadRef.current) return
    loadRef.current = true
    setLoadingChannels(true)
    try {
      const rows = await slackApi.listChannels(workspace.id)
      setChannels(rows)
      setChannelsLoaded(true)
    } catch (err) {
      onError(slackApiError(err, "Couldn't load channels for this workspace."))
    } finally {
      setLoadingChannels(false)
      loadRef.current = false
    }
  }, [workspace.id, onError])

  const refreshChannels = useCallback(async () => {
    loadRef.current = false
    await loadChannels()
  }, [loadChannels])

  useEffect(() => {
    if (expanded && !channelsLoaded) {
      void loadChannels()
    }
  }, [expanded, channelsLoaded, loadChannels])

  async function toggleChannel(channel: SlackChannelDTO, enabled: boolean) {
    setToggling((s) => new Set(s).add(channel.id))
    const prev = channels
    setChannels((cs) => cs.map((c) => (c.id === channel.id ? { ...c, is_subscribed: enabled } : c)))
    try {
      await slackApi.setSubscription(workspace.id, channel.id, enabled, channel.name)
    } catch (err) {
      setChannels(prev)
      onError(slackApiError(err, `Couldn't ${enabled ? 'subscribe to' : 'unsubscribe from'} #${channel.name}.`))
    } finally {
      setToggling((s) => {
        const next = new Set(s)
        next.delete(channel.id)
        return next
      })
    }
  }

  async function subscribeAll() {
    const targets = channels.filter((c) => c.is_member && !c.is_subscribed)
    for (const ch of targets) await toggleChannel(ch, true)
  }

  async function unsubscribeAll() {
    const targets = channels.filter((c) => c.is_subscribed)
    for (const ch of targets) await toggleChannel(ch, false)
  }

  const subscribedCount = channels.filter((c) => c.is_subscribed).length

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <div className="w-10 h-10 rounded-xl bg-[#4A154B]/10 flex items-center justify-center shrink-0">
          <PlugZap className="w-4.5 h-4.5 text-[#4A154B]" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-semibold text-text-primary">{workspace.slack_team_name}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Connected
            </span>
          </div>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Connected {new Date(workspace.installed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {channelsLoaded && (
              <span className="ml-2">
                · <span className="text-text-secondary font-medium">{subscribedCount}</span>{' '}
                channel{subscribedCount !== 1 ? 's' : ''} feeding Brain
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDisconnect}
            title="Disconnect workspace"
            className="p-2 rounded-lg border border-black/[0.08] text-text-tertiary hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-colors"
            aria-label="Disconnect workspace"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label="Toggle channel list"
            className="p-2 rounded-lg border border-black/[0.08] text-text-tertiary hover:text-text-primary hover:bg-black/[0.03] transition-colors"
          >
            {loadingChannels && !channelsLoaded ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/[0.06] px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-text-primary">Channels feeding the Brain</p>
            <button
              type="button"
              onClick={() => void refreshChannels()}
              disabled={loadingChannels}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
          <SlackChannelList
            channels={channels}
            loading={loadingChannels}
            toggling={toggling}
            onToggle={(c, v) => void toggleChannel(c, v)}
            onRefresh={() => void refreshChannels()}
            onSubscribeAll={() => void subscribeAll()}
            onUnsubscribeAll={() => void unsubscribeAll()}
          />
        </div>
      )}
    </div>
  )
}
