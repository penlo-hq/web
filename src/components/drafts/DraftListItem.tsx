import { FileText } from 'lucide-react'
import type { Draft } from '../../types/graph'
import { draftKindLabel, plainExcerpt, relativeDraftTime } from './draftUtils'

type Props = {
  draft: Draft
  selected: boolean
  onSelect: () => void
}

export function DraftListItem({ draft, selected, onSelect }: Props) {
  const excerpt = plainExcerpt(draft.detail, 120)
  const time = relativeDraftTime(draft.generated_at ?? draft.updated_at)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all focus-ring ${
        selected
          ? 'border-accent/40 bg-accent/[0.06] shadow-sm'
          : 'border-black/[0.06] bg-white hover:border-black/[0.12] hover:shadow-card'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            selected ? 'bg-accent-tint text-accent' : 'bg-black/[0.05] text-text-secondary'
          }`}
        >
          <FileText className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-text-primary leading-snug line-clamp-2">
            {draft.label}
          </p>
          {excerpt && (
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed line-clamp-2">{excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary px-1.5 py-0.5 rounded bg-black/[0.04]">
              {draftKindLabel(draft.kind)}
            </span>
            {draft.role && (
              <span className="text-[11px] text-text-tertiary">{draft.role}</span>
            )}
            {draft.is_private && (
              <span className="text-[10px] text-text-tertiary">Private</span>
            )}
            {time && <span className="text-[11px] text-text-tertiary ml-auto">{time}</span>}
          </div>
        </div>
      </div>
    </button>
  )
}
