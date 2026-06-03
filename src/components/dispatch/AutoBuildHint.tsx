import { Info } from 'lucide-react'

type Props = {
  message: string
}

export function AutoBuildHint({ message }: Props) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-accent/[0.08] border border-accent/15 max-w-3xl">
      <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-[13px] text-text-secondary leading-relaxed">{message}</p>
    </div>
  )
}
