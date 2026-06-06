import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { NodeType } from '../../types/graph'
import { labelOffset, renderRadius, type NodeVisualState } from '../../lib/graph/nodeVisuals'

const NODE_COLOR: Record<NodeType, string> = {
  company: '#0a0a0a',
  team: '#2b2b2b',
  person: '#3d3d3d',
  client: '#b45309',
  topic: '#6b6b6b',
  task: '#2b2b2b',
  event: '#4a4a4a',
  draft: '#9a9a9a',
  agent: '#0a0a0a',
  feature: '#1d4ed8',
  decision: '#854d0e',
  architecture: '#0369a1',
  alert: '#d97706',
}

type Props = {
  id: string
  type: NodeType
  label: string
  importance: number
  x: number
  y: number
  z: number
  isHovered: boolean
  isSelected: boolean
  isDimmed: boolean
  isStale?: boolean
  onPointerOver: () => void
  onPointerOut: () => void
  onClick: (e: THREE.Event) => void
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

export function Node3D({
  type,
  label,
  importance,
  x,
  y,
  z,
  isHovered,
  isSelected,
  isDimmed,
  isStale,
  onPointerOver,
  onPointerOut,
  onClick,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const currentScale = useRef(1)
  const reducedMotion = usePrefersReducedMotion()

  const visualState: NodeVisualState = { isSelected, isHovered: isHovered || hovered, isDimmed }
  const baseR = renderRadius({ type, importance }, { isDimmed })
  const targetR = renderRadius({ type, importance }, visualState)
  const color = NODE_COLOR[type]
  const pulseAlert = type === 'alert' && !isStale && !reducedMotion && !isSelected

  const showLabel =
    isSelected || isHovered || hovered || type === 'company' || type === 'team'

  useFrame(({ clock }) => {
    const targetScale = targetR / baseR
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.14)
    if (meshRef.current) {
      meshRef.current.scale.setScalar(currentScale.current)
    }
    if (ringRef.current && isSelected) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.getElapsedTime() * 2.5) * 0.04
      ringRef.current.scale.setScalar(pulse)
    }
    if (materialRef.current) {
      if (pulseAlert) {
        const t = (Math.sin(clock.getElapsedTime() * 2.2) + 1) / 2
        materialRef.current.emissiveIntensity = 0.05 + t * 0.07
      } else if (isSelected) {
        materialRef.current.emissiveIntensity = 0.14
      } else if (isHovered || hovered) {
        materialRef.current.emissiveIntensity = 0.06
      } else if (type === 'alert') {
        materialRef.current.emissiveIntensity = 0.08
      } else {
        materialRef.current.emissiveIntensity = 0
      }
    }
  })

  const displayR = baseR * currentScale.current

  return (
    <group position={[x, y, z]}>
      {isSelected && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[baseR + 3, 1.2, 16, 48]} />
          <meshBasicMaterial color="#1d4ed8" transparent opacity={0.45} />
        </mesh>
      )}

      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onPointerOver()
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          onPointerOut()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick(e)
        }}
      >
        <sphereGeometry args={[baseR, 40, 40]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={isSelected ? '#1d4ed8' : color}
          emissiveIntensity={0}
          roughness={0.55}
          metalness={0}
          transparent
          opacity={isDimmed ? 0.12 : 1}
        />
      </mesh>

      {showLabel && (
        <Html
          center
          distanceFactor={320}
          zIndexRange={isSelected ? [100, 0] : [50, 0]}
          style={{ pointerEvents: 'none' }}
          position={[0, labelOffset(displayR), 0]}
        >
          <div
            className={`max-w-[200px] rounded-lg border px-2.5 py-1.5 shadow-sm backdrop-blur-sm ${
              isSelected
                ? 'border-accent/30 bg-white/95'
                : 'border-border bg-white/90'
            }`}
          >
            <p
              className={`text-[13px] leading-snug font-medium text-text-primary ${
                isSelected ? '' : 'line-clamp-2'
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {label.length > 48 && !isSelected ? `${label.slice(0, 46)}…` : label}
            </p>
            {isSelected && (
              <p className="text-[10px] text-accent font-semibold mt-0.5 tabular-nums">
                {(importance * 100).toFixed(0)}% importance
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
