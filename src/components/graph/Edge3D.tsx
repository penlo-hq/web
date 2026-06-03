import { Line } from '@react-three/drei'
import type { SimLink, SimNode } from '../../lib/graph/simulation'

const DEFAULT_COLOR = '#d8d8d8'
const ACCENT_COLOR = '#1d4ed8'

type Props = {
  link: SimLink
  nodeZ: Map<string, number>
  focused: boolean
  touchesSelected: boolean
  width: number
  height: number
}

export function Edge3D({ link, nodeZ, focused, touchesSelected, width, height }: Props) {
  const s = link.source as SimNode
  const t = link.target as SimNode
  if (s.x == null || t.x == null) return null

  const sx = s.x - width / 2
  const sy = -(s.y! - height / 2)
  const sz = nodeZ.get(s.id) ?? 0
  const tx = t.x - width / 2
  const ty = -(t.y! - height / 2)
  const tz = nodeZ.get(t.id) ?? 0

  const color = touchesSelected ? ACCENT_COLOR : focused ? '#9a9aaa' : DEFAULT_COLOR
  const opacity = touchesSelected
    ? 0.85
    : focused
      ? Math.min(0.75, 0.32 + link.weight * 0.43)
      : 0.35
  const lineWidth = touchesSelected ? 1.8 : focused ? 1.0 : 0.6

  return (
    <Line
      points={[[sx, sy, sz], [tx, ty, tz]]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
    />
  )
}
