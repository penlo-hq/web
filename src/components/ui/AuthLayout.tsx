import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logomark } from '../brand/Logo'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-[380px]">
        {/* Penlo logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 shadow-card-raised rounded-2xl overflow-hidden">
            <Logomark size="lg" />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.10em] text-text-tertiary uppercase mb-1.5">
            Penlo
          </p>
          <h1 className="font-semibold text-[24px] text-text-primary text-center leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[14px] text-text-secondary text-center mt-2 leading-relaxed max-w-[280px]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-canvas rounded-[20px] shadow-card-raised p-6 border border-border">
          {children}
        </div>

        {footer && (
          <div className="mt-5 text-center text-[13px] text-text-secondary">
            {footer}
          </div>
        )}
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
