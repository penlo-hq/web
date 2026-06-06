import { useCallback, useMemo, useRef } from 'react'
import type { GraphSnapshotMarker } from '../../lib/api/endpoints'
import type { TimelinePushDTO } from '../../lib/api/endpoints'

type Marker = { at: string; kind: 'push' | 'snapshot' }

type Props = {
  pushes: TimelinePushDTO[]
  snapshots: GraphSnapshotMarker[]
  isLive: boolean
  position: number
  onSeek: (position: number, live: boolean) => void
}

function buildMarkers(pushes: TimelinePushDTO[], snapshots: GraphSnapshotMarker[]): Marker[] {
  const seen = new Set<string>()
  const out: Marker[] = []
  for (const p of pushes) {
    const key = p.processed_at
    if (!seen.has(key)) {
      seen.add(key)
      out.push({ at: key, kind: 'push' })
    }
  }
  for (const s of snapshots) {
    const key = s.snapshot_at
    if (!seen.has(key)) {
      seen.add(key)
      out.push({ at: key, kind: 'snapshot' })
    }
  }
  out.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  return out
}

export function TimelineScrubber({ pushes, snapshots, isLive, position, onSeek }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const markers = useMemo(() => buildMarkers(pushes, snapshots), [pushes, snapshots])

  const range = useMemo(() => {
    if (markers.length === 0) {
      const now = Date.now()
      return { min: now - 7 * 86_400_000, max: now }
    }
    const times = markers.map((m) => new Date(m.at).getTime())
    const min = Math.min(...times)
    const max = Math.max(...times, Date.now())
    return { min, max: max === min ? min + 86_400_000 : max }
  }, [markers])

  const displayLabel = useMemo(() => {
    if (isLive) return 'Live'
    const t = range.min + position * (range.max - range.min)
    return new Date(t).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [isLive, position, range])

  const seekTo = useCallback(
    (pct: number) => {
      const clamped = Math.max(0, Math.min(1, pct))
      if (clamped >= 0.98) {
        onSeek(1, true)
        return
      }
      onSeek(clamped, false)
    },
    [onSeek],
  )

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    seekTo((e.clientX - rect.left) / rect.width)
  }

  const markerPositions = markers.map((m) => {
    const t = new Date(m.at).getTime()
    const pct = (t - range.min) / (range.max - range.min)
    return { ...m, pct: Math.max(0, Math.min(1, pct)) }
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-border">
      <span className="text-[9.5px] uppercase tracking-[0.2em] text-text-tertiary w-16 shrink-0">
        Timeline
      </span>

      <div
        ref={trackRef}
        className="flex-1 relative h-2 bg-black/[0.06] rounded-full cursor-pointer"
        onClick={handleTrackClick}
      >
        <div
          className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all"
          style={{ width: `${position * 100}%` }}
        />
        {markerPositions.map((m, i) => (
          <div
            key={`${m.at}-${i}`}
            className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
              m.kind === 'push' ? 'bg-accent' : 'bg-text-tertiary'
            }`}
            style={{ left: `${m.pct * 100}%`, transform: 'translate(-50%, -50%)' }}
            title={new Date(m.at).toLocaleString()}
          />
        ))}
        <div
          className="absolute top-1/2 w-3 h-3 bg-accent rounded-full border-2 border-white shadow-sm"
          style={{ left: `${position * 100}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <span
        className={`text-[10.5px] tracking-wide shrink-0 min-w-[100px] text-right ${
          isLive ? 'text-accent font-semibold' : 'text-text-secondary'
        }`}
      >
        {displayLabel}
      </span>

      {!isLive && (
        <button
          type="button"
          onClick={() => onSeek(1, true)}
          className="text-[10px] uppercase tracking-wide text-text-tertiary hover:text-text-primary shrink-0"
        >
          Live
        </button>
      )}
    </div>
  )
}
