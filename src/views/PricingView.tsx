import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SectionLabel } from '../components/ui/SectionLabel'

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    desc: 'For founders exploring Penlo',
    features: ['Up to 3 users', 'Flow iOS capture', 'Company Brain graph', '50 queries/month'],
  },
  {
    name: 'Team',
    price: '$25',
    period: 'per user / month',
    desc: 'For startups building with context',
    features: ['Unlimited users', 'Slack integration', 'MCP for Cursor', 'Unlimited queries', 'Admin dashboard'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For teams needing SSO and SLA',
    features: ['Dedicated instance', 'SSO / SAML', 'Custom integrations', 'Priority support'],
  },
]

export function PricingView() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/"><SectionLabel>Penlo</SectionLabel></Link>
        <Link to="/signup">
          <Button variant="primary" size="sm">Start free</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-center text-[32px] font-semibold text-text-primary">Simple pricing for startups</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-body text-text-secondary">
          Start free. Upgrade when your team needs Slack, MCP, and unlimited queries.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-card p-8 hairline-border ${
                plan.highlighted ? 'border-accent-border bg-accent-tint/30 shadow-card' : 'bg-surface'
              }`}
            >
              <h2 className="text-headline text-text-primary">{plan.name}</h2>
              <p className="mt-1 text-caption text-text-secondary">{plan.desc}</p>
              <p className="mt-6 text-[28px] font-semibold text-text-primary">{plan.price}</p>
              {plan.period && <p className="text-caption text-text-secondary">{plan.period}</p>}
              <ul className="mt-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-caption text-text-secondary">✓ {f}</li>
                ))}
              </ul>
              <Link to="/signup" className="block mt-8">
                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full"
                >
                  {plan.name === 'Enterprise' ? 'Contact us' : 'Get started'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
