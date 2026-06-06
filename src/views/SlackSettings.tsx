import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Plus, RefreshCw, X } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { useAuthStore } from '../store/authStore'
import { useBillingStore } from '../store/billingStore'
import { UpgradePrompt } from '../components/billing/UpgradePrompt'
import { slackApi, type SlackStatusDTO, type SlackWorkspaceDTO } from '../lib/api/endpoints'
import { ConfirmModal, Skeleton } from '../components/ui'
import { SlackSetupGuide } from '../components/slack/SlackSetupGuide'
import { SlackEmptyState } from '../components/slack/SlackEmptyState'
import { SlackWorkspaceCard } from '../components/slack/SlackWorkspaceCard'
import { oauthErrorMessage, slackApiError } from '../components/slack/slackErrors'
import type { PageProps } from '../types/layout'

type Banner =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null

export function SlackSettings({ onMenuClick }: PageProps) {
  const user = useAuthStore((s) => s.user)
  const billing = useBillingStore((s) => s.billing)
  const slackAllowed = billing?.features.slack !== false
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [slackStatus, setSlackStatus] = useState<SlackStatusDTO | null>(null)
  const [workspaces, setWorkspaces] = useState<SlackWorkspaceDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const [disconnectTarget, setDisconnectTarget] = useState<SlackWorkspaceDTO | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  if (user && user.role !== 'admin') {
    return <Navigate to="/brain/company" replace />
  }

  // Consume OAuth callback query params exactly once
  useEffect(() => {
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')
    if (!status) return
    if (status === 'ok') {
      setBanner({ type: 'success', message: 'Slack workspace connected successfully.' })
    } else {
      setBanner({ type: 'error', message: oauthErrorMessage(reason) })
    }
    navigate('/slack-settings', { replace: true })
  // We intentionally only run this on mount (searchParams stable for first render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statusResult, wsResult] = await Promise.all([
        slackApi.getStatus(),
        slackApi.listWorkspaces(),
      ])
      setSlackStatus(statusResult)
      setWorkspaces(wsResult)
    } catch (err) {
      setBanner({ type: 'error', message: slackApiError(err, "Couldn't load Slack settings.") })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Auto-dismiss success banners after 6s
  useEffect(() => {
    if (banner?.type !== 'success') return
    const t = window.setTimeout(() => setBanner(null), 6000)
    return () => window.clearTimeout(t)
  }, [banner])

  async function startConnect() {
    setConnecting(true)
    setBanner(null)
    try {
      const { url } = await slackApi.getAuthorizeUrl()
      window.location.href = url
    } catch (err) {
      setConnecting(false)
      setBanner({ type: 'error', message: slackApiError(err, "Couldn't start Slack authorisation.") })
    }
  }

  async function confirmDisconnect() {
    if (!disconnectTarget) return
    const ws = disconnectTarget
    setDisconnecting(true)
    try {
      await slackApi.disconnect(ws.id)
      setWorkspaces((rows) => rows.filter((r) => r.id !== ws.id))
      if (slackStatus) {
        setSlackStatus({ ...slackStatus, workspaces_connected: slackStatus.workspaces_connected - 1 })
      }
      setBanner({ type: 'success', message: `Disconnected from "${ws.slack_team_name}".` })
    } catch (err) {
      setBanner({ type: 'error', message: slackApiError(err, "Couldn't disconnect workspace.") })
    } finally {
      setDisconnecting(false)
      setDisconnectTarget(null)
    }
  }

  const hasWorkspaces = workspaces.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar onMenuClick={onMenuClick} title="Slack" subtitle="Connect workspace & channels" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${
                banner.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              {banner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <p
                className={`flex-1 text-[13px] leading-relaxed ${
                  banner.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                }`}
              >
                {banner.message}
              </p>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className={`shrink-0 p-0.5 rounded transition-colors ${
                  banner.type === 'success'
                    ? 'text-emerald-600 hover:text-emerald-800'
                    : 'text-red-600 hover:text-red-800'
                }`}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[68px] rounded-2xl" />
              <Skeleton className="h-[100px] rounded-2xl" />
            </div>
          ) : (
            <>
              {!slackAllowed && (
                <UpgradePrompt
                  feature="slack"
                  message="Slack integration is included on the Team plan. Upgrade to connect channels and feed meetings into the Brain."
                />
              )}

              {slackStatus && slackAllowed && (
                <SlackSetupGuide slackStatus={slackStatus} />
              )}

              {!hasWorkspaces ? (
                <SlackEmptyState
                  oauthConfigured={slackAllowed && (slackStatus?.oauth_configured ?? false)}
                  connecting={connecting}
                  onConnect={() => slackAllowed && void startConnect()}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[15px] font-semibold text-text-primary">
                      Connected workspaces
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label="Reload workspaces"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                      </button>
                      {slackStatus?.oauth_configured && (
                        <button
                          type="button"
                          onClick={() => void startConnect()}
                          disabled={connecting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-white text-[12px] font-medium text-text-secondary hover:text-text-primary hover:border-black/[0.14] transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add workspace
                        </button>
                      )}
                    </div>
                  </div>

                  {workspaces.map((ws, i) => (
                    <SlackWorkspaceCard
                      key={ws.id}
                      workspace={ws}
                      defaultExpanded={workspaces.length === 1 || i === 0}
                      onDisconnect={() => setDisconnectTarget(ws)}
                      onError={(msg) => setBanner({ type: 'error', message: msg })}
                    />
                  ))}
                </div>
              )}

              <div className="pt-2 pb-4">
                <div className="rounded-2xl border border-border bg-canvas px-4 py-3.5">
                  <p className="text-[12px] font-semibold text-text-primary mb-1">How ingest works</p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Every message in a <span className="font-medium text-text-primary">subscribed</span> channel feeds the Company Brain in real time.
                    Only channels where the bot is a member can be subscribed — invite the bot first if a channel is greyed out.
                    The <code className="text-[11px] bg-black/[0.04] rounded px-1">/brain</code> slash command works workspace-wide and is separate from channel subscriptions.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={disconnectTarget !== null}
        title={`Disconnect "${disconnectTarget?.slack_team_name}"?`}
        message="All channel subscriptions for this workspace will be removed. Messages will stop feeding the Brain. You can reconnect at any time."
        confirmLabel={disconnecting ? 'Disconnecting…' : 'Disconnect'}
        destructive
        onConfirm={() => void confirmDisconnect()}
        onCancel={() => setDisconnectTarget(null)}
      />
    </motion.div>
  )
}
