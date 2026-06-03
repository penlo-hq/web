import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNode, NodeType } from '../../types/graph'
import {
  buildSimulation, edgesToSimLinks, nodesToSimNodes,
  type SimLink, type SimNode,
} from '../../lib/graph/simulation'
import { computeDepthScore } from '../../lib/graph/depth'
import { Graph3DCanvas } from './Graph3DCanvas'
import { GraphLegend } from './GraphLegend'
import type { LayoutMode } from '../../store/graphStore'

type Props = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  hiddenTypes: Set<NodeType>
  searchQuery: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  teamColors?: Map<string, string>
  layoutMode?: LayoutMode
  /** When set, nodes outside this set are dimmed (e.g. highlight nodes added in a timeline push). */
  accentNodeIds?: Set<string>
}

export function GraphCanvas({
  nodes,
  edges,
  hiddenTypes,
  searchQuery,
  selectedId,
  onSelect,
  layoutMode = 'free',
  accentNodeIds,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 900, h: 700 })
  const simNodesRef = useRef<SimNode[]>([])
  const simLinksRef = useRef<SimLink[]>([])
  const simRef = useRef<ReturnType<typeof buildSimulation> | null>(null)
  const [tickCount, setTickCount] = useState(0)
  const [hoverId, setHoverId] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      setSize({ w: Math.max(640, Math.floor(rect.width)), h: Math.max(520, Math.floor(rect.height)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visibleNodes = useMemo(
    () => nodes.filter((n) => n.type === 'company' || n.type === 'team' || !hiddenTypes.has(n.type)),
    [nodes, hiddenTypes],
  )

  const searchMatched = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return new Set(visibleNodes.filter((n) => n.label.toLowerCase().includes(q) || n.detail?.toLowerCase().includes(q)).map((n) => n.id))
  }, [visibleNodes, searchQuery])

  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIds.has(e.source_id) && visibleIds.has(e.target_id)),
    [edges, visibleIds],
  )

  useEffect(() => {
    const prevById = new Map(simNodesRef.current.map((n) => [n.id, n]))
    const sorted = [...visibleNodes].sort((a, b) => computeDepthScore(a) - computeDepthScore(b))
    const simNodes = nodesToSimNodes(sorted, prevById, size.w, size.h)
    const nodeById = new Map(simNodes.map((n) => [n.id, n]))
    const simLinks = edgesToSimLinks(visibleEdges, nodeById)

    simNodesRef.current = simNodes
    simLinksRef.current = simLinks

    simRef.current?.stop()
    const sim = buildSimulation(simNodes, simLinks, size.w, size.h, () => setTickCount((t) => t + 1), {
      clusterMode: layoutMode === 'cluster',
    })
    simRef.current = sim

    return () => { sim.stop() }
  }, [visibleNodes, visibleEdges, size, layoutMode])

  const focusId = layoutMode === 'focus' ? selectedId : null
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const l of simLinksRef.current) {
      const s = (l.source as SimNode).id
      const t = (l.target as SimNode).id
      if (!map.has(s)) map.set(s, new Set())
      if (!map.has(t)) map.set(t, new Set())
      map.get(s)!.add(t)
      map.get(t)!.add(s)
    }
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickCount])

  const focusedIds = useMemo<Set<string> | null>(() => {
    if (!focusId) return null
    const set = new Set<string>([focusId])
    const oneHop = adjacency.get(focusId)
    if (oneHop) {
      for (const id of oneHop) set.add(id)
      if (layoutMode === 'focus') {
        for (const id of oneHop) {
          const second = adjacency.get(id)
          if (second) for (const sid of second) set.add(sid)
        }
      }
    }
    return set
  }, [focusId, adjacency, layoutMode])

  const selectionContextIds = useMemo<Set<string> | null>(() => {
    if (!selectedId) return null
    const set = new Set<string>([selectedId])
    const oneHop = adjacency.get(selectedId)
    if (oneHop) for (const id of oneHop) set.add(id)
    return set
  }, [selectedId, adjacency])

  const renderFocusedIds = useMemo<Set<string> | null>(() => {
    if (accentNodeIds && accentNodeIds.size > 0) {
      const bright = new Set(accentNodeIds)
      if (selectedId) {
        bright.add(selectedId)
        const oneHop = adjacency.get(selectedId)
        if (oneHop) for (const id of oneHop) bright.add(id)
      }
      return bright
    }
    if (searchMatched) {
      const set = new Set(searchMatched)
      if (selectionContextIds) for (const id of selectionContextIds) set.add(id)
      return set
    }
    if (selectionContextIds) return selectionContextIds
    return focusedIds
  }, [accentNodeIds, searchMatched, selectionContextIds, focusedIds, selectedId, adjacency])

  const prevSelectedRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevSelectedRef.current === selectedId) return
    prevSelectedRef.current = selectedId
    if (!selectedId || typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const sim = simRef.current
    if (sim) sim.alpha(0.28).restart()
  }, [selectedId])

  const handleHover = useCallback((id: string | null) => setHoverId(id), [])

  const isEmpty = visibleNodes.length === 0

  const selectedLabel = useMemo(() => {
    if (!selectedId) return null
    return visibleNodes.find((n) => n.id === selectedId)?.label ?? null
  }, [selectedId, visibleNodes])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderedNodes = useMemo(() => [...simNodesRef.current], [tickCount])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderedLinks = useMemo(() => [...simLinksRef.current], [tickCount])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white">
      {isEmpty && <EmptyGraphOverlay />}
      <Graph3DCanvas
        nodes={renderedNodes}
        links={renderedLinks}
        focusedIds={renderFocusedIds}
        hoverId={hoverId}
        selectedId={selectedId}
        width={size.w}
        height={size.h}
        onHover={handleHover}
        onSelect={onSelect}
        layoutMode={layoutMode}
      />
      <div className="absolute bottom-4 left-4 z-10">
        <GraphLegend
          nodeCount={visibleNodes.length}
          edgeCount={visibleEdges.length}
          selectedLabel={selectedLabel}
        />
      </div>
    </div>
  )
}

function EmptyGraphOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
      <svg width={120} height={120} viewBox="0 0 120 120" className="opacity-20 animate-pulse-slow">
        <circle cx={60} cy={60} r={8} fill="#ffffff" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = 60 + Math.cos(rad) * 38
          const y = 60 + Math.sin(rad) * 38
          return (
            <g key={i}>
              <line x1={60} y1={60} x2={x} y2={y} stroke="#ffffff" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x} cy={y} r={5} fill="none" stroke="#ffffff" strokeWidth={1} />
            </g>
          )
        })}
      </svg>
      <p className="mt-6 text-[13px] tracking-wide" style={{ color: '#888' }}>Brain is listening…</p>
      <p className="mt-1 text-[11px]" style={{ color: '#555' }}>Connect your Penlo pen or paste a standup transcript</p>
    </div>
  )
}
