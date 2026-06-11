import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { GraphCanvas } from '../components/graph/GraphCanvas'
import { TimelineScrubber } from '../components/graph/TimelineScrubber'
import { NodeDetailPanel } from '../components/graph/NodeDetailPanel'
import { TopBar } from '../components/layout/TopBar'
import { TimelineDiffBanner } from '../components/timeline/TimelineDiffBanner'
import { TimelinePushFeed } from '../components/timeline/TimelinePushFeed'
import { graphApi, timelineApi, type TimelinePushDTO } from '../lib/api/endpoints'
import type { GraphSnapshotMarker } from '../lib/api/endpoints'
import { useGraphStore } from '../store/graphStore'
import { useActivityStore } from '../store/activityStore'
import type { PageProps } from '../types/layout'

export function Timeline({ onMenuClick }: PageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightEvent = searchParams.get('event')

  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes)
  const selectedId = useGraphStore((s) => s.selectedId)
  const setSelected = useGraphStore((s) => s.setSelected)
  const setGraph = useGraphStore((s) => s.setGraph)
  const setTimelineAt = useGraphStore((s) => s.setTimelineAt)
  const clearActivityUnread = useActivityStore((s) => s.clearUnread)

  const [pushes, setPushes] = useState<TimelinePushDTO[]>([])
  const [snapshots, setSnapshots] = useState<GraphSnapshotMarker[]>([])
  const [selectedPushId, setSelectedPushId] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [scrubPosition, setScrubPosition] = useState(1)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [graphLoading, setGraphLoading] = useState(false)
  const [activeSnapshotAt, setActiveSnapshotAt] = useState<string | null>(null)

  const feedRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const selectedPush = useMemo(
    () => pushes.find((p) => p.id === selectedPushId) ?? null,
    [pushes, selectedPushId],
  )

  const accentNodeIds = useMemo(() => {
    if (isLive || !selectedPush) return undefined
    return new Set(selectedPush.nodes.map((n) => n.id))
  }, [isLive, selectedPush])

  const loadGraphLive = useCallback(async () => {
    setGraphLoading(true)
    try {
      const data = await graphApi.company()
      setGraph(data.nodes, data.edges)
      setTimelineAt(null)
      setActiveSnapshotAt(null)
    } finally {
      setGraphLoading(false)
    }
  }, [setGraph, setTimelineAt])

  const loadGraphAt = useCallback(
    async (iso: string, snapshotHint: string | null) => {
      setGraphLoading(true)
      try {
        const data = await graphApi.snapshot(iso)
        setGraph(data.nodes, data.edges)
        const at = data.snapshot_at ?? snapshotHint ?? iso
        setTimelineAt(at)
        setActiveSnapshotAt(data.snapshot_at)
      } catch {
        await loadGraphLive()
      } finally {
        setGraphLoading(false)
      }
    },
    [setGraph, setTimelineAt, loadGraphLive],
  )

  const selectPush = useCallback(
    (push: TimelinePushDTO, updateUrl = true) => {
      setSelectedPushId(push.id)
      setIsLive(false)
      setScrubPosition(timeToPosition(push.processed_at))
      void loadGraphAt(push.processed_at, push.snapshot_at)
      if (updateUrl) {
        setSearchParams({ event: push.id }, { replace: true })
      }
      requestAnimationFrame(() => {
        cardRefs.current.get(push.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    },
    [loadGraphAt, setSearchParams, pushes, snapshots],
  )

  function timeToPosition(iso: string): number {
    const markers = [...pushes.map((p) => p.processed_at), ...snapshots.map((s) => s.snapshot_at)]
    if (markers.length === 0) return 0.5
    const times = markers.map((m) => new Date(m).getTime())
    const min = Math.min(...times)
    const max = Math.max(...times, Date.now())
    const t = new Date(iso).getTime()
    if (max === min) return 0.5
    return (t - min) / (max - min)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      timelineApi.pushes({ limit: 50 }),
      graphApi.snapshots(),
      graphApi.company(),
    ])
      .then(([pushData, snapData, graphData]) => {
        if (cancelled) return
        setPushes(pushData.pushes)
        setHasMore(pushData.has_more)
        setNextCursor(pushData.next_cursor)
        setSnapshots(snapData.snapshots)
        setGraph(graphData.nodes, graphData.edges)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [setGraph])

  useEffect(() => {
    if (!highlightEvent || pushes.length === 0) return
    const match = pushes.find((p) => p.id === highlightEvent)
    if (match) selectPush(match, false)
  }, [highlightEvent, pushes, selectPush])

  // Viewing the timeline clears the sidebar "new activity" badge.
  useEffect(() => {
    clearActivityUnread()
  }, [clearActivityUnread])

  const handleSeek = useCallback(
    (position: number, live: boolean) => {
      setScrubPosition(position)
      if (live) {
        setIsLive(true)
        setSelectedPushId(null)
        setSearchParams({}, { replace: true })
        void loadGraphLive()
        return
      }
      setIsLive(false)
      const markers = [
        ...pushes.map((p) => ({ at: p.processed_at, push: p })),
        ...snapshots.map((s) => ({ at: s.snapshot_at, push: null as TimelinePushDTO | null })),
      ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
      if (markers.length === 0) return
      const times = markers.map((m) => new Date(m.at).getTime())
      const min = Math.min(...times)
      const max = Math.max(...times, Date.now())
      const target = min + position * (max - min)
      let best = markers[0]
      let bestDist = Math.abs(new Date(best.at).getTime() - target)
      for (const m of markers) {
        const d = Math.abs(new Date(m.at).getTime() - target)
        if (d < bestDist) {
          best = m
          bestDist = d
        }
      }
      if (best.push) {
        selectPush(best.push)
      } else {
        setSelectedPushId(null)
        setSearchParams({}, { replace: true })
        void loadGraphAt(best.at, best.at)
      }
    },
    [pushes, snapshots, loadGraphLive, loadGraphAt, setSearchParams, selectPush],
  )

  async function loadOlder() {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const data = await timelineApi.pushes({ before: nextCursor, limit: 50 })
      setPushes((prev) => [...prev, ...data.pushes])
      setHasMore(data.has_more)
      setNextCursor(data.next_cursor)
    } finally {
      setLoadingMore(false)
    }
  }

  const topBarSubtitle = isLive
    ? 'Replay how the brain grew'
    : selectedPush
      ? `${selectedPush.user_name || 'System'} · ${new Date(selectedPush.processed_at).toLocaleString()}`
      : activeSnapshotAt
        ? `Graph as of ${new Date(activeSnapshotAt).toLocaleString()}`
        : 'Historical view'

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar
        onMenuClick={onMenuClick}
        title="Timeline"
        subtitle={topBarSubtitle}
        useTimelineEyebrow
      />

      <div className="flex-1 flex min-h-0">
        <div ref={feedRef} className="w-full max-w-[380px] shrink-0 hidden md:flex flex-col min-h-0">
          <TimelinePushFeed
            pushes={pushes}
            selectedId={selectedPushId}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={selectPush}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadOlder={loadOlder}
            loading={loading}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <TimelineDiffBanner push={selectedPush} snapshotAt={activeSnapshotAt} isLive={isLive} />

          <div className="flex-1 relative mx-3 mt-2 rounded-2xl border border-border overflow-hidden bg-white min-h-0">
            {graphLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <span className="text-[13px] text-text-secondary">Loading graph…</span>
              </div>
            )}
            <div key={isLive ? 'live' : selectedPushId ?? activeSnapshotAt ?? 'hist'} className="h-full animate-fade-in">
              <GraphCanvas
                nodes={Array.from(nodes.values())}
                edges={Array.from(edges.values())}
                hiddenTypes={hiddenTypes}
                searchQuery=""
                selectedId={selectedId}
                onSelect={setSelected}
                accentNodeIds={accentNodeIds}
              />
            </div>
            <NodeDetailPanel selectedId={selectedId} onClose={() => setSelected(null)} />
          </div>

          <div className="mx-3 mb-3 rounded-b-2xl border-x border-b border-border overflow-hidden">
            <TimelineScrubber
              pushes={pushes}
              snapshots={snapshots}
              isLive={isLive}
              position={scrubPosition}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </div>

      {/* Mobile: push list below graph */}
      <div className="md:hidden border-t border-border max-h-[40vh] flex flex-col">
        <TimelinePushFeed
          pushes={pushes}
          selectedId={selectedPushId}
          filter={filter}
          onFilterChange={setFilter}
          onSelect={selectPush}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadOlder={loadOlder}
          loading={loading}
        />
      </div>
    </motion.div>
  )
}
