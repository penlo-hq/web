import type { NodeType } from '../../types/graph'
import { computeDepth, DEPTH_BLUR, DEPTH_OPACITY, DEPTH_RADIUS_OFFSET } from '../../lib/graph/depth'
import { NODE_RADIUS, type SimNode } from '../../lib/graph/simulation'

const FILL: Record<NodeType, string> = {
  company: '#171717',
  team: '#171717',
  person: '#ffffff',
  client: '#fdf4e7',
  topic: '#fafafa',
  task: '#ffffff',
  event: '#ffffff',
  draft: '#ffffff',
  agent: '#171717',
  feature: '#eff6ff',
  decision: '#fefce8',
  alert: '#fef3c7',
}

const STROKE: Record<NodeType, string> = {
  company: 'none',
  team: 'none',
  person: '#171717',
  client: '#b45309',
  topic: '#6b6b6b',
  task: '#0a0a0a',
  event: '#0a0a0a',
  draft: '#0a0a0a',
  agent: 'none',
  feature: '#1d4ed8',
  decision: '#854d0e',
  alert: '#d97706',
}

const STROKE_DASH: Partial<Record<NodeType, string>> = {
  event: '3 3',
  draft: '2 2',
}

const STROKE_WIDTH: Record<NodeType, number> = {
  company: 0, team: 0, person: 1.5, client: 1.25, topic: 1,
  task: 1.25, event: 1, draft: 1, agent: 0, feature: 1.25, decision: 1.5, alert: 1.75,
}

const LABEL_COLOR: Record<NodeType, string> = {
  company: '#ffffff', team: '#ffffff', person: '#0a0a0a', client: '#92400e',
  topic: '#2b2b2b', task: '#0a0a0a', event: '#0a0a0a', draft: '#0a0a0a',
  agent: '#ffffff', feature: '#1e40af', decision: '#78350f', alert: '#92400e',
}

const INNER_LABEL: Partial<Record<NodeType, string>> = {
  company: 'ORG',
  agent: '⚡',
}

const DARK_NODES = new Set<NodeType>(['company', 'team', 'agent'])

type Props = {
  node: SimNode
  isFocused: boolean
  isDimmed: boolean
  isSelected: boolean
  teamColor?: string
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: (e: React.MouseEvent<SVGGElement>) => void
}

export function NodeRenderer({
  node, isFocused, isDimmed, isSelected, teamColor,
  onPointerDown, onPointerEnter, onPointerLeave, onClick,
}: Props) {
  if (node.x == null || node.y == null) return null

  const depth = computeDepth(node)
  const baseR = NODE_RADIUS[node.type] + DEPTH_RADIUS_OFFSET[depth]
  const r = isFocused ? baseR + 3 : baseR
  const opacity = isDimmed ? 0.22 : DEPTH_OPACITY[depth]
  const fill = node.type === 'team' && teamColor ? teamColor : FILL[node.type]
  const labelColor = node.type === 'team' ? '#ffffff' : LABEL_COLOR[node.type]
  const innerLabel = INNER_LABEL[node.type]
  const isDark = DARK_NODES.has(node.type)
  const sphereGrad = isDark ? 'url(#sphere-dark)' : 'url(#sphere-light)'
  const depthFilter = !isFocused && !isSelected ? DEPTH_BLUR[depth] : 'none'
  const nodeFilter = (isFocused || isSelected)
    ? 'url(#glow)'
    : depth === 'foreground'
      ? 'url(#shadow-fg)'
      : depthFilter !== 'none' ? depthFilter : undefined

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: 'pointer', opacity, transition: 'opacity 200ms' }}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {/* Outer glow ring for focused/selected */}
      {(isFocused || isSelected) && (
        <circle r={r + 12} fill="none" stroke="#0a0a0a" strokeOpacity={0.12} strokeWidth={1.5} />
      )}

      {/* Ambient depth halo for foreground nodes */}
      {depth === 'foreground' && !isFocused && !isSelected && (
        <circle r={r + 6} fill="none" stroke="#0a0a0a" strokeOpacity={0.05} strokeWidth={8} />
      )}

      {/* Main circle with filter */}
      <circle
        r={r}
        fill={fill}
        stroke={STROKE[node.type]}
        strokeWidth={STROKE_WIDTH[node.type]}
        strokeDasharray={STROKE_DASH[node.type]}
        style={{ filter: nodeFilter }}
      />

      {/* Sphere lighting overlay — creates 3D ball illusion */}
      <circle r={r} fill={sphereGrad} pointerEvents="none" />

      {/* Inner label (ORG, ⚡) */}
      {innerLabel && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={node.type === 'company' ? 10 : node.type === 'agent' ? 11 : 9}
          fontWeight={700}
          letterSpacing="0.06em"
          fill={labelColor}
          pointerEvents="none"
        >
          {innerLabel}
        </text>
      )}

      {/* Team name inside team node */}
      {node.type === 'team' && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={8}
          fontWeight={600}
          letterSpacing="0.05em"
          fill="#ffffff"
          pointerEvents="none"
        >
          {node.label.slice(0, 8)}
        </text>
      )}

      {/* External label */}
      {!innerLabel && node.type !== 'team' && !isDimmed && (
        <text
          x={r + 7}
          y={3}
          fontSize={11}
          fontWeight={isFocused || isSelected ? 600 : 500}
          fill={isFocused || isSelected ? '#0a0a0a' : '#2b2b2b'}
          pointerEvents="none"
          style={{ transition: 'font-weight 120ms' }}
        >
          {node.label.length > 24 ? node.label.slice(0, 22) + '…' : node.label}
        </text>
      )}
    </g>
  )
}
