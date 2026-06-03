import { Button } from './Button'
import { Card } from './Card'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/35"
      role="dialog"
      aria-modal
      aria-labelledby="confirm-title"
    >
      <Card shadow className="w-full max-w-sm bg-canvas !p-5">
        <h2 id="confirm-title" className="text-headline text-text-primary mb-2">
          {title}
        </h2>
        <p className="text-caption text-text-secondary mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
