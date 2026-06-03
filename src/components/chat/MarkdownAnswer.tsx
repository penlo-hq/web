import type { ReactNode } from 'react'

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; n: number; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'source'; text: string }

function parseBlocks(input: string): Block[] {
  const lines = input.split('\n')
  const blocks: Block[] = []
  let paragraph = ''

  const flush = () => {
    const t = paragraph.trim()
    if (t) blocks.push({ kind: 'paragraph', text: t })
    paragraph = ''
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    if (/^#{1,3}\s+/.test(trimmed)) {
      flush()
      blocks.push({ kind: 'heading', text: trimmed.replace(/^#{1,3}\s+/, '') })
    } else if (/^[-•*]\s+/.test(trimmed)) {
      flush()
      blocks.push({ kind: 'bullet', text: trimmed.replace(/^[-•*]\s+/, '') })
    } else if (/^\d+[.)]\s+/.test(trimmed)) {
      flush()
      const m = trimmed.match(/^(\d+)[.)]\s+(.*)$/)
      blocks.push({ kind: 'numbered', n: m ? parseInt(m[1], 10) : 1, text: m?.[2] ?? trimmed })
    } else if (/^📎|^Based on:|^Source:/i.test(trimmed)) {
      flush()
      blocks.push({ kind: 'source', text: trimmed })
    } else {
      paragraph = paragraph ? `${paragraph} ${trimmed}` : trimmed
    }
  }
  flush()
  return blocks
}

function inlineFormat(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-text-primary">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="px-1 py-0.5 rounded bg-black/[0.06] text-[12px] font-mono"
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + token.length
    i += 1
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : [text]
}

type Props = {
  text: string
  citationIds?: Set<string>
  onCitationClick?: (nodeId: string) => void
}

const UUID_RE =
  /\[([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g

export function MarkdownAnswer({ text, citationIds, onCitationClick }: Props) {
  const blocks = parseBlocks(text)

  function renderWithCitations(line: string, keyPrefix: string): ReactNode[] {
    const out: ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    let i = 0
    while ((m = UUID_RE.exec(line)) !== null) {
      if (m.index > last) {
        out.push(...inlineFormat(line.slice(last, m.index), `${keyPrefix}-t-${i}`))
      }
      const id = m[1]
      if (citationIds?.has(id) && onCitationClick) {
        out.push(
          <button
            key={`${keyPrefix}-cite-${i}`}
            type="button"
            onClick={() => onCitationClick(id)}
            className="inline-flex mx-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium text-accent bg-accent-tint hover:bg-accent/15 transition-colors focus-ring"
          >
            source
          </button>,
        )
      } else {
        out.push(
          <span key={`${keyPrefix}-cite-${i}`} className="text-caption-sm text-text-tertiary">
            [{id.slice(0, 8)}…]
          </span>,
        )
      }
      last = m.index + m[0].length
      i += 1
    }
    if (last < line.length) out.push(...inlineFormat(line.slice(last), `${keyPrefix}-end`))
    return out.length ? out : inlineFormat(line, keyPrefix)
  }

  return (
    <div className="space-y-2.5 text-[14px] leading-relaxed text-text-primary">
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'heading':
            return (
              <p key={idx} className="font-semibold text-[15px] mt-1">
                {block.text}
              </p>
            )
          case 'bullet':
            return (
              <div key={idx} className="flex gap-2 pl-1">
                <span className="text-accent mt-0.5">•</span>
                <span>{renderWithCitations(block.text, `b-${idx}`)}</span>
              </div>
            )
          case 'numbered':
            return (
              <div key={idx} className="flex gap-2 pl-1">
                <span className="text-text-tertiary font-medium tabular-nums">{block.n}.</span>
                <span>{renderWithCitations(block.text, `n-${idx}`)}</span>
              </div>
            )
          case 'source':
            return (
              <p
                key={idx}
                className="text-[13px] text-text-secondary pt-2 border-t border-black/[0.06] flex items-start gap-1.5"
              >
                <span aria-hidden>📎</span>
                <span>{renderWithCitations(block.text.replace(/^📎\s*/, ''), `s-${idx}`)}</span>
              </p>
            )
          default:
            return <p key={idx}>{renderWithCitations(block.text, `p-${idx}`)}</p>
        }
      })}
    </div>
  )
}
