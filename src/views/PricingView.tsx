import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Logo } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'
import { billingApi } from '../lib/api/endpoints'
import { useAuthStore } from '../store/authStore'
import { useBillingStore } from '../store/billingStore'
import type { BillingPlanDTO } from '../types/billing'

const FALLBACK_PLANS: BillingPlanDTO[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly_price_display: '$0',
    annual_price_display: '$0',
    features: ['Up to 3 users', 'Flow iOS capture', 'Company Brain graph', '50 queries/month'],
  },
  {
    id: 'team',
    name: 'Team',
    monthly_price_display: '$25',
    annual_price_display: '$20',
    per_seat: true,
    features: ['Unlimited users', 'Slack integration', 'MCP for Cursor', 'Unlimited queries', 'Admin dashboard'],
    checkout_intervals: ['month', 'year'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    contact_sales: true,
    features: ['Dedicated instance', 'SSO / SAML', 'Custom integrations', 'Priority support'],
  },
]

const FAQ = [
  { q: 'Can I switch plans later?', a: 'Yes. Upgrade or downgrade anytime from Billing in your admin dashboard.' },
  { q: 'What counts as a query?', a: 'Each Ask Brain natural-language question counts as one query on Starter.' },
  { q: 'Is there a free trial for Team?', a: 'Starter is free forever. Team includes a 14-day trial when you upgrade.' },
]

export function PricingView() {
  const [annual, setAnnual] = useState(false)
  const [plans, setPlans] = useState<BillingPlanDTO[]>(FALLBACK_PLANS)
  const [stripeReady, setStripeReady] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const billing = useBillingStore((s) => s.billing)
  const navigate = useNavigate()

  useEffect(() => {
    billingApi.plans().then((data) => {
      if (data.plans?.length) setPlans(data.plans)
      setStripeReady(data.stripe_configured)
    }).catch(() => {})
  }, [])

  async function handleTeamCheckout() {
    if (!user) {
      navigate('/signup')
      return
    }
    if (user.role !== 'admin') {
      navigate('/admin/billing')
      return
    }
    if (!stripeReady) {
      navigate('/admin/billing')
      return
    }
    setCheckoutLoading(true)
    try {
      const { checkout_url } = await billingApi.checkout(annual ? 'year' : 'month')
      if (!checkout_url.startsWith('https://')) throw new Error('invalid_url')
      window.location.href = checkout_url
    } catch {
      navigate('/admin/billing')
    } finally {
      setCheckoutLoading(false)
    }
  }

  function ctaFor(plan: BillingPlanDTO) {
    if (plan.contact_sales) {
      return (
        <a href="mailto:hello@penlo.ai?subject=Penlo%20Enterprise">
          <Button variant="secondary" size="md" className="w-full">Contact us</Button>
        </a>
      )
    }
    if (plan.id === 'starter') {
      return (
        <Link to={user ? '/brain/company' : '/signup'} className="block">
          <Button variant="secondary" size="md" className="w-full">
            {user ? 'Current workspace' : 'Start free'}
          </Button>
        </Link>
      )
    }
    if (plan.id === 'team') {
      const onTeam = billing?.effective_plan === 'team' || billing?.effective_plan === 'enterprise'
      if (onTeam) {
        return (
          <Link to="/admin/billing" className="block">
            <Button variant="secondary" size="md" className="w-full">Manage plan</Button>
          </Link>
        )
      }
      return (
        <Button
          variant="primary"
          size="md"
          className="w-full"
          loading={checkoutLoading}
          onClick={handleTeamCheckout}
        >
          {user ? 'Upgrade to Team' : 'Start free, upgrade later'}
        </Button>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 border-b border-border">
        <Link to="/" aria-label="Penlo home">
          <Logo size="md" />
        </Link>
        <Link to={user ? '/brain/company' : '/signup'}>
          <Button size="sm">{user ? 'Open app' : 'Start free'}</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-display-lg text-center text-text-primary">Simple pricing for startups</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-body text-text-secondary">
          Start free on Starter. Upgrade to Team for Slack, MCP, and unlimited queries — billed per seat through Stripe.
        </p>

        <div className="mt-10 flex justify-center items-center gap-3">
          <span className={`text-caption font-medium ${!annual ? 'text-text-primary' : 'text-text-tertiary'}`}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual billing"
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-7 rounded-full transition-colors focus-ring ${annual ? 'bg-accent' : 'bg-neutral-300'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-subtle transition-transform ${annual ? 'translate-x-5' : ''}`} />
          </button>
          <span className={`text-caption font-medium ${annual ? 'text-text-primary' : 'text-text-tertiary'}`}>
            Annual <span className="text-success">(save 20%)</span>
          </span>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = annual ? plan.annual_price_display : plan.monthly_price_display
            const highlighted = plan.id === 'team'
            return (
              <div
                key={plan.id}
                className={`rounded-card p-8 border ${
                  highlighted
                    ? 'border-accent-border bg-accent-tint/30 shadow-card-raised'
                    : 'border-border bg-surface'
                }`}
              >
                <h2 className="text-headline text-text-primary">{plan.name}</h2>
                {plan.per_seat && (
                  <p className="text-caption text-text-tertiary">per user / month</p>
                )}
                <p className="mt-6 text-display-md text-text-primary">{price ?? 'Custom'}</p>
                {plan.id === 'starter' && <p className="text-caption text-text-secondary">forever</p>}
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-caption text-text-secondary">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">{ctaFor(plan)}</div>
              </div>
            )
          })}
        </div>

        <section className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-display-md text-center text-text-primary mb-8">Pricing FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="rounded-2xl border border-border bg-surface p-5">
                <summary className="font-semibold text-body text-text-primary cursor-pointer list-none focus-ring rounded-lg">
                  {item.q}
                </summary>
                <p className="mt-3 text-caption text-text-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6 text-center text-caption text-text-tertiary">
        <Link to="/" className="hover:text-text-secondary">← Back to home</Link>
      </footer>
    </div>
  )
}
