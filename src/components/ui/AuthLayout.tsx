import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LiquidOrb } from './LiquidOrb'
import { SectionLabel } from './SectionLabel'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <LiquidOrb size={72} className="mb-4" />
          <SectionLabel className="mb-1">Penlo</SectionLabel>
          <h1 className="font-display font-semibold text-[22px] text-text-primary tracking-tight text-center">
            {title}
          </h1>
          {subtitle && (
            <p className="text-caption text-text-secondary text-center mt-2">{subtitle}</p>
          )}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-caption text-text-secondary">{footer}</div>}
      </div>
    </div>
  )
}

export function AuthFooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-accent font-medium hover:underline underline-offset-2">
      {children}
    </Link>
  )
}
