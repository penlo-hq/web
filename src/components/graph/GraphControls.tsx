import { NODE_TYPE_LABEL, NODE_TYPE_ORDER, type NodeType } from '../../types/graph'
import { useGraphStore, type LayoutMode } from '../../store/graphStore'

const LAYOUT_MODES: LayoutMode[] = ['free', 'focus', 'cluster']

export function GraphControls() {
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes)
  const searchQuery = useGraphStore((s) => s.searchQuery)
  const toggleType = useGraphStore((s) => s.toggleType)
  const resetTypes = useGraphStore((s) => s.resetTypes)
  const setSearch = useGraphStore((s) => s.setSearch)
  const nodes = useGraphStore((s) => s.nodes)
  const layoutMode = useGraphStore((s) => s.layoutMode)
  const setLayoutMode = useGraphStore((s) => s.setLayoutMode)

  const counts = NODE_TYPE_ORDER.reduce<Record<NodeType, number>>((acc, t) => {
    acc[t] = 0
    for (const n of nodes.values()) if (n.type === t) acc[t]++
    return acc
  }, {} as Record<NodeType, number>)

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search nodes…"
        className="w-full px-3 py-1.5 text-[12px] border border-mist rounded-lg bg-white text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {NODE_TYPE_ORDER.map((t) => {
          const off = hiddenTypes.has(t)
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                off ? 'border-mist bg-white text-stone hover:text-graphite' : 'border-ink bg-ink text-white'
              }`}
            >
              <span className="tabular-nums opacity-60 mr-1">{counts[t]}</span>
              {NODE_TYPE_LABEL[t]}
            </button>
          )
        })}
        {hiddenTypes.size > 0 && (
          <button onClick={resetTypes} className="ml-1 text-[11px] text-stone hover:text-ink transition-colors">
            Reset
          </button>
        )}
        <div className="ml-auto inline-flex border border-mist rounded-lg overflow-hidden">
          {LAYOUT_MODES.map((m) => {
            const isActive = layoutMode === m
            return (
              <button
                key={m}
                onClick={() => setLayoutMode(m)}
                aria-pressed={isActive}
                aria-label={`Layout mode: ${m}`}
                className={`px-3 py-1 text-[11px] capitalize transition-colors ${
                  isActive ? 'bg-ink text-white' : 'bg-white text-graphite hover:text-ink'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
