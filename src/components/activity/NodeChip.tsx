import { useNavigate } from 'react-router-dom'
import { useGraphStore } from '../../store/graphStore'
import { NODE_TYPE_LABEL, type NodeType } from '../../types/graph'

type Props = { nodeId: string }

export function NodeChip({ nodeId }: Props) {
  const node = useGraphStore((s) => s.nodes.get(nodeId))
  const setSelected = useGraphStore((s) => s.setSelected)
  const navigate = useNavigate()

  if (!node) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-text-secondary/10 text-[10.5px] text-text-secondary">
        unknown
      </span>
    )
  }

  function onClick() {
    setSelected(nodeId)
    navigate('/brain/company')
  }

  const label = NODE_TYPE_LABEL[node.type as NodeType] ?? node.type

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-text-secondary/10 hover:border-accent/30 transition-colors text-[10.5px] text-text-primary"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-text-secondary" />
      <span className="font-medium">{node.label}</span>
      <span className="text-text-secondary">{label}</span>
    </button>
  )
}
