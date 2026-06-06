import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { TopBar } from '../layout/TopBar'
import { GraphControls } from './GraphControls'
import { EmptyState } from '../ui'
import { NodeDetailPanel } from './NodeDetailPanel'
import { useGraphStore } from '../../store/graphStore'

type Props = {
  title: string
  subtitle: string
  useTimelineEyebrow?: boolean
  onMenuClick?: () => void
  loading: boolean
  error: boolean
  onRetry: () => void
  headerExtra?: ReactNode
  children: ReactNode
}

export function BrainGraphLayout({
  title,
  subtitle,
  useTimelineEyebrow = false,
  onMenuClick,
  loading,
  error,
  onRetry,
  headerExtra,
  children,
}: Props) {
  const selectedId = useGraphStore((s) => s.selectedId)
  const setSelected = useGraphStore((s) => s.setSelected)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar
        onMenuClick={onMenuClick}
        title={title}
        subtitle={subtitle}
        useTimelineEyebrow={useTimelineEyebrow}
      />

      <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 gap-3">
        <div className="shrink-0 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm space-y-3">
          {headerExtra}
          <GraphControls />
        </div>

        <div className="flex-1 relative min-h-0 rounded-2xl border border-border overflow-hidden bg-white shadow-sm">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                <p className="text-[13px] text-text-tertiary">Loading knowledge graph…</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
              <EmptyState
                icon={RefreshCw}
                title="Couldn't load the graph"
                description="Check your connection and try again."
              >
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors"
                >
                  Retry
                </button>
              </EmptyState>
            </div>
          ) : (
            children
          )}
          {!loading && !error && (
            <NodeDetailPanel selectedId={selectedId} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>
    </motion.div>
  )
}
