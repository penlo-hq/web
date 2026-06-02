import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import type { Task } from '../types/graph'
import { tasksApi } from '../lib/api/endpoints'
import { StatusPill } from '../components/ui/StatusPill'
import { TopBar } from '../components/layout/TopBar'
import type { PageProps } from '../types/layout'
import { Card, CardSkeleton, EmptyState } from '../components/ui'

export function Tasks({ onMenuClick }: PageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tasksApi.list()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusVariant = (t: Task) => {
    const s = t.status ?? 'pending'
    if (s === 'running') return 'running'
    if (s === 'completed') return 'completed'
    if (s === 'failed') return 'failed'
    return 'pending'
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen bg-canvas">
      <TopBar onMenuClick={onMenuClick} title="Tasks" subtitle="All action items" />
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading && (
          <div className="space-y-2 max-w-2xl">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {!loading && tasks.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No tasks yet"
            description="Start a conversation to generate action items."
          />
        )}
        <div className="space-y-2 max-w-2xl">
          {tasks.map((task) => (
            <Card key={task.id} padding="md" className="bg-canvas flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{task.label}</p>
                {task.detail && <p className="text-caption text-text-secondary mt-0.5 truncate">{task.detail}</p>}
              </div>
              <StatusPill label={statusVariant(task)} variant={statusVariant(task)} />
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
