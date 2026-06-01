import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'

const STEPS = [
  { title: 'Connect Slack', desc: 'Ingest team conversations into your Brain automatically.', path: '/slack-settings' },
  { title: 'Connect Flow', desc: 'Generate an API key and pair the iOS capture app.', path: '/connect' },
  { title: 'Ask your first question', desc: 'Try "What do we know about our product?" in Ask the Brain.', path: '/brain/ask' },
  { title: 'Explore the graph', desc: 'See your company knowledge visualized in 3D.', path: '/brain/company' },
]

export function OnboardingView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="Welcome to Penlo" subtitle="Complete these steps to get the most from your Brain" />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-graphite">
          Your company Brain is ready. Follow these steps — most teams finish in under 10 minutes.
        </p>
        <ol className="mt-8 space-y-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex cursor-pointer items-start gap-4 rounded-xl border border-mist p-5 hover:border-ink/20"
              onClick={() => navigate(step.path)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-graphite">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => navigate('/brain/company')}
          className="mt-10 rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white hover:bg-graphite"
        >
          Go to Company Brain
        </button>
      </div>
    </div>
  )
}
