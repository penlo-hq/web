export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const days = Math.floor(hr / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function expiresLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const totalMin = Math.floor(ms / 60_000)
  const days = Math.floor(totalMin / (60 * 24))
  const hr = Math.floor((totalMin - days * 60 * 24) / 60)
  if (days > 0) return `Expires in ${days}d ${hr}h`
  if (hr > 0) return `Expires in ${hr}h`
  return `Expires in ${totalMin}m`
}

export function isExpired(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now()
}

export function formatLastRefreshed(at: Date | null): string {
  if (!at) return ''
  const sec = Math.floor((Date.now() - at.getTime()) / 1000)
  if (sec < 10) return 'Updated just now'
  if (sec < 60) return `Updated ${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `Updated ${min}m ago`
  return `Updated at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}
