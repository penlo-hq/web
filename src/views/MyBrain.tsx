import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraphCanvas } from '../components/graph/GraphCanvas'
import { GraphControls } from '../components/graph/GraphControls'
import { NodeDetailPanel } from '../components/graph/NodeDetailPanel'
import { TopBar } from '../components/layout/TopBar'
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

  useEffect(() => {
    setLoading(true)
    graphApi.me()
      .then((data) => setGraph(data.nodes, data.edges))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [setGraph, setLoading])

  return (
    <motion.div
      key="my-brain"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar onMenuClick={onMenuClick} title="My Brain" subtitle="Personal context · Live" />

      <div className="px-5 pt-4 pb-2">
        <GraphControls />
      </div>

      <div className="flex-1 relative mx-5 mb-5 rounded-card hairline-border overflow-hidden bg-canvas">
        <GraphCanvas
          nodes={Array.from(nodes.values())}
          edges={Array.from(edges.values())}
          hiddenTypes={hiddenTypes}
          searchQuery={searchQuery}
          selectedId={selectedId}
          onSelect={setSelected}
          layoutMode={layoutMode}
        />
        <NodeDetailPanel selectedId={selectedId} onClose={() => setSelected(null)} />
      </div>
    </motion.div>
  )
}
