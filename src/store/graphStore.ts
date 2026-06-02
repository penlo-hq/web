import { create } from 'zustand'
import type { GraphEdge, GraphNode, NodeType } from '../types/graph'

type ViewMode = 'company' | 'me' | 'team'
export type LayoutMode = 'free' | 'focus' | 'cluster'

type GraphState = {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
  selectedId: string | null
  hoverId: string | null
  viewMode: ViewMode
  activeTeamId: string | null
  hiddenTypes: Set<NodeType>
  searchQuery: string
  timelineAt: string | null
  isLoading: boolean
  isHydrated: boolean
  layoutMode: LayoutMode

  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void
  addNode: (node: GraphNode) => void
  updateNode: (id: string, patch: Partial<GraphNode>) => void
  addEdge: (edge: GraphEdge) => void
  removeEdge: (id: string) => void
  setSelected: (id: string | null) => void
  setHover: (id: string | null) => void
  setViewMode: (mode: ViewMode, teamId?: string) => void
  toggleType: (type: NodeType) => void
  resetTypes: () => void
  setSearch: (q: string) => void
  setTimelineAt: (at: string | null) => void
  setLoading: (v: boolean) => void
  setLayoutMode: (mode: LayoutMode) => void
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: new Map(),
  edges: new Map(),
  selectedId: null,
  hoverId: null,
  viewMode: 'company',
  activeTeamId: null,
  hiddenTypes: new Set(),
  searchQuery: '',
  timelineAt: null,
  isLoading: false,
  isHydrated: false,
  layoutMode: 'free',

  setGraph: (nodes, edges) =>
    set({
      nodes: new Map(nodes.map((n) => [n.id, n])),
      edges: new Map(edges.map((e) => [e.id, e])),
      isHydrated: true,
    }),

  addNode: (node) =>
    set((s) => {
      const next = new Map(s.nodes)
      next.set(node.id, node)
      return { nodes: next }
    }),

  updateNode: (id, patch) =>
    set((s) => {
      const existing = s.nodes.get(id)
      if (!existing) return {}
      const next = new Map(s.nodes)
      next.set(id, { ...existing, ...patch })
      return { nodes: next }
    }),

  addEdge: (edge) =>
    set((s) => {
      const next = new Map(s.edges)
      next.set(edge.id, edge)
      return { edges: next }
    }),

  removeEdge: (id) =>
    set((s) => {
      const next = new Map(s.edges)
      next.delete(id)
      return { edges: next }
    }),

  setSelected: (id) => set({ selectedId: id }),
  setHover: (id) => set({ hoverId: id }),

  setViewMode: (mode, teamId) =>
    set({ viewMode: mode, activeTeamId: teamId ?? null, selectedId: null, layoutMode: 'free' }),
  setLayoutMode: (mode) => set({ layoutMode: mode, selectedId: null }),

  toggleType: (type) =>
    set((s) => {
      const next = new Set(s.hiddenTypes)
      next.has(type) ? next.delete(type) : next.add(type)
      return { hiddenTypes: next }
    }),

  resetTypes: () => set({ hiddenTypes: new Set() }),
  setSearch: (q) => set({ searchQuery: q }),
  setTimelineAt: (at) => set({ timelineAt: at }),
  setLoading: (v) => set({ isLoading: v }),
}))
