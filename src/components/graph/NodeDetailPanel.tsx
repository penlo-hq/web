import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type {
  GraphNode,
  NodeCitation,
  NodeRelationship,
} from '../../types/graph'
import { NODE_TYPE_LABEL } from '../../types/graph'
import { nodeApi } from '../../lib/api/endpoints'
import { useGraphStore } from '../../store/graphStore'
import { useAuthStore } from '../../store/authStore'

type Archaeology = {
  source_event: {
    id: string
    source: string
    processed_at: string
    raw_excerpt: string
  } | null
  superseded_chain: GraphNode[]
  people_present: GraphNode[]
  contradictions: unknown[]
}

type Alert = {
  resolved: boolean
  conflict_nodes: GraphNode[]
}

type NodeDetail = GraphNode & {
  connections: unknown[]
  neighbors: GraphNode[]
  cited_in_count?: number
  archaeology?: Archaeology
  alert?: Alert
}

type Props = { selectedId: string | null; onClose: () => void }

type Tab = 'overview' | 'relationships'

type EditDraft = { detail: string; meta: string; is_private: boolean }

export function NodeDetailPanel({ selectedId, onClose }: Props) {
  const nodes = useGraphStore((s) => s.nodes)
  const updateNode = useGraphStore((s) => s.updateNode)
  const user = useAuthStore((s) => s.user)
  const [detail, setDetail] = useState<NodeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [citations, setCitations] = useState<NodeCitation[] | null>(null)
  const [citationsLoading, setCitationsLoading] = useState(false)
  const [citationsExpanded, setCitationsExpanded] = useState(false)
  const [relationships, setRelationships] = useState<NodeRelationship[] | null>(null)
  const [relationshipsLoading, setRelationshipsLoading] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editDraft, setEditDraft] = useState<EditDraft>({ detail: '', meta: '', is_private: false })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canEdit = user?.role === 'admin' || user?.role === 'team_lead'
  const canTogglePrivate = user?.role === 'admin' || user?.role === 'team_lead'

  const openEdit = () => {
    if (!node) return
    setEditDraft({ detail: node.detail ?? '', meta: node.meta ?? '', is_private: node.is_private ?? false })
    setSaveError(null)
    setEditOpen(true)
  }

  const closeEdit = () => setEditOpen(false)

  const saveEdit = async () => {
    if (!selectedId) return
    setSaving(true)
    setSaveError(null)
    try {
      const patch: Record<string, unknown> = { detail: editDraft.detail, meta: editDraft.meta }
      if (canTogglePrivate) patch.is_private = editDraft.is_private
      const saved = await nodeApi.patch(selectedId, patch)
      updateNode(selectedId, saved as Partial<import('../../types/graph').GraphNode>)
      setDetail((d) => d ? { ...d, ...saved } : d)
      setEditOpen(false)
    } catch {
      setSaveError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setCitations(null)
      setRelationships(null)
      setTab('overview')
      setCitationsExpanded(false)
      return
    }
    setLoading(true)
    setCitations(null)
    setRelationships(null)
    setCitationsExpanded(false)
    setTab('overview')
    nodeApi.get(selectedId)
      .then((d: NodeDetail) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [selectedId])

  const node = useMemo(() => (selectedId ? nodes.get(selectedId) : null), [selectedId, nodes])
  const isPersonOrClient = node?.type === 'person' || node?.type === 'client'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (tab !== 'relationships' || !selectedId || relationships !== null || relationshipsLoading) return
    setRelationshipsLoading(true)
    nodeApi.relationships(selectedId)
      .then(setRelationships)
      .catch(() => setRelationships([]))
      .finally(() => setRelationshipsLoading(false))
  }, [tab, selectedId, relationships, relationshipsLoading])

  const toggleCitations = () => {
    if (!selectedId) return
    setCitationsExpanded((v) => !v)
    if (citations === null && !citationsLoading) {
      setCitationsLoading(true)
      nodeApi.citations(selectedId)
        .then(setCitations)
        .catch(() => setCitations([]))
        .finally(() => setCitationsLoading(false))
    }
  }

  const onResolve = async (keepNodeId: string) => {
    if (!selectedId || resolving) return
    setResolving(keepNodeId)
    try {
      await nodeApi.resolveAlert(selectedId, keepNodeId)
      setDetail((d) => (d ? { ...d, alert: d.alert ? { ...d.alert, resolved: true } : d.alert } : d))
    } finally {
      setResolving(null)
    }
  }

  return (
    <AnimatePresence>
      {selectedId && (
        <motion.div
          key="panel"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="absolute right-0 top-0 h-full w-[300px] bg-white/95 backdrop-blur-sm border-l border-mist shadow-[−4px_0_24px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden"
        >
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div>
              <span className="text-[9.5px] uppercase tracking-[0.22em] text-stone">
                {node ? NODE_TYPE_LABEL[node.type] : ''}
              </span>
              <h2 className="mt-1 text-[18px] font-display font-bold tracking-tightest text-ink leading-tight">
                {node?.label ?? ''}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {canEdit && node && (
                <button
                  onClick={openEdit}
                  className="text-[10.5px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
                  aria-label="Edit node"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-stone hover:text-ink text-lg leading-none transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {editOpen && (
            <div className="absolute inset-0 z-10 flex flex-col bg-white/98 backdrop-blur-sm px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10.5px] uppercase tracking-[0.2em] text-stone">Edit node</span>
                <button onClick={closeEdit} className="text-stone hover:text-ink text-lg leading-none transition-colors" aria-label="Cancel">×</button>
              </div>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone mb-1.5">Detail</label>
                  <textarea
                    value={editDraft.detail}
                    onChange={(e) => setEditDraft((d) => ({ ...d, detail: e.target.value }))}
                    rows={5}
                    className="w-full text-[13px] text-ink bg-paper border border-mist rounded-md px-3 py-2 focus:outline-none focus:border-graphite resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone mb-1.5">Meta</label>
                  <input
                    type="text"
                    value={editDraft.meta}
                    onChange={(e) => setEditDraft((d) => ({ ...d, meta: e.target.value }))}
                    className="w-full text-[13px] text-ink bg-paper border border-mist rounded-md px-3 py-2 focus:outline-none focus:border-graphite"
                  />
                </div>
                {canTogglePrivate && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone">Private</span>
                    <div
                      onClick={() => setEditDraft((d) => ({ ...d, is_private: !d.is_private }))}
                      className={`w-9 h-5 rounded-full transition-colors ${editDraft.is_private ? 'bg-ink' : 'bg-mist'} relative`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editDraft.is_private ? 'translate-x-4' : ''}`} />
                    </div>
                  </label>
                )}
                {saveError && (
                  <p className="text-[12px] text-red-500">{saveError}</p>
                )}
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-mist">
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="flex-1 py-2 text-[11px] uppercase tracking-[0.18em] border border-mist rounded-md text-stone hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 py-2 text-[11px] uppercase tracking-[0.18em] bg-ink text-white rounded-md disabled:bg-mist disabled:text-stone transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {isPersonOrClient && (
            <div className="flex border-b border-mist px-5">
              {(['overview', 'relationships'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    tab === t ? 'text-ink border-b border-ink' : 'text-stone hover:text-graphite'
                  }`}
                >
                  {t === 'overview' ? 'Overview' : 'Relationships'}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {loading && (
              <div className="flex items-center gap-2 text-[12px] text-stone">
                <span className="animate-spin">○</span> Loading…
              </div>
            )}

            {tab === 'overview' && (
              <>
                {node?.detail && (
                  <p className="text-[13px] text-graphite leading-relaxed">{node.detail}</p>
                )}
                {node?.meta && (
                  <span className="inline-block text-[10.5px] uppercase tracking-[0.16em] text-stone">{node.meta}</span>
                )}

                {detail?.alert && (
                  <AlertSection
                    alert={detail.alert}
                    isAdmin={isAdmin}
                    onResolve={onResolve}
                    resolvingId={resolving}
                  />
                )}

                {detail?.archaeology && (
                  <ArchaeologySection arch={detail.archaeology} />
                )}

                {detail?.neighbors && detail.neighbors.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-stone mb-2">
                      Connected · {detail.neighbors.length}
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                      {detail.neighbors.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => useGraphStore.getState().setSelected(n.id)}
                          className="text-left flex items-center gap-2 group"
                        >
                          <span className="text-[9.5px] uppercase tracking-[0.14em] text-stone w-14 shrink-0">
                            {NODE_TYPE_LABEL[n.type]}
                          </span>
                          <span className="text-[12.5px] text-graphite group-hover:text-ink transition-colors truncate">
                            {n.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {node && (
                  <div className="pt-3 border-t border-mist">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-stone mb-2">Properties</div>
                    <div className="text-[11.5px] text-stone space-y-1">
                      <div>Importance: <span className="text-graphite">{(node.importance * 100).toFixed(0)}%</span></div>
                      <div>Last seen: <span className="text-graphite">{new Date(node.last_seen_at).toLocaleDateString()}</span></div>
                      {typeof detail?.cited_in_count === 'number' && detail.cited_in_count > 0 && (
                        <div>
                          <button
                            onClick={toggleCitations}
                            className="text-graphite hover:text-ink transition-colors underline underline-offset-2"
                          >
                            Cited in {detail.cited_in_count} answers {citationsExpanded ? '▴' : '▾'}
                          </button>
                        </div>
                      )}
                    </div>
                    {citationsExpanded && (
                      <div className="mt-2 space-y-1.5">
                        {citationsLoading && (
                          <div className="text-[11px] text-stone">Loading citations…</div>
                        )}
                        {citations && citations.length === 0 && (
                          <div className="text-[11px] text-stone">No citations yet.</div>
                        )}
                        {citations && citations.map((c) => (
                          <div key={c.id} className="text-[11.5px] text-graphite">
                            <div className="truncate">{c.question ?? '(no question)'}</div>
                            <div className="text-[10px] text-stone">
                              {new Date(c.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {tab === 'relationships' && (
              <RelationshipsSection
                loading={relationshipsLoading}
                rows={relationships}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AlertSection({
  alert,
  isAdmin,
  onResolve,
  resolvingId,
}: {
  alert: Alert
  isAdmin: boolean
  onResolve: (keepId: string) => void
  resolvingId: string | null
}) {
  const [a, b] = alert.conflict_nodes
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-amber-900 font-semibold mb-2">
        Alert · Drift Detected
      </div>
      {a && (
        <div className="mb-2">
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-amber-900">Statement A</div>
          <div className="text-[12.5px] text-ink">{a.label}</div>
          {a.detail && <div className="text-[11.5px] text-graphite">{a.detail.slice(0, 200)}</div>}
        </div>
      )}
      {b && (
        <div className="mb-2">
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-amber-900">Statement B</div>
          <div className="text-[12.5px] text-ink">{b.label}</div>
          {b.detail && <div className="text-[11.5px] text-graphite">{b.detail.slice(0, 200)}</div>}
        </div>
      )}
      {!alert.resolved && isAdmin && a && b && (
        <div className="flex gap-2 mt-3">
          <button
            disabled={resolvingId !== null}
            onClick={() => onResolve(a.id)}
            aria-label="Keep statement A"
            className="flex-1 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] bg-ink text-white rounded-md disabled:bg-mist disabled:text-stone transition-colors"
          >
            Keep A
          </button>
          <button
            disabled={resolvingId !== null}
            onClick={() => onResolve(b.id)}
            aria-label="Keep statement B"
            className="flex-1 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] bg-ink text-white rounded-md disabled:bg-mist disabled:text-stone transition-colors"
          >
            Keep B
          </button>
        </div>
      )}
      {alert.resolved && (
        <div className="text-[11px] text-amber-900 mt-2">Resolved.</div>
      )}
    </div>
  )
}

function ArchaeologySection({ arch }: { arch: Archaeology }) {
  const setSelected = useGraphStore((s) => s.setSelected)
  const { source_event, people_present, superseded_chain } = arch
  if (!source_event && people_present.length === 0 && superseded_chain.length === 0) {
    return null
  }
  return (
    <div className="pt-3 border-t border-mist">
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone mb-2">Archaeology</div>
      {source_event && (
        <div className="mb-3">
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-stone">Captured from</div>
          <div className="text-[12px] text-graphite">
            {source_event.source} · {new Date(source_event.processed_at).toLocaleDateString()}
          </div>
          {source_event.raw_excerpt && (
            <div className="text-[11.5px] text-stone italic mt-1">
              "{source_event.raw_excerpt.slice(0, 160)}"
            </div>
          )}
        </div>
      )}
      {people_present.length > 0 && (
        <div className="mb-3">
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-stone">People present</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {people_present.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className="text-[11.5px] text-graphite hover:text-ink underline underline-offset-2"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {superseded_chain.length > 0 && (
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-stone">
            Supersedes {superseded_chain.length} prior decision{superseded_chain.length === 1 ? '' : 's'}
          </div>
          <div className="mt-1 space-y-1">
            {superseded_chain.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className="block text-left text-[11.5px] text-graphite hover:text-ink"
              >
                {new Date(s.created_at).toLocaleDateString()} · {s.label}
                {s.is_stale && <span className="text-stone ml-1">(stale)</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RelationshipsSection({
  loading,
  rows,
}: {
  loading: boolean
  rows: NodeRelationship[] | null
}) {
  const setSelected = useGraphStore((s) => s.setSelected)
  if (loading) return <div className="text-[12px] text-stone">Loading relationships…</div>
  if (!rows || rows.length === 0) {
    return <div className="text-[12px] text-stone">No interactions captured yet.</div>
  }
  const max = Math.max(...rows.map((r) => r.interaction_count), 1)
  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone">
        Interactions with internal team
      </div>
      {rows.map((r) => {
        const width = Math.max(8, Math.round((r.interaction_count / max) * 100))
        return (
          <button
            key={r.person.id}
            onClick={() => setSelected(r.person.id)}
            className="block w-full text-left group"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[12.5px] text-graphite group-hover:text-ink transition-colors">
                {r.person.label}
              </span>
              <span className="text-[11px] tabular-nums text-stone">{r.interaction_count}</span>
            </div>
            <div className="h-1 mt-1 bg-mist rounded">
              <div className="h-full bg-graphite rounded" style={{ width: `${width}%` }} />
            </div>
            <div className="text-[10.5px] text-stone mt-1">
              {r.most_recent_at && <>recent: {new Date(r.most_recent_at).toLocaleDateString()} · </>}
              {r.top_topics.length > 0 && (
                <span>topics: {r.top_topics.map((t) => t.label).join(', ')}</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
