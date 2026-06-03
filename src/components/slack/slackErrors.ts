export type OAuthReason =
  | 'user_cancelled'
  | 'state_expired'
  | 'oauth_failed'
  | 'already_claimed'
  | 'missing_params'
  | string

export function oauthErrorMessage(reason: OAuthReason | null | undefined): string {
  switch (reason) {
    case 'user_cancelled':
      return "You cancelled the Slack authorisation. Click \"Add to Slack\" when you're ready to connect."
    case 'state_expired':
      return 'The connection attempt expired (took longer than 10 minutes). Please try again.'
    case 'already_claimed':
      return 'That Slack workspace is already connected to another Penlo company. Contact support if this is wrong.'
    case 'missing_params':
    case 'oauth_failed':
      return 'Slack returned an error during authorisation. Please try again, or check your Slack app credentials.'
    default:
      if (reason) return `Slack connection failed: ${reason}. Please try again.`
      return 'Slack connection failed. Please try again.'
  }
}

export function slackApiError(err: unknown, fallback = "Something went wrong — please try again."): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
  if (detail === 'Slack OAuth not configured')
    return 'Slack OAuth is not configured on this server. Contact your administrator.'
  if (typeof detail === 'string' && detail) return detail
  return fallback
}
