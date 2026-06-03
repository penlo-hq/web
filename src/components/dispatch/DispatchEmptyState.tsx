import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Inbox, GitBranch } from 'lucide-react'
import { EmptyState } from '../ui/EmptyState'
import type { DispatchInboxFilter } from './types'

type Props = {
  filter: DispatchInboxFilter
}

function emptyCopy(filter: DispatchInboxFilter): { title: string; description: string; icon: typeof Inbox } {
  switch (filter) {
    case 'inbox':
      return {
        icon: Inbox,
        title: 'Inbox clear',
        description:
          'When the brain proposes features or tasks from Flow sync or ingest, they appear here for approval. High-confidence work (about 80%+) triggers a dispatch; cards expire after 7 days.',
      }
    case 'active':
      return {
        icon: GitBranch,
        title: 'Nothing in progress',
        description: 'Approved and building dispatches show up here while work runs.',
      }
    case 'done':
      return {
        icon: CheckCircle2,
        title: 'No finished dispatches',
        description: 'Completed PRs and failed builds appear here.',
      }
    case 'all':
    default:
      return {
        icon: Inbox,
        title: 'No dispatches yet',
        description:
          'Sync memories to Enterprise Brain — high-importance features and tasks become dispatch cards.',
      }
  }
}

export function DispatchEmptyState({ filter }: Props) {
  const navigate = useNavigate()
  const { title, description, icon } = emptyCopy(filter)

  return (
    <EmptyState icon={icon} title={title} description={description}>
      {(filter === 'inbox' || filter === 'all') && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
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
            className="px-4 py-2 rounded-xl border border-black/10 text-text-primary text-[13px] font-medium hover:bg-black/[0.03] transition-colors"
          >
            View Timeline
          </button>
        </div>
      )}
    </EmptyState>
  )
}
