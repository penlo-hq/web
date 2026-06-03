import type { ReactNode } from 'react'
import { Card } from './Card'

type Props = { children: ReactNode; className?: string }

/** @deprecated Use Card with frosted prop instead */
export function FrostedCard({ children, className = '' }: Props) {
  return (
    <Card frosted padding="lg" className={className}>
      {children}
    </Card>
  )
}
