import { AlertCircle, X } from 'lucide-react'

type Props = {
  message: string
  onDismiss: () => void
}

export function ActionErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200/80 max-w-3xl">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-[13px] text-text-primary flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-md text-text-tertiary hover:text-text-primary focus-ring"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
