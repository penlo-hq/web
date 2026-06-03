import type { ReactNode } from 'react'
import { Card } from './Card'
import { SectionLabel } from './SectionLabel'

type Props = {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({ title, description, children }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <SectionLabel>{title}</SectionLabel>
        {description && (
          <p className="text-caption text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <Card padding="lg" className="bg-canvas space-y-4">
        {children}
      </Card>
    </section>
  )
}
