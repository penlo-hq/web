import { useState } from 'react'
import { Copy, ExternalLink, Network, Trash2 } from 'lucide-react'
import type { Draft } from '../../types/graph'
import { DraftPreview } from './DraftPreview'
import { draftKindLabel, relativeDraftTime } from './draftUtils'
import { ConfirmModal } from '../ui/ConfirmModal'

type Props = {
  draft: Draft | null
  onViewInBrain: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onCitationClick?: (nodeId: string) => void
}

export function DraftDetailPanel({ draft, onViewInBrain, onDelete, onCitationClick }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-6 rounded-2xl border border-dashed border-black/[0.10] bg-white/50">
        <p className="text-[14px] font-medium text-text-primary">Select a draft</p>
        <p className="text-[13px] text-text-secondary mt-1 max-w-xs leading-relaxed">
          Choose a draft from the list to read the full brief with formatted text.
        </p>
      </div>
    )
  }

  const d = draft

  async function handleCopy() {
    if (!d.detail) return
    try {
      await navigator.clipboard.writeText(d.detail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  async function confirmRemove() {
    setDeleting(true)
    try {
      await onDelete(d.id)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const generated = relativeDraftTime(draft.generated_at ?? draft.created_at)

  return (
    <>
      <div className="flex flex-col h-full min-h-0 rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
        <div className="px-4 py-3.5 border-b border-black/[0.06] space-y-2 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-text-primary leading-snug">{draft.label}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent bg-accent-tint px-2 py-0.5 rounded">
                  {draftKindLabel(draft.kind)}
                </span>
                {draft.role && (
                  <span className="text-[12px] text-text-secondary">{draft.role}</span>
                )}
                {generated && (
                  <span className="text-[12px] text-text-tertiary">Generated {generated}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onViewInBrain(draft.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-accent bg-accent-tint hover:bg-accent/15 transition-colors focus-ring"
            >
              <Network className="w-3.5 h-3.5" />
              View in Company Brain
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
            {draft.detail && (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-text-primary hover:bg-black/[0.04] transition-colors focus-ring"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied' : 'Copy markdown'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-destructive hover:bg-destructive-tint transition-colors focus-ring ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {draft.detail ? (
            <DraftPreview markdown={draft.detail} onCitationClick={onCitationClick} />
          ) : (
            <p className="text-[13px] text-text-secondary">This draft has no body content yet.</p>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete draft?"
        message={`Remove "${draft.label}" from the brain? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={() => void confirmRemove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
