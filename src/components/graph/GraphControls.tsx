import { useState } from 'react'
import { NODE_TYPE_LABEL, NODE_TYPE_ORDER, type NodeType } from '../../types/graph'
import { useGraphStore, type LayoutMode } from '../../store/graphStore'

const LAYOUT_MODES: LayoutMode[] = ['free', 'focus', 'cluster']

const LAYOUT_LABEL: Record<LayoutMode, string> = {
  free: 'Free',
  focus: 'Focus',
  cluster: 'Cluster',
}

const LAYOUT_TITLE: Record<LayoutMode, string> = {
  free: 'Free — explore the full graph',
  focus: 'Focus — frame selection and neighbors',
  cluster: 'Cluster — group nodes by team',
}

export function GraphControls() {
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes)
  const searchQuery = useGraphStore((s) => s.searchQuery)
  const toggleType = useGraphStore((s) => s.toggleType)
  const resetTypes = useGraphStore((s) => s.resetTypes)
  const setSearch = useGraphStore((s) => s.setSearch)
  const nodes = useGraphStore((s) => s.nodes)
  const layoutMode = useGraphStore((s) => s.layoutMode)
  const setLayoutMode = useGraphStore((s) => s.setLayoutMode)
  const [filtersOpen, setFiltersOpen] = useState(true)

  const counts = NODE_TYPE_ORDER.reduce<Record<NodeType, number>>((acc, t) => {
    acc[t] = 0
    for (const n of nodes.values()) if (n.type === t) acc[t]++
    return acc
  }, {} as Record<NodeType, number>)

  const visibleTypes = NODE_TYPE_ORDER.filter((t) => counts[t] > 0 || !hiddenTypes.has(t))

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search nodes…"
        aria-label="Search graph nodes"
        className="w-full px-3 py-2.5 text-[14px] border border-border rounded-xl bg-canvas text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15 transition-all"
      />

      <p className="text-[11px] text-text-tertiary hidden sm:block">
        Click a node to inspect · Node size reflects importance
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="md:hidden text-[12px] font-medium text-text-secondary hover:text-text-primary focus-ring rounded-lg px-2 py-1"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          {filtersOpen ? 'Hide filters' : 'Show filters'}
        </button>
        <div className="ml-auto inline-flex border border-black/[0.10] rounded-xl overflow-hidden bg-canvas shrink-0">
          {LAYOUT_MODES.map((m) => {
            const isActive = layoutMode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setLayoutMode(m)}
                aria-pressed={isActive}
                title={LAYOUT_TITLE[m]}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors focus-ring ${
                  isActive ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                }`}
              >
                {LAYOUT_LABEL[m]}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`relative -mx-1 ${filtersOpen ? '' : 'hidden md:block'}`}>
          <div className="flex flex-wrap items-center gap-2 px-1 pb-0.5 max-md:overflow-x-auto max-md:flex-nowrap max-md:pb-1">
            {(visibleTypes.length > 0 ? visibleTypes : NODE_TYPE_ORDER).map((t) => {
              const off = hiddenTypes.has(t)
              const count = counts[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  aria-pressed={!off}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors focus-ring ${
                    off
                      ? 'border-black/[0.10] bg-canvas text-text-secondary hover:text-text-primary hover:border-black/[0.16]'
                      : 'border-accent bg-accent text-white shadow-sm'
                  }`}
                >
                  <span className={off ? 'text-text-tertiary' : 'text-white/90'}>{NODE_TYPE_LABEL[t]}</span>
                  <span
                    className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded-full ${
                      off ? 'bg-black/[0.05] text-text-secondary' : 'bg-white/20 text-white'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
            {hiddenTypes.size > 0 && (
              <button
                type="button"
                onClick={resetTypes}
                className="shrink-0 text-[12px] font-medium text-text-secondary hover:text-accent transition-colors focus-ring px-2"
              >
                Show all
              </button>
            )}
          </div>
      </div>
    </div>
  )
}
