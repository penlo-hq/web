import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  Brain,
  Check,
  GitMerge,
  Lock,
  MessageSquare,
  Search,
  Shield,
  Zap,
} from 'lucide-react'
import { Logo } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'

const fadeUp = (delay = 0, reduced = false) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      }

const FEATURES = [
  { icon: Brain, title: 'Living knowledge graph', description: 'Every decision, feature, and conversation is captured and linked automatically into a searchable graph.' },
  { icon: Search, title: 'Ask anything', description: 'Natural language queries across your entire company history — with citations, not hallucinations.' },
  { icon: MessageSquare, title: 'Slack & meeting capture', description: 'Integrates with Slack and meeting transcripts. Context flows in without changing how your team works.' },
  { icon: Zap, title: 'Agent dispatch', description: 'The brain surfaces actionable tasks and dispatches them to AI agents or developers automatically.' },
  { icon: Activity, title: 'Real-time activity', description: 'Watch your knowledge graph evolve in real time as conversations and decisions are captured.' },
  { icon: GitMerge, title: 'Auto-build', description: 'Approved dispatches are built autonomously and opened as pull requests in your GitHub repo.' },
]

const STEPS = [
  { step: '01', title: 'Capture', description: 'Flow, Slack, and meeting capture feed voice notes and decisions into Penlo automatically.' },
  { step: '02', title: 'Connect', description: 'Penlo links people, decisions, and features into a living company graph you can explore.' },
  { step: '03', title: 'Act', description: 'Ask Brain, approve dispatches, and let agents open PRs grounded in your real context.' },
]

const INTEGRATIONS = ['Slack', 'GitHub', 'Linear', 'Google Meet', 'Zoom', 'Cursor MCP']

const FAQ = [
  { q: 'How is Penlo different from a wiki or Notion?', a: 'Penlo captures context passively from how your team already works — standups, Slack, meetings — and keeps it linked in a graph with citations. You ask questions; you do not maintain docs.' },
  { q: 'Is our data private?', a: 'Yes. Each company gets an isolated knowledge graph with role-based access, team scoping, and encryption in transit and at rest.' },
  { q: 'Do we need to change our workflow?', a: 'No. Penlo integrates with Slack, your IDE via MCP, and optional meeting capture. The graph builds while you work.' },
]

const SOCIAL_PROOF = [
  'Built for seed-stage teams who move fast',
  'Used by engineering-led startups',
  'Designed for context that compounds',
]

function ProductPreview() {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-border shadow-card-raised overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
        <div className="flex gap-1.5" aria-hidden>
          <div className="w-3 h-3 rounded-full bg-neutral-300" />
          <div className="w-3 h-3 rounded-full bg-neutral-300" />
          <div className="w-3 h-3 rounded-full bg-neutral-300" />
        </div>
        <div className="flex-1 mx-4 bg-canvas rounded-lg py-1 px-3 text-caption text-text-tertiary text-left border border-border">
          app.penlo.ai/brain/company
        </div>
      </div>
      <div className="flex min-h-[360px]">
        <aside className="w-[200px] bg-surface border-r border-border p-3 hidden sm:flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-accent-tint text-accent text-caption-sm font-semibold">
            <Brain className="w-3.5 h-3.5" aria-hidden />
            Company Brain
          </div>
          {['Ask Brain', 'Timeline', 'Dispatch'].map((label) => (
            <div key={label} className="px-2 py-1.5 text-caption text-text-secondary">{label}</div>
          ))}
        </aside>
        <div className="flex-1 p-6 bg-canvas relative overflow-hidden">
          <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase mb-2">Live graph</p>
          <p className="text-headline text-text-primary mb-4">47 active nodes · 12 decisions</p>
          <div className="relative h-[240px]">
            {[
              { x: 40, y: 30, label: 'Auth pipeline', type: 'decision' },
              { x: 180, y: 60, label: 'Realtime presence', type: 'feature' },
              { x: 320, y: 40, label: 'Sanjoy', type: 'person' },
              { x: 120, y: 150, label: 'CoreBluetooth', type: 'architecture' },
              { x: 280, y: 170, label: 'Q2 roadmap', type: 'topic' },
            ].map((node, i) => (
              <div
                key={i}
                className="absolute px-2.5 py-1 rounded-full text-caption-sm font-medium border border-accent-border bg-accent-tint text-accent whitespace-nowrap"
                style={{ left: node.x, top: node.y }}
              >
                {node.label}
              </div>
            ))}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
              <line x1="120" y1="45" x2="220" y2="75" stroke="var(--color-accent)" strokeOpacity="0.25" strokeWidth="1" />
              <line x1="220" y1="75" x2="340" y2="55" stroke="var(--color-accent)" strokeOpacity="0.25" strokeWidth="1" />
              <line x1="120" y1="45" x2="160" y2="165" stroke="var(--color-accent)" strokeOpacity="0.25" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingView() {
  const reduced = useReducedMotion()

  return (
    <div className="min-h-screen bg-surface-muted text-text-primary">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" aria-label="Penlo home">
          <Logo size="md" />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
          <Link to="/pricing" className="text-body text-text-secondary hover:text-text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/login" className="text-body text-text-secondary hover:text-text-primary transition-colors hidden sm:inline">
            Sign in
          </Link>
          <Link to="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pt-12 sm:pt-16 pb-16 text-center">
          <motion.div {...fadeUp(0, !!reduced)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-tint border border-accent-border mb-6">
            <span className="text-caption font-semibold text-accent">Enterprise Brain for startups</span>
          </motion.div>

          <motion.h1 {...fadeUp(0.05, !!reduced)} className="text-display-xl sm:text-[3.25rem] font-semibold text-text-primary leading-[1.1] mb-6 max-w-3xl mx-auto">
            Your company&apos;s memory, always in context.
          </motion.h1>

          <motion.p {...fadeUp(0.1, !!reduced)} className="mx-auto max-w-[540px] text-body sm:text-[17px] text-text-secondary leading-relaxed mb-10">
            Penlo captures context from conversations, meetings, and Slack — then keeps it alive so your team never forgets why you decided what.
          </motion.p>

          <motion.div {...fadeUp(0.15, !!reduced)} className="flex justify-center gap-3 flex-wrap">
            <Link to="/signup">
              <Button size="lg">Start for free</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Sign in</Button>
            </Link>
          </motion.div>

          <motion.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] } })}
            className="mt-16"
          >
            <ProductPreview />
          </motion.div>
        </section>

        {/* Social proof */}
        <section className="border-y border-border bg-canvas py-8">
          <div className="mx-auto max-w-4xl px-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {SOCIAL_PROOF.map((line) => (
              <p key={line} className="text-caption text-text-secondary flex items-center gap-2">
                <Check className="w-4 h-4 text-success shrink-0" aria-hidden />
                {line}
              </p>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase text-center mb-3">How it works</p>
          <h2 className="text-display-md text-center text-text-primary mb-14">From capture to action in three steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <span className="text-display-md font-semibold text-accent/30">{s.step}</span>
                <h3 className="text-headline text-text-primary mt-2 mb-2">{s.title}</h3>
                <p className="text-caption text-text-secondary leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 py-20 bg-canvas rounded-t-3xl border-t border-border">
          <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase text-center mb-3">
            Built for the way startups actually work
          </p>
          <h2 className="text-display-md text-center text-text-primary mb-14">
            Everything your team knows, always accessible.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="bg-surface rounded-2xl p-5 border border-border hover:shadow-card-hover transition-shadow">
                  <div className="w-9 h-9 rounded-xl bg-accent-tint flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-accent" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="font-semibold text-body text-text-primary mb-1.5">{feature.title}</h3>
                  <p className="text-caption text-text-secondary leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Integrations + Security */}
        <section className="mx-auto max-w-5xl px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-display-md text-text-primary mb-4">Works where you work</h2>
            <p className="text-body text-text-secondary mb-6">Connect the tools your team already uses. No rip-and-replace.</p>
            <div className="flex flex-wrap gap-2">
              {INTEGRATIONS.map((name) => (
                <span key={name} className="px-3 py-1.5 rounded-full bg-surface border border-border text-caption font-medium text-text-secondary">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-display-md text-text-primary mb-4">Enterprise-grade trust</h2>
            <ul className="space-y-4">
              {[
                { icon: Lock, text: 'Role-based access and team-scoped private nodes' },
                { icon: Shield, text: 'Isolated company graphs with encrypted transport' },
                { icon: Check, text: 'Audit trail via Timeline — replay how decisions evolved' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-body text-text-secondary">
                  <Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-6 py-20">
          <h2 className="text-display-md text-center text-text-primary mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-border bg-canvas p-5">
                <summary className="font-semibold text-body text-text-primary cursor-pointer list-none flex justify-between items-center focus-ring rounded-lg">
                  {item.q}
                  <span className="text-text-tertiary group-open:rotate-45 transition-transform text-xl leading-none" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-caption text-text-secondary leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-accent-tint border-t border-accent-border">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-md text-text-primary mb-4">Ready to build your company brain?</h2>
            <p className="text-body text-text-secondary mb-8">Get started in minutes. No credit card required.</p>
            <Link to="/signup">
              <Button size="lg">Start for free</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-canvas py-12 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" />
            <p className="mt-3 text-caption text-text-secondary max-w-[200px]">Enterprise Brain for startups.</p>
          </div>
          <div>
            <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase mb-3">Product</p>
            <ul className="space-y-2 text-caption text-text-secondary">
              <li><Link to="/pricing" className="hover:text-text-primary">Pricing</Link></li>
              <li><Link to="/signup" className="hover:text-text-primary">Get started</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase mb-3">Account</p>
            <ul className="space-y-2 text-caption text-text-secondary">
              <li><Link to="/login" className="hover:text-text-primary">Sign in</Link></li>
              <li><Link to="/signup" className="hover:text-text-primary">Create account</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-caption-sm font-semibold tracking-section text-text-tertiary uppercase mb-3">Legal</p>
            <ul className="space-y-2 text-caption text-text-secondary">
              <li><span>Privacy</span></li>
              <li><span>Terms</span></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl pt-8 border-t border-border text-caption text-text-tertiary text-center">
          © {new Date().getFullYear()} Penlo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
