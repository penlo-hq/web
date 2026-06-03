import { Loader2 } from 'lucide-react'

type Props = {
  oauthConfigured: boolean
  connecting: boolean
  onConnect: () => void
}

export function SlackEmptyState({ oauthConfigured, connecting, onConnect }: Props) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white px-6 py-10 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-[#4A154B]/10 flex items-center justify-center mb-5">
        <SlackLogoFull className="w-9 h-9" />
      </div>
      <h3 className="text-[16px] font-semibold text-text-primary mb-2">Connect Slack</h3>
      <p className="text-[13.5px] text-text-secondary max-w-[380px] mx-auto leading-relaxed mb-1">
        Feed your Company Brain from Slack threads. Once connected, messages in subscribed channels
        are automatically captured and made queryable.
      </p>
      <p className="text-[12.5px] text-text-tertiary max-w-[360px] mx-auto mb-8">
        Your team can also use <code className="text-[11.5px] bg-black/[0.04] rounded px-1.5 py-0.5">/brain&nbsp;&lt;question&gt;</code> in any channel
        to query the brain directly from Slack.
      </p>

      {!oauthConfigured ? (
        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-[12.5px] text-amber-900 text-left max-w-sm mx-auto">
          <span className="shrink-0 text-amber-600">⚠</span>
          <span>
            Slack OAuth is not configured on this server. Ask your administrator to set{' '}
            <code className="text-[11px] bg-amber-100 rounded px-1">SLACK_CLIENT_ID</code> and{' '}
            <code className="text-[11px] bg-amber-100 rounded px-1">SLACK_CLIENT_SECRET</code>.
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-[14px] text-white transition-opacity disabled:opacity-60 hover:opacity-90"
          style={{ backgroundColor: '#4A154B' }}
        >
          {connecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <SlackLogoFull className="w-5 h-5 invert" />
          )}
          {connecting ? 'Opening Slack…' : 'Add to Slack'}
        </button>
      )}
    </div>
  )
}

function SlackLogoFull({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 54" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386H34.048a5.381 5.381 0 0 0-5.376 5.386 5.381 5.381 0 0 0 5.376 5.387" fill="#ECB22E"/>
      <path d="M0 34.248a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387v-5.386H5.376A5.381 5.381 0 0 0 0 34.248m14.336 0v14.365A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.248a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386" fill="#E01E5A"/>
    </svg>
  )
}
