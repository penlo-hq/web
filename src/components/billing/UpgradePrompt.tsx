import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'

type Props = {
  title?: string
  message: string
  feature?: string
}

export function UpgradePrompt({ title = 'Upgrade to Team', message, feature }: Props) {
  return (
    <div
      className="rounded-card border border-accent-border bg-accent-tint/40 p-6 text-center"
      role="alert"
      data-feature={feature}
    >
      <Sparkles className="mx-auto mb-3 h-8 w-8 text-accent" aria-hidden />
      <h3 className="text-headline text-text-primary">{title}</h3>
      <p className="mt-2 text-caption text-text-secondary max-w-md mx-auto">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link to="/admin/billing">
          <Button size="sm">View billing</Button>
        </Link>
        <Link to="/pricing">
          <Button size="sm" variant="secondary">Compare plans</Button>
        </Link>
      </div>
    </div>
  )
}
