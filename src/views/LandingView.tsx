import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  Brain,
  GitMerge,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
})

const FEATURES = [
  {
    icon: Brain,
    title: 'Living knowledge graph',
    description: 'Every decision, feature, and conversation is captured and linked automatically into a searchable graph.',
  },
  {
    icon: Search,
    title: 'Ask anything',
    description: 'Natural language queries across your entire company history — with citations, not hallucinations.',
  },
  {
    icon: MessageSquare,
    title: 'Slack & meeting capture',
    description: 'Integrates with Slack and meeting transcripts. Context flows in without changing how your team works.',
  },
  {
    icon: Zap,
    title: 'Agent dispatch',
    description: 'The brain surfaces actionable tasks and dispatches them to AI agents or developers automatically.',
  },
  {
    icon: Activity,
    title: 'Real-time activity',
    description: 'Watch your knowledge graph evolve in real time as conversations and decisions are captured.',
  },
  {
    icon: GitMerge,
    title: 'Auto-build',
    description: 'Approved dispatches are built autonomously and opened as pull requests in your GitHub repo.',
  },
]

export function LandingView() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-text-primary">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[15px] text-text-primary tracking-[-0.01em]">Penlo</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/pricing" className="text-[14px] text-text-secondary hover:text-text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/login" className="text-[14px] text-text-secondary hover:text-text-primary transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-xl bg-accent text-white text-[14px] font-semibold hover:bg-accent/90 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
        <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-tint border border-accent-border mb-6">
          <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
          <span className="text-[12px] font-semibold text-accent">Enterprise Brain for startups</span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.05)}
          className="text-[52px] font-semibold tracking-[-0.03em] text-text-primary leading-[1.1] mb-6"
        >
          Your company's memory,<br className="hidden sm:block" /> always in context.
        </motion.h1>

        <motion.p {...fadeUp(0.1)} className="mx-auto max-w-[540px] text-[17px] text-text-secondary leading-relaxed mb-10">
          Penlo captures context from conversations, meetings, and Slack — then keeps it alive so your team never forgets why you decided what.
        </motion.p>

        <motion.div {...fadeUp(0.15)} className="flex justify-center gap-3 flex-wrap">
          <Link
            to="/signup"
            className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-[15px] hover:bg-accent/90 shadow-card-raised transition-colors"
          >
            Start for free
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-white border border-black/10 text-text-primary font-semibold text-[15px] hover:bg-black/[0.02] transition-colors"
          >
            Sign in
          </Link>
        </motion.div>

        {/* Product preview card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 rounded-2xl bg-white border border-black/[0.08] shadow-card-raised overflow-hidden"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.06] bg-[#F9F9F9]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-black/[0.12]" />
              <div className="w-3 h-3 rounded-full bg-black/[0.12]" />
              <div className="w-3 h-3 rounded-full bg-black/[0.12]" />
            </div>
            <div className="flex-1 mx-4 bg-black/[0.05] rounded-lg py-1 px-3 text-[12px] text-text-tertiary text-left">
              app.penlo.ai
            </div>
          </div>
          {/* Mock UI */}
          <div className="flex h-[360px] overflow-hidden">
            {/* Sidebar mock */}
            <div className="w-[180px] bg-[#F9F9F9] border-r border-black/[0.06] p-3 flex flex-col gap-1 shrink-0">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent-tint">
                <div className="w-3 h-3 rounded bg-accent/30" />
                <div className="h-2.5 w-20 rounded bg-accent/40" />
              </div>
              {['Company Brain', 'My Brain', 'Tasks', 'Dispatch'].map((label) => (
                <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                  <div className="w-3 h-3 rounded bg-black/[0.08]" />
                  <div className="h-2 w-16 rounded bg-black/[0.06]" />
                </div>
              ))}
            </div>
            {/* Main content mock */}
            <div className="flex-1 p-5">
              <div className="h-5 w-32 rounded bg-black/[0.08] mb-4" />
              {/* Graph nodes mock */}
              <div className="relative h-[280px]">
                {[
                  { x: 50, y: 40, size: 14, color: 'bg-blue-brain/20 border-blue-brain/40' },
                  { x: 160, y: 80, size: 10, color: 'bg-amber-brain/20 border-amber-brain/40' },
                  { x: 280, y: 50, size: 12, color: 'bg-accent/20 border-accent/40' },
                  { x: 120, y: 160, size: 11, color: 'bg-green-500/20 border-green-500/40' },
                  { x: 240, y: 180, size: 9, color: 'bg-purple-500/20 border-purple-500/40' },
                  { x: 360, y: 140, size: 13, color: 'bg-amber-brain/20 border-amber-brain/40' },
                  { x: 400, y: 60, size: 8, color: 'bg-blue-brain/20 border-blue-brain/40' },
                ].map((node, i) => (
                  <div
                    key={i}
                    className={`absolute rounded-full border-2 ${node.color}`}
                    style={{ left: node.x, top: node.y, width: node.size * 2, height: node.size * 2 }}
                  />
                ))}
                {/* Connection lines mock */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
                  <line x1="64" y1="54" x2="180" y2="90" stroke="#0053D6" strokeWidth="1" />
                  <line x1="180" y1="90" x2="304" y2="62" stroke="#0053D6" strokeWidth="1" />
                  <line x1="134" y1="172" x2="264" y2="192" stroke="#0053D6" strokeWidth="1" />
                  <line x1="64" y1="54" x2="134" y2="172" stroke="#0053D6" strokeWidth="1" />
                  <line x1="264" y1="192" x2="386" y2="154" stroke="#0053D6" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.p {...fadeUp(0)} className="text-[11px] font-semibold tracking-[0.10em] text-text-tertiary uppercase text-center mb-3">
          Built for the way startups actually work
        </motion.p>
        <motion.h2 {...fadeUp(0.05)} className="text-[32px] font-semibold tracking-[-0.02em] text-center text-text-primary mb-14">
          Everything your team knows, always accessible.
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-card-hover transition-shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-accent-tint flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-[15px] text-text-primary mb-1.5 tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          {...fadeUp(0)}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-[32px] font-semibold tracking-[-0.02em] text-text-primary mb-4">
            Ready to build your company brain?
          </h2>
          <p className="text-[16px] text-text-secondary mb-8">
            Get started in minutes. No credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-flex px-8 py-3.5 rounded-xl bg-accent text-white font-semibold text-[15px] hover:bg-accent/90 shadow-card-raised transition-colors"
          >
            Start for free
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" strokeWidth={2} />
            </div>
            <span className="text-[13px] font-semibold text-text-primary">Penlo</span>
          </div>
          <p className="text-[12px] text-text-tertiary">
            © {new Date().getFullYear()} Penlo. Enterprise Brain for startups.
          </p>
          <Link to="/pricing" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors">
            Pricing
          </Link>
        </div>
      </footer>
    </div>
  )
}
