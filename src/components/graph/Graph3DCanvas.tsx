import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { SimNode, SimLink } from '../../lib/graph/simulation'
import { Node3D } from './Node3D'
import { Edge3D } from './Edge3D'
import type { LayoutMode } from '../../store/graphStore'

const Z_SCALE: Record<string, number> = {
  company: 0,
  team: 50,
  person: 180,
  client: 170,
  topic: 210,
  task: 250,
  event: 230,
  draft: 210,
  agent: 190,
  feature: 230,
  decision: 230,
  architecture: 220,
  alert: 200,
}

function stableZ(id: string, scale: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return ((h >>> 0) / 0xffffffff - 0.5) * 2 * scale
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

type Props = {
  nodes: SimNode[]
  links: SimLink[]
  focusedIds: Set<string> | null
  hoverId: string | null
  selectedId: string | null
  width: number
  height: number
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
  layoutMode?: LayoutMode
}

export function Graph3DCanvas({
  nodes,
  links,
  focusedIds,
  hoverId,
  selectedId,
  width,
  height,
  onHover,
  onSelect,
  layoutMode = 'free',
}: Props) {
  const nodeZ = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of nodes) {
      m.set(n.id, stableZ(n.id, Z_SCALE[n.type] ?? 200))
    }
    return m
  }, [nodes])

  const focusCentroid = useMemo(() => {
    if (layoutMode !== 'focus' || !selectedId || !focusedIds) return null
    let cx = 0,
      cy = 0,
      cz = 0,
      count = 0
    for (const n of nodes) {
      if (!focusedIds.has(n.id) || n.x == null || n.y == null) continue
      cx += n.x - width / 2
      cy += -(n.y - height / 2)
      cz += nodeZ.get(n.id) ?? 0
      count += 1
    }
    if (count === 0) return null
    return new THREE.Vector3(cx / count, cy / count, cz / count)
  }, [layoutMode, selectedId, focusedIds, nodes, nodeZ, width, height])

  const focusFraming = useMemo(() => {
    if (layoutMode !== 'focus' || !selectedId || !focusedIds) return null
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity
    for (const n of nodes) {
      if (!focusedIds.has(n.id) || n.x == null || n.y == null) continue
      const x = n.x - width / 2
      const y = -(n.y - height / 2)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    if (minX === Infinity) return null
    const rx = (maxX - minX) / 2 + 60
    const ry = (maxY - minY) / 2 + 60
    const radius = Math.sqrt(rx * rx + ry * ry)
    const fovRad = (55 * Math.PI) / 180
    return Math.max(200, Math.min(1400, (radius / Math.tan(fovRad / 2)) * 1.2))
  }, [layoutMode, selectedId, focusedIds, nodes, width, height])

  const selectedWorldPos = useMemo(() => {
    if (!selectedId) return null
    const n = nodes.find((node) => node.id === selectedId)
    if (!n || n.x == null || n.y == null) return null
    return new THREE.Vector3(
      n.x - width / 2,
      -(n.y - height / 2),
      nodeZ.get(n.id) ?? 0,
    )
  }, [selectedId, nodes, nodeZ, width, height])

  const clusterHalos = useMemo(() => {
    if (layoutMode !== 'cluster') return []
    const byTeam = new Map<string, { x: number; y: number; count: number }>()
    for (const n of nodes) {
      if (!n.team_id || n.x == null || n.y == null) continue
      const acc = byTeam.get(n.team_id) ?? { x: 0, y: 0, count: 0 }
      acc.x += n.x - width / 2
      acc.y += -(n.y - height / 2)
      acc.count += 1
      byTeam.set(n.team_id, acc)
    }
    return Array.from(byTeam.entries()).map(([teamId, acc]) => ({
      teamId,
      cx: acc.x / acc.count,
      cy: acc.y / acc.count,
      r: 60 + acc.count * 8,
    }))
  }, [layoutMode, nodes, width, height])

  const cameraTarget = layoutMode === 'focus' && focusCentroid ? focusCentroid : selectedWorldPos
  const cameraDistance =
    layoutMode === 'focus' && focusFraming != null ? focusFraming : selectedWorldPos ? 420 : 700

  return (
    <Canvas
      camera={{ position: [0, 0, 700], fov: 55 }}
      style={{ background: '#ffffff' }}
      onPointerMissed={() => onSelect(null)}
    >
      <ambientLight intensity={0.75} />
      <pointLight position={[280, 280, 380]} intensity={0.7} />
      <pointLight position={[-180, -140, -240]} intensity={0.18} />

      <SelectionCameraController target={cameraTarget} distance={cameraDistance} />

      {clusterHalos.map((h) => (
        <mesh key={h.teamId} position={[h.cx, h.cy, -10]}>
          <ringGeometry args={[h.r - 1, h.r + 1, 64]} />
          <meshBasicMaterial color="#9a9a9a" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {links.map((l, i) => {
        const s = l.source as SimNode
        const t = l.target as SimNode
        const isFocusEdge = focusedIds ? focusedIds.has(s.id) && focusedIds.has(t.id) : true
        const touchesSelected =
          Boolean(selectedId) && (s.id === selectedId || t.id === selectedId)
        return (
          <Edge3D
            key={l.id ?? i}
            link={l}
            nodeZ={nodeZ}
            focused={isFocusEdge}
            touchesSelected={touchesSelected}
            width={width}
            height={height}
          />
        )
      })}

      {nodes.map((node) => {
        if (node.x == null || node.y == null) return null
        const isHovered = hoverId === node.id
        const isSelected = selectedId === node.id
        const isDimmed = focusedIds != null && !focusedIds.has(node.id)
        const x = node.x - width / 2
        const y = -(node.y - height / 2)
        const z = nodeZ.get(node.id) ?? 0
        return (
          <Node3D
            key={node.id}
            id={node.id}
            type={node.type}
            label={node.label}
            importance={node.importance ?? 0.5}
            x={x}
            y={y}
            z={z}
            isHovered={isHovered}
            isSelected={isSelected}
            isDimmed={isDimmed}
            isStale={node.is_stale}
            onPointerOver={() => onHover(node.id)}
            onPointerOut={() => onHover(null)}
            onClick={() => onSelect(selectedId === node.id ? null : node.id)}
          />
        )
      })}
    </Canvas>
  )
}

function SelectionCameraController({
  target,
  distance,
}: {
  target: THREE.Vector3 | null
  distance: number
}) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.Camera
    controls: { target: THREE.Vector3; update: () => void } | undefined
  }
  const reducedMotion = usePrefersReducedMotion()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const desiredRef = useRef<THREE.Vector3 | null>(null)
  const desiredCamRef = useRef(new THREE.Vector3(0, 0, 700))

  useEffect(() => {
    desiredRef.current = target
    desiredCamRef.current = target
      ? new THREE.Vector3(target.x, target.y, target.z + distance)
      : new THREE.Vector3(0, 0, 700)
    if (reducedMotion) {
      if (controls) {
        controls.target.copy(target ?? new THREE.Vector3(0, 0, 0))
        controls.update()
      }
      camera.position.copy(desiredCamRef.current)
    }
  }, [target, distance, reducedMotion, controls, camera])

  useFrame(() => {
    if (reducedMotion) return
    const desired = desiredRef.current ?? new THREE.Vector3(0, 0, 0)
    targetRef.current.lerp(desired, 0.12)
    if (controls) {
      controls.target.lerp(desired, 0.12)
      controls.update()
    }
    camera.position.lerp(desiredCamRef.current, 0.08)
  })

  return (
    <OrbitControls
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={80}
      maxDistance={2000}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  )
}
