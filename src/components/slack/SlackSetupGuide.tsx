import { useState } from 'react'
import { Check, ChevronDown, Copy, ExternalLink, Hash, Terminal, Zap } from 'lucide-react'
import type { SlackStatusDTO } from '../../lib/api/endpoints'

type Props = { slackStatus: SlackStatusDTO }

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function doCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 min-w-0 text-[11.5px] text-text-primary bg-canvas border border-border rounded-lg px-3 py-2 break-all font-mono">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void doCopy()}
          className="inline-flex items-center gap-1 px-3 rounded-lg border border-border bg-white hover:bg-black/[0.03] text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors shrink-0"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

const STEPS = [
  {
    icon: ExternalLink,
    title: 'Create a Slack app',
    body: (
      <>
        Go to{' '}
        <a
          href="https://api.slack.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2"
        >
          api.slack.com/apps
        </a>{' '}
        and create a new app from scratch. Under <strong>OAuth & Permissions</strong>, grant the scopes:{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">commands</code>{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">chat:write</code>{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">channels:read</code>{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">channels:history</code>{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">groups:read</code>{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">groups:history</code>{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">users:read</code>.
      </>
    ),
  },
  {
    icon: Zap,
    title: 'Enable Events API',
    body: (
      <>
        Under <strong>Event Subscriptions</strong>, turn on events and paste the URL above into <em>Request URL</em>. Subscribe to{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">message.channels</code> and{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">message.groups</code> (bot events).
      </>
    ),
  },
  {
    icon: Terminal,
    title: 'Add the Slash Command',
    body: (
      <>
        Under <strong>Slash Commands</strong>, create{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">/brain</code> and set the
        Request URL to the slash command URL above. Install the app to your workspace.
      </>
    ),
  },
  {
    icon: Hash,
    title: 'Invite the bot and subscribe',
    body: (
      <>
        In each Slack channel you want to ingest, type{' '}
        <code className="text-[10px] bg-black/[0.04] rounded px-1 py-0.5">/invite @YourApp</code>.
        Then toggle the channels on below. Any message in subscribed channels feeds your Company Brain.
      </>
    ),
  },
]

export function SlackSetupGuide({ slackStatus }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#4A154B]/10 flex items-center justify-center shrink-0">
            <SlackIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-text-primary">Setup guide</p>
            <p className="text-[12px] text-text-tertiary">Connect your Slack app step by step</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-text-tertiary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-5 space-y-5">
          {slackStatus.oauth_configured ? (
            <div className="space-y-3">
              <CopyField label="Events API Request URL" value={slackStatus.events_webhook_url} />
              <CopyField label="Slash command Request URL" value={slackStatus.slash_command_url} />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[12.5px] text-amber-900">
              Slack OAuth credentials (<code>SLACK_CLIENT_ID</code> / <code>SLACK_CLIENT_SECRET</code>) are not set on
              this server. Ask your deployment admin to configure them before proceeding.
            </div>
          )}

          <ol className="space-y-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-7 h-7 rounded-full border-2 border-accent/20 bg-accent/10 flex items-center justify-center text-[11px] font-bold text-accent">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 min-h-[16px] bg-black/[0.06]" />}
                </div>
                <div className="pb-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-text-tertiary shrink-0" strokeWidth={1.75} />
                    <p className="text-[13px] font-semibold text-text-primary">{title}</p>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-xl bg-canvas border border-border px-3.5 py-3">
            <p className="text-[11.5px] font-semibold text-text-primary mb-1">Testing</p>
            <p className="text-[12px] text-text-secondary">
              Once channels are subscribed, type <code className="text-[11px] bg-black/[0.04] rounded px-1 py-0.5">/brain who owns the API redesign?</code> in any
              Slack channel to query your company brain.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 54" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386H34.048a5.381 5.381 0 0 0-5.376 5.386 5.381 5.381 0 0 0 5.376 5.387" fill="#ECB22E"/>
      <path d="M0 34.248a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387v-5.386H5.376A5.381 5.381 0 0 0 0 34.248m14.336 0v14.365A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.248a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386" fill="#E01E5A"/>
    </svg>
  )
}
