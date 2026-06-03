import { useCallback, useEffect, useState } from 'react'
import { GraphCanvas } from '../components/graph/GraphCanvas'
import { BrainGraphLayout } from '../components/graph/BrainGraphLayout'
import { useGraphStore } from '../store/graphStore'
import { graphApi } from '../lib/api/endpoints'
import type { PageProps } from '../types/layout'

export function MyBrain({ onMenuClick }: PageProps) {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes)
  const searchQuery = useGraphStore((s) => s.searchQuery)
  const selectedId = useGraphStore((s) => s.selectedId)
  const setSelected = useGraphStore((s) => s.setSelected)
  const setGraph = useGraphStore((s) => s.setGraph)
  const setLoading = useGraphStore((s) => s.setLoading)
  const layoutMode = useGraphStore((s) => s.layoutMode)
  const loading = useGraphStore((s) => s.isLoading)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setError(false)
    setLoading(true)
    graphApi
      .me()
      .then((data) => setGraph(data.nodes, data.edges))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [setGraph, setLoading])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <BrainGraphLayout
      title="My Brain"
      subtitle="Personal context"
      useTimelineEyebrow
      onMenuClick={onMenuClick}
      loading={loading}
      error={error}
      onRetry={load}
    >
      <GraphCanvas
        nodes={Array.from(nodes.values())}
        edges={Array.from(edges.values())}
        hiddenTypes={hiddenTypes}
        searchQuery={searchQuery}
        selectedId={selectedId}
        onSelect={setSelected}
        layoutMode={layoutMode}
      />
    </BrainGraphLayout>
  )
}
