import { useEffect } from 'react'
import { useTypewriter } from '../../hooks/useTypewriter'
import { MarkdownAnswer } from './MarkdownAnswer'

type Props = {
  text: string
  citationIds?: Set<string>
  onCitationClick?: (nodeId: string) => void
  enabled?: boolean
  onComplete?: () => void
  onProgress?: () => void
}

export function TypingMarkdownAnswer({
  text,
  citationIds,
  onCitationClick,
  enabled = true,
  onComplete,
  onProgress,
}: Props) {
  const { displayedText, isComplete, isTyping, skip } = useTypewriter(text, {
    enabled,
    charsPerSecond: 130,
    onComplete,
  })

  useEffect(() => {
    if (isTyping) onProgress?.()
  }, [displayedText, isTyping, onProgress])

  return (
    <div
      className="relative cursor-default"
      onClick={() => {
        if (isTyping) skip()
      }}
      onKeyDown={(e) => {
        if (isTyping && (e.key === 'Escape' || e.key === ' ')) {
          e.preventDefault()
          skip()
        }
      }}
      role={isTyping ? 'button' : undefined}
      tabIndex={isTyping ? 0 : undefined}
      aria-label={isTyping ? 'Skip typing animation' : undefined}
    >
      <MarkdownAnswer
        text={displayedText}
        citationIds={isComplete ? citationIds : undefined}
        onCitationClick={isComplete ? onCitationClick : undefined}
      />
      {isTyping && <TypingCursor />}
    </div>
  )
}

export function TypingPlainText({
  text,
  className = '',
  enabled = true,
  onComplete,
}: {
  text: string
  className?: string
  enabled?: boolean
  onComplete?: () => void
}) {
  const { displayedText, isTyping, skip } = useTypewriter(text, {
    enabled,
    charsPerSecond: 130,
    onComplete,
  })

  return (
    <p
      className={`${className} ${isTyping ? 'cursor-pointer' : ''}`}
      onClick={() => isTyping && skip()}
    >
      {displayedText}
      {isTyping && <TypingCursor inline />}
    </p>
  )
}

function TypingCursor({ inline }: { inline?: boolean }) {
  return (
    <span
      className={
        inline
          ? 'inline-block w-[2px] h-[1em] align-text-bottom ml-0.5 bg-accent rounded-sm animate-typewriter-cursor'
          : 'inline-block w-[2px] h-[1.1em] align-middle ml-0.5 -mb-0.5 bg-accent rounded-sm animate-typewriter-cursor'
      }
      aria-hidden
    />
  )
}
