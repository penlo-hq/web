import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, ListTodo } from 'lucide-react'
import { EmptyState } from '../ui/EmptyState'
import type { TaskInboxFilter } from './types'

function emptyCopy(filter: TaskInboxFilter): { title: string; description: string; icon: typeof ClipboardList } {
  switch (filter) {
    case 'active':
    case 'pending':
      return {
        icon: ListTodo,
        title: 'Inbox clear',
        description:
          'Tasks appear when Flow sync or ingest creates task nodes in your company brain. High-signal work is extracted as actionable items you can track here.',
      }
    case 'running':
      return {
        icon: ClipboardList,
        title: 'Nothing in progress',
        description: 'Mark a to-do task as in progress when you start working on it.',
      }
    case 'completed':
      return {
        icon: CheckCircle2,
        title: 'No completed tasks',
        description: 'Finished tasks move here when you mark them done.',
      }
    case 'failed':
      return {
        icon: ClipboardList,
        title: 'No failed tasks',
        description: 'Tasks marked failed or blocked will appear in this tab.',
      }
    case 'all':
    default:
      return {
        icon: ClipboardList,
        title: 'No tasks yet',
        description:
          'Action items from meetings, Flow, and integrations become task nodes in the graph.',
      }
  }
}

type Props = {
  filter: TaskInboxFilter
  hasSearch: boolean
}

export function TasksEmptyState({ filter, hasSearch }: Props) {
  const navigate = useNavigate()
  const { title, description, icon } = hasSearch
    ? {
        icon: ClipboardList,
        title: 'No matches',
        description: 'Try a different search term or clear the filter.',
      }
    : emptyCopy(filter)

  return (
    <EmptyState icon={icon} title={title} description={description}>
      {!hasSearch && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/brain/company')}
            className="px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors"
          >
            Open Company Brain
          </button>
          <button
            type="button"
            onClick={() => navigate('/timeline')}
            className="px-4 py-2 rounded-xl border border-black/[0.10] text-text-primary text-[13px] font-medium hover:bg-black/[0.03] transition-colors"
          >
            View Timeline
          </button>
          <button
            type="button"
            onClick={() => navigate('/brain/ask')}
            className="px-4 py-2 rounded-xl border border-black/[0.10] text-text-primary text-[13px] font-medium hover:bg-black/[0.03] transition-colors"
          >
            Ask Brain
          </button>
        </div>
      )}
    </EmptyState>
  )
}
