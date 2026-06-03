import { useCallback, useEffect, useRef, useState } from 'react'

export type TypewriterOptions = {
  /** When false, shows full text immediately (e.g. restored history). */
  enabled?: boolean
  /** Target characters per second (feels like ChatGPT at ~80–140). */
  charsPerSecond?: number
  onComplete?: () => void
}

export type TypewriterState = {
  displayedText: string
  isComplete: boolean
  isTyping: boolean
  skip: () => void
}

/**
 * Reveals `fullText` quickly character-by-character for easier reading.
 * Uses rAF batching for smooth animation without blocking the main thread.
 */
export function useTypewriter(fullText: string, options: TypewriterOptions = {}): TypewriterState {
  const { enabled = true, charsPerSecond = 120, onComplete } = options
  const [displayedText, setDisplayedText] = useState(enabled ? '' : fullText)
  const [isComplete, setIsComplete] = useState(!enabled)
  const [skipped, setSkipped] = useState(false)
  const indexRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const skip = useCallback(() => {
    setSkipped(true)
    setDisplayedText(fullText)
    setIsComplete(true)
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    onCompleteRef.current?.()
  }, [fullText])

  useEffect(() => {
    if (!enabled || skipped) {
      setDisplayedText(fullText)
      setIsComplete(true)
      return
    }

    indexRef.current = 0
    lastTimeRef.current = null
    setDisplayedText('')
    setIsComplete(false)

    const tick = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time
      const delta = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time
      const advance = Math.max(1, Math.floor(delta * charsPerSecond))
      indexRef.current = Math.min(fullText.length, indexRef.current + advance)
      setDisplayedText(fullText.slice(0, indexRef.current))

      if (indexRef.current >= fullText.length) {
        setIsComplete(true)
        rafRef.current = null
        onCompleteRef.current?.()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [fullText, enabled, skipped, charsPerSecond])

  return {
    displayedText: skipped || !enabled ? fullText : displayedText,
    isComplete: skipped || !enabled || isComplete,
    isTyping: enabled && !skipped && !isComplete,
    skip,
  }
}
