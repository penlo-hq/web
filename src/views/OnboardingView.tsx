import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import type { PageProps } from '../types/layout'
import { Button, Card } from '../components/ui'

const STEPS = [
  { title: 'Connect Slack', desc: 'Ingest team conversations into your Brain automatically.', path: '/slack-settings' },
  { title: 'Connect Flow', desc: 'Generate an API key and pair the iOS capture app.', path: '/connect' },
  { title: 'Ask your first question', desc: 'Try "What do we know about our product?" in Ask Brain.', path: '/brain/ask' },
  { title: 'Explore the graph', desc: 'See your company knowledge visualized in 3D.', path: '/brain/company' },
]

export function OnboardingView({ onMenuClick }: PageProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-canvas flex flex-col"
    >
      <TopBar title="Welcome to Penlo" subtitle="Complete these steps to get started" onMenuClick={onMenuClick} />
      <div className="mx-auto max-w-2xl px-5 py-8 flex-1">
        <p className="text-body text-text-secondary">
          Your company Brain is ready. Follow these steps — most teams finish in under 10 minutes.
        </p>
        <ol className="mt-8 space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card
                padding="md"
                className="bg-canvas cursor-pointer hover:bg-surface transition-colors flex items-start gap-4"
                onClick={() => navigate(step.path)}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-caption font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium text-text-primary">{step.title}</h3>
                  <p className="mt-1 text-caption text-text-secondary">{step.desc}</p>
                </div>
                <Check className="w-4 h-4 text-accent/0 ml-auto shrink-0" />
              </Card>
            </li>
          ))}
        </ol>
        <Button variant="primary" className="mt-10" onClick={() => navigate('/brain/company')}>
          Go to Company Brain
        </Button>
      </div>
    </motion.div>
  )
}
