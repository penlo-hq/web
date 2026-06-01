import { Link } from 'react-router-dom'

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
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-xl font-semibold tracking-tight text-ink">Penlo</Link>
        <Link to="/signup" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Start free</Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-center text-4xl font-semibold text-ink">Simple pricing for startups</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-graphite">
          Start free. Upgrade when your team needs Slack, MCP, and unlimited queries.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${plan.highlighted ? 'border-ink shadow-lg' : 'border-mist'}`}
            >
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-graphite">{plan.desc}</p>
              <p className="mt-6 text-3xl font-semibold">{plan.price}</p>
              {plan.period && <p className="text-sm text-graphite">{plan.period}</p>}
              <ul className="mt-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-graphite">✓ {f}</li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-medium ${
                  plan.highlighted
                    ? 'bg-ink text-white hover:bg-graphite'
                    : 'border border-mist text-ink hover:bg-canvas'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Contact us' : 'Get started'}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
