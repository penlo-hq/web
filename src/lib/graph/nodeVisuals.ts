import type { GraphNode, NodeType } from '../../types/graph'

/** Base collision / layout radius per type (simulation space). */
export const BASE_NODE_RADIUS: Record<NodeType, number> = {
  company: 36,
  team: 28,
  person: 16,
  client: 14,
  topic: 13,
  task: 11,
  event: 11,
  draft: 10,
  agent: 13,
  feature: 12,
  decision: 10,
  architecture: 11,
  alert: 14,
}

/** Visual sphere radius in Three.js units (scaled down from sim). */
export const RENDER_RADIUS_SCALE = 0.62

export type NodeVisualState = {
  isSelected?: boolean
  isHovered?: boolean
  isDimmed?: boolean
}

function clampImportance(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0.5
  return Math.min(1, Math.max(0, v))
}

function importanceScale(importance: number): number {
  return 0.72 + 0.63 * clampImportance(importance)
}

function stateMultiplier(state: NodeVisualState): number {
  if (state.isSelected) return 1.55
  if (state.isHovered) return 1.12
  if (state.isDimmed) return 0.88
  return 1
}

/** d3-force collide radius */
export function collideRadius(node: Pick<GraphNode, 'type' | 'importance'>): number {
  return BASE_NODE_RADIUS[node.type] * importanceScale(node.importance)
}

/** Radius used for Three.js sphere geometry (before mesh scale lerp). */
export function renderRadius(
  node: Pick<GraphNode, 'type' | 'importance'>,
  state: NodeVisualState = {},
): number {
  const base = BASE_NODE_RADIUS[node.type] * RENDER_RADIUS_SCALE * importanceScale(node.importance)
  return base * stateMultiplier(state)
}

export function labelOffset(renderR: number): number {
  return renderR + 10
}

/** @deprecated Use BASE_NODE_RADIUS — kept for NodeRenderer compat */
export const NODE_RADIUS = BASE_NODE_RADIUS
