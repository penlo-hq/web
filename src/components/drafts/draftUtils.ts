import type { Draft } from '../../types/graph'

export function draftKindLabel(kind: string | null): string {
  if (!kind) return 'Draft'
  if (kind === 'onboarding_brief') return 'Onboarding brief'
  return kind.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function plainExcerpt(markdown: string | null, maxLen = 160): string {
  if (!markdown) return ''
  const text = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-•*]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen).trim()}…`
}

export function relativeDraftTime(iso: string | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

export function formatRefreshed(at: Date | null): string {
  if (!at) return ''
  const sec = Math.floor((Date.now() - at.getTime()) / 1000)
  if (sec < 10) return 'Updated just now'
  if (sec < 60) return `Updated ${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `Updated ${min}m ago`
  return `Updated at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

export function matchesDraftSearch(draft: Draft, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    draft.label.toLowerCase().includes(q) ||
    (draft.detail?.toLowerCase().includes(q) ?? false) ||
    (draft.role?.toLowerCase().includes(q) ?? false) ||
    (draft.kind?.toLowerCase().includes(q) ?? false)
  )
}
