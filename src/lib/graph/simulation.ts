import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import type { GraphEdge, GraphNode, NodeType } from '../../types/graph'
import { BASE_NODE_RADIUS, collideRadius, NODE_RADIUS } from './nodeVisuals'

export type SimNode = GraphNode & SimulationNodeDatum & { _isNew?: boolean }
export type SimLink = SimulationLinkDatum<SimNode> & { id: string; kind: string; weight: number }

export { NODE_RADIUS, BASE_NODE_RADIUS, collideRadius }

const LINK_DISTANCE: Record<NodeType, number> = {
  company: 0,
  team: 180,
  person: 130,
  client: 140,
  topic: 110,
  task: 80,
  event: 80,
  draft: 75,
  agent: 90,
  feature: 85,
  decision: 70,
  architecture: 80,
  alert: 90,
}

const CHARGE_STRENGTH: Record<NodeType, number> = {
  company: -1400,
  team: -900,
  person: -320,
  client: -280,
  topic: -260,
  task: -200,
  event: -200,
  draft: -180,
  agent: -220,
  feature: -210,
  decision: -190,
  architecture: -200,
  alert: -240,
}

export type BuildSimulationOptions = {
  clusterMode?: boolean
}

export function buildSimulation(
  nodes: SimNode[],
  links: SimLink[],
  width: number,
  height: number,
  onTick: () => void,
  options: BuildSimulationOptions = {},
) {
  const pad = 72
  const { clusterMode = false } = options

  const boundsForce = () => {
    for (const node of nodes) {
      if (node.x !== undefined && node.vx !== undefined) {
        if (node.x < pad) node.vx += (pad - node.x) * 0.12
        else if (node.x > width - pad) node.vx += (width - pad - node.x) * 0.12
      }
      if (node.y !== undefined && node.vy !== undefined) {
        if (node.y < pad) node.vy += (pad - node.y) * 0.12
        else if (node.y > height - pad) node.vy += (height - pad - node.y) * 0.12
      }
    }
  }

  const sim = forceSimulation<SimNode, SimLink>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance((l) => LINK_DISTANCE[(l.target as SimNode).type] ?? 90)
        .strength(0.5),
    )
    .force('charge', forceManyBody<SimNode>().strength((d) => CHARGE_STRENGTH[d.type] ?? -250))
    .force('collide', forceCollide<SimNode>().radius((d) => collideRadius(d) + 18).strength(0.9))
    .force('bounds', boundsForce)
    .alpha(0.9)
    .alphaDecay(0.032)
    .on('tick', onTick)

  if (clusterMode) {
    const teamIds = Array.from(
      new Set(nodes.map((n) => n.team_id).filter((t): t is string => Boolean(t)))
    )
    const centroids = new Map<string, { x: number; y: number }>()
    const n = Math.max(teamIds.length, 1)
    const radius = Math.min(width, height) * 0.32
    teamIds.forEach((tid, i) => {
      const angle = (i / n) * Math.PI * 2
      centroids.set(tid, {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      })
    })

    const centerX = (d: SimNode): number => {
      if (!d.team_id) return width / 2
      return centroids.get(d.team_id)?.x ?? width / 2
    }
    const centerY = (d: SimNode): number => {
      if (!d.team_id) return height / 2
      return centroids.get(d.team_id)?.y ?? height / 2
    }

    sim
      .force('center', null)
      .force('x', forceX<SimNode>(centerX).strength(0.18))
      .force('y', forceY<SimNode>(centerY).strength(0.18))
  } else {
    sim
      .force('center', forceCenter(width / 2, height / 2).strength(0.08))
      .force('x', forceX<SimNode>(width / 2).strength(0.07))
      .force('y', forceY<SimNode>(height / 2).strength(0.07))
  }

  return sim
}

export function nodesToSimNodes(
  nodes: GraphNode[],
  prevById: Map<string, SimNode>,
  width: number,
  height: number,
): SimNode[] {
  return nodes.map((n) => {
    const prev = prevById.get(n.id)
    const isFixed = n.type === 'company'
    return {
      ...n,
      x: prev?.x ?? width / 2 + (Math.random() - 0.5) * 300,
      y: prev?.y ?? height / 2 + (Math.random() - 0.5) * 300,
      vx: prev?.vx ?? 0,
      vy: prev?.vy ?? 0,
      fx: isFixed ? width / 2 : undefined,
      fy: isFixed ? height / 2 : undefined,
    }
  })
}

export function edgesToSimLinks(edges: GraphEdge[], nodeById: Map<string, SimNode>): SimLink[] {
  return edges
    .map((e) => ({
      source: nodeById.get(e.source_id)!,
      target: nodeById.get(e.target_id)!,
      id: e.id,
      kind: e.kind,
      weight: e.weight,
    }))
    .filter((l) => l.source != null && l.target != null)
}
