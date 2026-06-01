import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function LandingView() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Penlo</span>
        <div className="flex gap-4">
          <Link to="/pricing" className="text-sm text-graphite hover:text-ink">Pricing</Link>
          <Link to="/login" className="text-sm text-graphite hover:text-ink">Sign in</Link>
          <Link
            to="/signup"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-graphite"
          >
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-semibold tracking-tight text-ink"
        >
          Your company&apos;s memory layer
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-graphite"
        >
          Capture context from conversations, meetings, and Slack. Query it naturally.
          Keep it fresh, private, and cited — so your startup never loses why you decided what.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex justify-center gap-4"
        >
          <Link
            to="/signup"
            className="rounded-xl bg-ink px-8 py-3 text-base font-medium text-white hover:bg-graphite"
          >
            Get started free
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-mist px-8 py-3 text-base font-medium text-ink hover:bg-canvas"
          >
            Sign in
          </Link>
        </motion.div>

        <div className="mx-auto mt-24 grid max-w-3xl gap-8 text-left md:grid-cols-3">
          {[
            { title: 'Capture', desc: 'Flow iOS app + Slack ingest conversations into structured facts with human review.' },
            { title: 'Remember', desc: 'Living knowledge graph with decay, dedup, and decision lineage — not stale docs.' },
            { title: 'Query', desc: 'Ask the Brain in natural language. Get cited answers from your company context.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-mist p-6">
              <h3 className="font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-graphite">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
