import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import type { Task, TaskStatus } from '../types/graph'
import { tasksApi } from '../lib/api/endpoints'
import { extractApiError } from '../lib/api/errors'
import { TopBar } from '../components/layout/TopBar'
import { useGraphStore } from '../store/graphStore'
import { CardSkeleton } from '../components/ui'
import { TaskFilterBar } from '../components/tasks/TaskFilterBar'
import { TasksToolbar } from '../components/tasks/TasksToolbar'
import { TasksEmptyState } from '../components/tasks/TasksEmptyState'
import { TaskRow } from '../components/tasks/TaskRow'
import { filterTasks, countByFilter } from '../components/tasks/taskFilters'
import { matchesSearch } from '../components/tasks/taskStatus'
import type { TaskInboxFilter } from '../components/tasks/types'
import type { PageProps } from '../types/layout'

export function Tasks({ onMenuClick }: PageProps) {
  const navigate = useNavigate()
  const setSelected = useGraphStore((s) => s.setSelected)

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [filter, setFilter] = useState<TaskInboxFilter>('active')
  const [search, setSearch] = useState('')
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const data = await tasksApi.list()
      setTasks(data)
      setError(null)
      setLastRefreshedAt(new Date())
    } catch (exc) {
      console.error(exc)
      setError(extractApiError(exc, 'Failed to load tasks'))
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const counts = useMemo(() => countByFilter(tasks), [tasks])

  const displayTasks = useMemo(() => {
    let list = filterTasks(tasks, filter)
    if (search.trim()) {
      list = list.filter((t) => matchesSearch(t, search))
    }
    return list
  }, [tasks, filter, search])

  const activeCount = counts.active

  async function handleStatusChange(id: string, newStatus: TaskStatus) {
    const prev = tasks.find((t) => t.id === id)
    if (!prev) return
    const oldStatus = prev.status

    setTasks((t) => t.map((item) => (item.id === id ? { ...item, status: newStatus } : item)))
    setActionErrors((e) => {
      const next = { ...e }
      delete next[id]
      return next
    })

    try {
      const updated = await tasksApi.patch(id, { status: newStatus })
      setTasks((t) => t.map((item) => (item.id === id ? updated : item)))
    } catch (exc) {
      setTasks((t) => t.map((item) => (item.id === id ? { ...item, status: oldStatus } : item)))
      const msg = extractApiError(exc, "Couldn't update task.")
      setActionErrors((e) => ({ ...e, [id]: msg }))
    }
  }

  function viewInBrain(nodeId: string) {
    setSelected(nodeId)
    navigate('/brain/company')
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
        title="Tasks"
        subtitle="Action items from your company brain"
      />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto max-w-3xl space-y-4">
          <TasksToolbar
            activeCount={activeCount}
            search={search}
            onSearchChange={setSearch}
            isRefreshing={isRefreshing}
            lastRefreshedAt={lastRefreshedAt}
            onRefresh={() => void refresh()}
          />

          <TaskFilterBar filter={filter} onChange={setFilter} counts={counts} />

          {error && !loading && (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <WifiOff className="w-8 h-8 text-text-tertiary" strokeWidth={1.5} />
              <p className="text-[13px] text-destructive max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90"
              >
                Try again
              </button>
            </div>
          )}

          {!error && (
            <>
              {loading && (
                <div className="space-y-2">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              )}

              {!loading && displayTasks.length === 0 && (
                <TasksEmptyState filter={filter} hasSearch={Boolean(search.trim())} />
              )}

              {!loading && displayTasks.length > 0 && (
                <div className="space-y-2">
                  {displayTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      actionError={actionErrors[task.id]}
                      onStatusChange={(id, status) => void handleStatusChange(id, status)}
                      onViewInBrain={viewInBrain}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
