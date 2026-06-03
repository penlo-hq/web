import { MarkdownAnswer } from '../chat/MarkdownAnswer'

type Props = {
  markdown: string
  onCitationClick?: (nodeId: string) => void
}

export function DraftPreview({ markdown, onCitationClick }: Props) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-canvas/50 px-4 py-4 max-h-[min(70vh,640px)] overflow-y-auto">
      <MarkdownAnswer text={markdown} onCitationClick={onCitationClick} />
    </div>
  )
}
