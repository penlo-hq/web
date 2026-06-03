import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { LiquidOrb } from '../components/ui/LiquidOrb'
import { SectionLabel } from '../components/ui/SectionLabel'

export function LandingView() {
  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <SectionLabel>Penlo</SectionLabel>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-caption text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
          <Link to="/login" className="text-caption text-text-secondary hover:text-text-primary transition-colors">Sign in</Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <LiquidOrb size={88} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-[40px] font-semibold tracking-tight text-text-primary"
        >
          Your company&apos;s memory layer
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-body text-text-secondary"
        >
          Capture context from conversations, meetings, and Slack. Query it naturally.
          Keep it fresh, private, and cited — so your startup never loses why you decided what.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10 flex justify-center gap-3 flex-wrap"
        >
          <Link to="/signup">
            <Button variant="primary" size="lg">Get started free</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">Sign in</Button>
          </Link>
        </motion.div>

        <div className="mx-auto mt-24 grid max-w-3xl gap-5 text-left md:grid-cols-3">
          {[
            { title: 'Capture', desc: 'Flow iOS app + Slack ingest conversations into structured facts with human review.' },
            { title: 'Remember', desc: 'Living knowledge graph with decay, dedup, and decision lineage — not stale docs.' },
            { title: 'Query', desc: 'Ask the Brain in natural language. Get cited answers from your company context.' },
          ].map((f) => (
            <div key={f.title} className="rounded-card bg-surface hairline-border p-5 shadow-card">
              <h3 className="font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-2 text-caption text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
