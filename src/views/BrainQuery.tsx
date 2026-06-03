import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowUpCircle, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { queryApi } from '../lib/api/endpoints'
import { useGraphStore } from '../store/graphStore'
import type { Citation, Contradiction, QueryResult } from '../types/graph'
import { NODE_TYPE_LABEL } from '../types/graph'
import { LiquidOrb, Spinner } from '../components/ui'

type Scope = 'company' | 'me'

type ChatMessage =
  | { id: string; role: 'user'; text: string; at: number }
  | {
      id: string
      role: 'brain'
      answer: string
      citations: Citation[]
      contradictions: Contradiction[]
      subAgent: QueryResult['sub_agent']
      queryId: string
      userQuestion: string
      at: number
    }
  | { id: string; role: 'brain-loading'; at: number }
  | { id: string; role: 'brain-error'; at: number; text: string }

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

import type { PageProps } from '../types/layout'

type Props = PageProps

export function BrainQuery({ onMenuClick }: Props) {
  const navigate = useNavigate()
  const setSelected = useGraphStore((s) => s.setSelected)
  const [scope, setScope] = useState<Scope>('company')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const question = input.trim()
    if (!question || pending) return
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: question, at: Date.now() }
    const loadingId = uid()
    const loadingMsg: ChatMessage = { id: loadingId, role: 'brain-loading', at: Date.now() }
    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setPending(true)
    try {
      const result = await queryApi.ask(question, scope)
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingId)
          .concat({
            id: uid(),
            role: 'brain',
            answer: result.answer,
            citations: result.citations ?? [],
            contradictions: result.contradictions ?? [],
            subAgent: result.sub_agent,
            queryId: result.query_id,
            userQuestion: question,
            at: Date.now(),
          }),
      )
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingId)
          .concat({
            id: uid(),
            role: 'brain-error',
            at: Date.now(),
            text: "I couldn't find enough to answer that.",
          }),
      )
    } finally {
      setPending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onCitationClick = (nodeId: string) => {
    setSelected(nodeId)
    navigate('/brain/company')
  }

  return (
    <motion.div
      key="brain-query"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar title="Ask Brain" subtitle="Query in plain English" onMenuClick={onMenuClick} />

      <div className="flex items-center justify-end gap-2 px-5 pt-3">
        <label className="text-caption-sm uppercase tracking-section text-text-secondary" htmlFor="scope-select">
          Scope
        </label>
        <select
          id="scope-select"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          className="text-caption px-3 py-1.5 hairline-border rounded-xl bg-canvas text-text-primary focus-ring"
        >
          <option value="company">Company</option>
          <option value="me">My graph</option>
        </select>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <LiquidOrb size={100} className="mb-6" />
            <p className="text-body text-text-secondary mb-2">
              Try: <span className="italic text-text-primary">&quot;Who&apos;s blocked on the auth migration?&quot;</span>
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageRow key={m.id} message={m} onCitationClick={onCitationClick} />
        ))}
      </div>

      <div className="px-5 py-4 bg-canvas">
        <div className="frosted-pill rounded-full flex gap-2 items-end px-4 py-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Penlo…"
            aria-label="Ask a question about your company brain"
            rows={1}
            disabled={pending}
            className="flex-1 resize-none bg-transparent text-body text-text-primary placeholder:text-text-secondary/60 focus:outline-none min-h-[24px] max-h-32 py-1"
          />
          <button
            onClick={send}
            disabled={pending || !input.trim()}
            className="shrink-0 text-accent disabled:text-text-secondary/30 transition-colors focus-ring rounded-full"
            aria-label="Send"
          >
            <ArrowUpCircle className="w-7 h-7" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function MessageRow({
  message,
  onCitationClick,
}: {
  message: ChatMessage
  onCitationClick: (id: string) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[640px] px-4 py-2.5 rounded-bubble bg-accent text-white text-body leading-relaxed rounded-br-md">
          {message.text}
        </div>
      </div>
    )
  }

  if (message.role === 'brain-loading') {
    return (
      <div className="flex items-start gap-2 max-w-[720px]">
        <Sparkles className="w-4 h-4 text-accent mt-1 shrink-0" />
        <div className="flex items-center gap-2 text-body text-text-secondary">
          <Spinner size="sm" />
          Synthesizing…
        </div>
      </div>
    )
  }

  if (message.role === 'brain-error') {
    return (
      <div className="flex items-start gap-2 max-w-[720px]">
        <Sparkles className="w-4 h-4 text-accent mt-1 shrink-0" />
        <p className="text-body text-text-secondary">{message.text}</p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 max-w-[720px] w-full">
      <Sparkles className="w-4 h-4 text-accent mt-1 shrink-0" />
      <div className="flex-1 min-w-0">
        {message.subAgent && (
          <div className="text-caption-sm text-text-secondary mb-1">{message.subAgent} agent</div>
        )}
        <div className="text-body text-text-primary leading-relaxed whitespace-pre-wrap">
          {renderAnswerWithCitations(message.answer, message.citations, onCitationClick)}
        </div>

        {message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-text-secondary/15">
            <div className="text-caption-sm uppercase tracking-section text-text-secondary mb-2">Sources</div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c) => (
                <button
                  key={c.node_id}
                  onClick={() => onCitationClick(c.node_id)}
                  aria-label={`Open ${c.label} (${NODE_TYPE_LABEL[c.type]})`}
                  className="flex flex-col items-start px-3 py-2 hairline-border rounded-card bg-surface text-left hover:bg-black/[0.03] transition-colors max-w-[220px] focus-ring"
                >
                  <span className="text-caption-sm uppercase tracking-section text-text-secondary">
                    {NODE_TYPE_LABEL[c.type] ?? c.type}
                  </span>
                  <span className="text-caption font-medium text-text-primary truncate w-full">{c.label}</span>
                  <span className="text-caption-sm text-text-secondary truncate w-full">{c.contribution}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {message.contradictions.length > 0 && (
          <div className="mt-4 px-3 py-2 rounded-card border border-amber-300/60 bg-amber-brain-bg text-caption text-amber-brain">
            <span className="font-semibold">Contradiction detected:</span>{' '}
            {message.contradictions.length} source
            {message.contradictions.length === 1 ? '' : 's'} disagree.
            <div className="mt-1 flex flex-wrap gap-2">
              {message.contradictions.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onCitationClick(c.node_a_id)}
                  className="underline underline-offset-2 hover:text-amber-brain focus-ring"
                >
                  View {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <QueryFeedbackRow
          queryId={message.queryId}
          question={message.userQuestion}
          answer={message.answer}
        />
      </div>
    </div>
  )
}

function QueryFeedbackRow({ queryId, question, answer }: { queryId: string; question: string; answer: string }) {
  const [sent, setSent] = useState<'up' | 'down' | null>(null)

  const submit = async (rating: 'up' | 'down') => {
    if (sent) return
    try {
      await queryApi.feedback({ query_id: queryId, rating, question, answer })
      setSent(rating)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-text-secondary/15">
      <span className="text-caption-sm text-text-secondary">Helpful?</span>
      <button
        type="button"
        onClick={() => submit('up')}
        disabled={sent !== null}
        className={`p-1.5 rounded-lg transition-colors focus-ring ${
          sent === 'up' ? 'bg-green-50 text-green-600' : 'hover:bg-surface text-text-secondary'
        }`}
        aria-label="Thumbs up"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => submit('down')}
        disabled={sent !== null}
        className={`p-1.5 rounded-lg transition-colors focus-ring ${
          sent === 'down' ? 'bg-destructive-tint text-destructive' : 'hover:bg-surface text-text-secondary'
        }`}
        aria-label="Thumbs down"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
      {sent && <span className="text-caption-sm text-text-secondary">Thanks</span>}
    </div>
  )
}

function renderAnswerWithCitations(
  answer: string,
  citations: Citation[],
  onCitationClick: (id: string) => void,
) {
  if (!answer) return null
  const idSet = new Set(citations.map((c) => c.node_id))
  const re = /\[([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g
  const parts: (string | { id: string })[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(answer)) !== null) {
    if (m.index > lastIndex) parts.push(answer.slice(lastIndex, m.index))
    parts.push({ id: m[1] })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < answer.length) parts.push(answer.slice(lastIndex))
  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{p}</span>
    if (!idSet.has(p.id)) return <span key={i}>[{p.id.slice(0, 8)}…]</span>
    return (
      <button
        key={i}
        onClick={() => onCitationClick(p.id)}
        className="inline-flex items-baseline mx-0.5 px-1.5 py-0.5 rounded-full text-caption-sm text-accent bg-accent-tint hover:bg-accent/15 transition-colors focus-ring"
      >
        cite
      </button>
    )
  })
}
