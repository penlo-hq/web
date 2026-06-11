import { useGraphStore } from '../../store/graphStore'

type Props = {
  nodeCount: number
  edgeCount: number
  selectedLabel?: string | null
}

export function GraphLegend({ nodeCount, edgeCount, selectedLabel }: Props) {
  const layoutMode = useGraphStore((s) => s.layoutMode)
  const layoutHint =
    layoutMode === 'focus'
      ? 'Focus — neighborhood framed'
      : layoutMode === 'cluster'
        ? 'Cluster — grouped by team'
        : 'Free — explore the graph'

  return (
    <div className="pointer-events-none rounded-xl border border-border bg-white/92 backdrop-blur-sm px-3 py-2.5 shadow-sm max-w-[240px]">
      <p className="text-[11px] font-medium text-text-primary tabular-nums">
        {nodeCount} nodes · {edgeCount} edges
      </p>
      <p className="text-[10px] text-text-tertiary mt-1 leading-relaxed">
        Larger nodes = higher importance
      </p>
      <p className="text-[10px] text-text-tertiary mt-0.5">{layoutHint}</p>
      {selectedLabel && (
        <p className="text-[10px] text-accent font-medium mt-1.5 truncate" title={selectedLabel}>
          Selected: {selectedLabel}
        </p>
      )}
    </div>
  )
}
