import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { TopBar } from '../components/layout/TopBar'
import type { PageProps } from '../types/layout'

const STEPS = [
  {
    id: 'slack',
    title: 'Connect Slack',
    desc: 'Ingest team conversations into your Brain automatically.',
    path: '/slack-settings',
    adminOnly: true,
  },
  {
    id: 'connect',
    title: 'Connect the Flow app',
    desc: 'Generate an API key and pair the iOS capture app.',
    path: '/connect',
  },
  {
    id: 'ask',
    title: 'Ask your first question',
    desc: 'Try "What do we know about our product?" in Ask Brain.',
    path: '/brain/ask',
  },
  {
    id: 'explore',
    title: 'Explore the knowledge graph',
    desc: "See your company's decisions and features visualized live.",
    path: '/brain/company',
  },
]

function useOnboardingState(userId: string) {
  const key = `penlo_onboarding_${userId}`
  const raw = localStorage.getItem(key)
  const completed: Set<string> = new Set(raw ? JSON.parse(raw) : [])

  function toggle(stepId: string) {
    if (completed.has(stepId)) {
      completed.delete(stepId)
    } else {
      completed.add(stepId)
    }
    localStorage.setItem(key, JSON.stringify([...completed]))
  }

  return { completed, toggle }
}

export function OnboardingView({ onMenuClick }: PageProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { completed, toggle } = useOnboardingState(user?.id ?? 'anon')

  const visibleSteps = STEPS.filter((s) => !s.adminOnly || user?.role === 'admin')
  const completedCount = visibleSteps.filter((s) => completed.has(s.id)).length
  const progress = visibleSteps.length > 0 ? (completedCount / visibleSteps.length) * 100 : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-screen bg-canvas">
      <TopBar title="Get started" subtitle={`${completedCount} of ${visibleSteps.length} steps done`} onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-5 py-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] text-text-secondary">Setup progress</p>
              <p className="text-[13px] font-semibold text-accent">{Math.round(progress)}%</p>
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {progress === 100 && (
            <div className="mb-5 px-4 py-3.5 rounded-2xl bg-success-tint border border-success/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <p className="text-[13px] text-success font-medium">You're all set! Your Brain is ready to use.</p>
            </div>
          )}

          <ol className="space-y-2.5">
            {visibleSteps.map((step, i) => {
              const done = completed.has(step.id)
              return (
                <li key={step.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    done
                      ? 'bg-success-tint border-success/20'
                      : 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-card'
                  }`}>
                    {/* Check toggle */}
                    <button
                      type="button"
                      onClick={() => toggle(step.id)}
                      className={`shrink-0 mt-0.5 transition-colors focus-ring rounded-full ${
                        done ? 'text-success' : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                      aria-label={done ? 'Mark as not done' : 'Mark as done'}
                    >
                      {done
                        ? <CheckCircle2 className="w-5 h-5" />
                        : <Circle className="w-5 h-5" strokeWidth={1.5} />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-medium leading-snug ${done ? 'text-success line-through' : 'text-text-primary'}`}>
                        {step.title}
                      </p>
                      <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>

                    {/* Open button */}
                    {!done && (
                      <button
                        type="button"
                        onClick={() => navigate(step.path)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent/90 transition-colors"
                      >
                        Open
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 pt-5 border-t border-black/[0.06]">
            <button
              onClick={() => {
                try {
                  localStorage.setItem('penlo.web.onboarding.completed', '1')
                } catch {
                  // ignore
                }
                navigate('/brain/company')
              }}
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-[14px] hover:bg-accent/90 transition-colors"
            >
              Go to Company Brain →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
