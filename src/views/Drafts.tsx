import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, RefreshCw, Search, WifiOff } from 'lucide-react'
import { draftsApi } from '../lib/api/endpoints'
import { extractApiError } from '../lib/api/errors'
import type { Draft } from '../types/graph'
import { useGraphStore } from '../store/graphStore'
import { TopBar } from '../components/layout/TopBar'
import { CardSkeleton, EmptyState } from '../components/ui'
import { OnboardingBriefModal } from '../components/admin/OnboardingBriefModal'
import { DraftListItem } from '../components/drafts/DraftListItem'
import { DraftDetailPanel } from '../components/drafts/DraftDetailPanel'
import { formatRefreshed, matchesDraftSearch } from '../components/drafts/draftUtils'
import type { PageProps } from '../types/layout'

export function Drafts({ onMenuClick }: PageProps) {
  const navigate = useNavigate()
  const setSelected = useGraphStore((s) => s.setSelected)

  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const data = await draftsApi.list()
      data.sort(
        (a, b) =>
          new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime(),
      )
      setDrafts(data)
      setError(null)
      setLastRefreshedAt(new Date())
      setSelectedId((prev) => {
        if (prev && data.some((d) => d.id === prev)) return prev
        return data[0]?.id ?? null
      })
    } catch (exc) {
      console.error(exc)
      setError(extractApiError(exc, 'Failed to load drafts'))
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(
    () => drafts.filter((d) => matchesDraftSearch(d, search)),
    [drafts, search],
  )

  const selected = useMemo(
    () => filtered.find((d) => d.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  )

  function viewInBrain(nodeId: string) {
    setSelected(nodeId)
    navigate('/brain/company')
  }

  async function handleDelete(id: string) {
    await draftsApi.delete(id)
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }

  function handleGenerated(draftNodeId: string) {
    void refresh(true)
    setSelectedId(draftNodeId)
    setModalOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar
        onMenuClick={onMenuClick}
        title="Drafts"
        subtitle="Admin · communications & onboarding briefs"
      />
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-5 py-4 border-b border-black/[0.06] bg-white/60 shrink-0">
          <div className="mx-auto max-w-6xl space-y-3">
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-2xl">
              Review and manage brain-generated drafts before sharing with your team. Generate
              onboarding briefs for new hires from here — they stay private until you open them in
              the graph.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors focus-ring"
              >
                <Plus className="w-4 h-4" />
                New onboarding brief
              </button>
              <span className="text-[12px] text-text-tertiary">{formatRefreshed(lastRefreshedAt)}</span>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isRefreshing}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-black/[0.04] disabled:opacity-50 transition-colors focus-ring"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drafts…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-black/[0.06] bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/25"
                aria-label="Search drafts"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto md:overflow-hidden px-5 py-5 min-h-0">
          <div className="mx-auto max-w-6xl h-full flex flex-col md:flex-row gap-4 md:min-h-0">
            {loading && (
              <div className="space-y-2 w-full md:max-w-sm">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center py-16 w-full gap-3">
                <WifiOff className="w-8 h-8 text-text-tertiary" />
                <p className="text-[13px] text-destructive">{error}</p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="w-full py-8">
                <EmptyState
                  icon={FileText}
                  title={search.trim() ? 'No matching drafts' : 'No drafts yet'}
                  description={
                    search.trim()
                      ? 'Try another search or clear the filter.'
                      : 'Generate an onboarding brief for a new team member to create your first draft.'
                  }
                  actionLabel={search.trim() ? undefined : 'New onboarding brief'}
                  onAction={search.trim() ? undefined : () => setModalOpen(true)}
                />
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                <div className="md:w-[min(340px,38%)] shrink-0 flex flex-col gap-2 md:overflow-y-auto md:max-h-full md:pr-1">
                  <p className="text-[11px] font-semibold tracking-[0.10em] text-text-tertiary uppercase px-1">
                    {filtered.length} draft{filtered.length === 1 ? '' : 's'}
                  </p>
                  {filtered.map((d) => (
                    <DraftListItem
                      key={d.id}
                      draft={d}
                      selected={(selected?.id ?? filtered[0]?.id) === d.id}
                      onSelect={() => setSelectedId(d.id)}
                    />
                  ))}
                </div>
                <div className="flex-1 min-h-[320px] md:min-h-0 md:overflow-hidden">
                  <DraftDetailPanel
                    draft={selected}
                    onViewInBrain={viewInBrain}
                    onDelete={handleDelete}
                    onCitationClick={viewInBrain}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <OnboardingBriefModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerated={handleGenerated}
      />
    </motion.div>
  )
}
