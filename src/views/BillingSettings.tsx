import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreditCard, ExternalLink, Users, Zap } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { billingApi } from '../lib/api/endpoints'
import { useBillingStore } from '../store/billingStore'
import { useAuthStore } from '../store/authStore'
import type { BillingSnapshot } from '../types/billing'
import type { PageProps } from '../types/layout'

function UsageBar({ used, limit, label }: { used: number; limit: number | null; label: string }) {
  if (limit == null) {
    return (
      <div className="flex justify-between text-caption text-text-secondary">
        <span>{label}</span>
        <span>Unlimited</span>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  return (
    <div>
      <div className="flex justify-between text-caption text-text-secondary mb-1.5">
        <span>{label}</span>
        <span>{used} / {limit}</span>
      </div>
      <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-warning' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function BillingSettings({ onMenuClick }: PageProps) {
  const user = useAuthStore((s) => s.user)
  const setBilling = useBillingStore((s) => s.setBilling)
  const cached = useBillingStore((s) => s.billing)
  const [billing, setLocal] = useState<BillingSnapshot | null>(cached)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const checkoutSuccess = searchParams.get('checkout') === 'success'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await billingApi.status()
      setLocal(data)
      setBilling(data)
    } catch {
      setError('Could not load billing status.')
    } finally {
      setLoading(false)
    }
  }, [setBilling])

  useEffect(() => {
    load()
  }, [load])

  async function startCheckout(interval: 'month' | 'year') {
    setActionLoading('checkout')
    setError(null)
    try {
      const { checkout_url } = await billingApi.checkout(interval)
      window.location.href = checkout_url
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail === 'stripe_not_configured' ? 'Stripe is not configured yet. Contact support.' : 'Checkout failed.')
      setActionLoading(null)
    }
  }

  async function openPortal() {
    setActionLoading('portal')
    setError(null)
    try {
      const { portal_url } = await billingApi.portal()
      window.location.href = portal_url
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail === 'no_stripe_customer' ? 'Subscribe first to manage billing.' : 'Could not open billing portal.')
      setActionLoading(null)
    }
  }

  const isAdmin = user?.role === 'admin'
  const onTeam = billing?.effective_plan === 'team' || billing?.effective_plan === 'enterprise'
  const trialing = billing?.subscription_status === 'trialing'

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <TopBar title="Billing" onMenuClick={onMenuClick} />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <PageHeader
          title="Billing & plan"
          subtitle="Manage your subscription, seats, and usage limits."
        />

        {checkoutSuccess && (
          <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-caption text-success">
            Payment received — your Team plan will activate shortly.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-caption text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-caption text-text-tertiary">Loading billing…</p>
        ) : billing ? (
          <div className="space-y-6">
            <section className="rounded-card border border-border bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-caption text-text-tertiary uppercase tracking-wide">Current plan</p>
                  <h2 className="text-display-md text-text-primary mt-1">{billing.plan_label}</h2>
                  {trialing && billing.trial_ends_at && (
                    <p className="text-caption text-text-secondary mt-1">
                      Trial ends {new Date(billing.trial_ends_at).toLocaleDateString()}
                    </p>
                  )}
                  {billing.subscription_status && (
                    <p className="text-caption text-text-tertiary mt-0.5 capitalize">
                      Status: {billing.subscription_status.replace('_', ' ')}
                    </p>
                  )}
                </div>
                {onTeam && billing.billing_interval && (
                  <span className="text-caption text-text-secondary capitalize">
                    Billed {billing.billing_interval}ly · {billing.seat_quantity} seats
                  </span>
                )}
              </div>

              {!billing.stripe_configured && (
                <p className="mt-4 text-caption text-text-secondary">
                  Stripe billing is not configured in this environment. All features are available for development.
                </p>
              )}

              {isAdmin && billing.stripe_configured && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {!onTeam ? (
                    <>
                      <Button
                        size="sm"
                        loading={actionLoading === 'checkout'}
                        onClick={() => startCheckout('month')}
                      >
                        Upgrade to Team
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={actionLoading === 'checkout'}
                        onClick={() => startCheckout('year')}
                      >
                        Upgrade (annual)
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={actionLoading === 'portal'}
                      onClick={openPortal}
                    >
                      <CreditCard className="w-4 h-4 mr-1.5" aria-hidden />
                      Manage subscription
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-60" aria-hidden />
                    </Button>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-card border border-border bg-surface p-6 space-y-5">
              <h3 className="text-headline text-text-primary">Usage</h3>
              <UsageBar
                used={billing.usage.queries_used}
                limit={billing.usage.queries_limit}
                label="Brain queries this period"
              />
              <UsageBar
                used={billing.usage.user_count}
                limit={billing.usage.user_limit}
                label="Team members"
              />
            </section>

            <section className="rounded-card border border-border bg-surface p-6">
              <h3 className="text-headline text-text-primary mb-4">Included features</h3>
              <ul className="space-y-2 text-caption text-text-secondary">
                <li className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${billing.features.mcp ? 'text-success' : 'text-text-tertiary'}`} />
                  MCP for Cursor {billing.features.mcp ? '— enabled' : '— Team plan'}
                </li>
                <li className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${billing.features.slack ? 'text-success' : 'text-text-tertiary'}`} />
                  Slack integration {billing.features.slack ? '— enabled' : '— Team plan'}
                </li>
              </ul>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
