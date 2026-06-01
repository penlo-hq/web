import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { queryApi } from '../lib/api/endpoints'
import { useGraphStore } from '../store/graphStore'
import type { Citation, Contradiction, QueryResult } from '../types/graph'
import { NODE_TYPE_LABEL } from '../types/graph'

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

export function BrainQuery() {
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
            text: "Brain · I couldn't find enough to answer that.",
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
      className="flex flex-col h-screen"
    >
      <TopBar title="Ask Your Brain" subtitle="Query in plain English" />

      <div className="flex items-center justify-end gap-2 px-8 pt-3">
        <label className="text-[10px] uppercase tracking-[0.18em] text-stone" htmlFor="scope-select">
          Scope
        </label>
        <select
          id="scope-select"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          className="text-[12px] px-2 py-1 border border-mist rounded-md bg-white text-ink"
        >
          <option value="company">Company</option>
          <option value="me">My graph</option>
        </select>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
      >
        {messages.length === 0 && <EmptyState />}
        {messages.map((m) => (
          <MessageRow key={m.id} message={m} onCitationClick={onCitationClick} />
        ))}
      </div>

      <div className="border-t border-mist px-8 py-4 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about your company…"
            aria-label="Ask a question about your company brain"
            rows={1}
            disabled={pending}
            className="flex-1 resize-none px-3 py-2 text-[13px] border border-mist rounded-lg bg-white text-ink placeholder-stone focus:outline-none focus:border-graphite transition-colors disabled:bg-paper"
          />
          <button
            onClick={send}
            disabled={pending || !input.trim()}
            className="px-4 py-2 text-[12px] uppercase tracking-[0.16em] bg-ink text-white rounded-lg disabled:bg-mist disabled:text-stone transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-stone pt-24">
      <div className="text-[11px] uppercase tracking-[0.22em] mb-3">Ask Your Brain</div>
      <div className="text-[13px] text-graphite">
        Try: <span className="italic">"Who's blocked on the auth migration?"</span>
      </div>
    </div>
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
      <div className="flex flex-col items-end">
        <div className="text-[9.5px] uppercase tracking-[0.2em] text-stone mb-1">You</div>
        <div className="max-w-[640px] px-4 py-2.5 rounded-2xl bg-ink text-white text-[13px] leading-relaxed">
          {message.text}
        </div>
      </div>
    )
  }
  if (message.role === 'brain-loading') {
    return (
      <div className="flex flex-col items-start">
        <div className="text-[9.5px] uppercase tracking-[0.2em] text-stone mb-1">Brain</div>
        <div className="px-4 py-2.5 rounded-2xl bg-paper text-graphite text-[13px]">
          <span className="inline-flex items-center gap-1">
            synthesizing
            <span className="animate-pulse">…</span>
          </span>
        </div>
      </div>
    )
  }
  if (message.role === 'brain-error') {
    return (
      <div className="flex flex-col items-start">
        <div className="text-[9.5px] uppercase tracking-[0.2em] text-stone mb-1">Brain</div>
        <div className="px-4 py-2.5 rounded-2xl bg-paper text-graphite text-[13px]">{message.text}</div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start">
      <div className="text-[9.5px] uppercase tracking-[0.2em] text-stone mb-1">
        Brain
        {message.subAgent && (
          <span className="ml-2 text-stone normal-case tracking-normal">· {message.subAgent} agent</span>
        )}
      </div>
      <div className="max-w-[720px] w-full px-4 py-3 rounded-2xl bg-paper text-ink text-[13px] leading-relaxed whitespace-pre-wrap">
        {renderAnswerWithCitations(message.answer, message.citations, onCitationClick)}

        {message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-mist">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone mb-2">Sources</div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c) => (
                <button
                  key={c.node_id}
                  onClick={() => onCitationClick(c.node_id)}
                  aria-label={`Open ${c.label} (${NODE_TYPE_LABEL[c.type]})`}
                  className="flex flex-col items-start px-3 py-2 border border-mist rounded-lg bg-white text-left hover:border-graphite transition-colors max-w-[220px]"
                >
                  <span className="text-[9.5px] uppercase tracking-[0.18em] text-stone">
                    {NODE_TYPE_LABEL[c.type] ?? c.type}
                  </span>
                  <span className="text-[12.5px] font-medium text-ink truncate w-full">{c.label}</span>
                  <span className="text-[11px] text-stone truncate w-full">{c.contribution}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {message.contradictions.length > 0 && (
          <div className="mt-4 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-[12px] text-amber-900">
            <span className="font-semibold">Contradiction detected:</span>{' '}
            {message.contradictions.length} source
            {message.contradictions.length === 1 ? '' : 's'} disagree.
            <div className="mt-1 flex flex-wrap gap-2">
              {message.contradictions.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onCitationClick(c.node_a_id)}
                  className="underline underline-offset-2 hover:text-amber-700"
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
    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-mist">
      <span className="text-[10px] text-stone uppercase tracking-wider">Helpful?</span>
      <button
        type="button"
        onClick={() => submit('up')}
        disabled={sent !== null}
        className={`text-sm px-2 py-0.5 rounded ${sent === 'up' ? 'bg-green-100' : 'hover:bg-paper'}`}
        aria-label="Thumbs up"
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => submit('down')}
        disabled={sent !== null}
        className={`text-sm px-2 py-0.5 rounded ${sent === 'down' ? 'bg-red-100' : 'hover:bg-paper'}`}
        aria-label="Thumbs down"
      >
        👎
      </button>
      {sent && <span className="text-[10px] text-stone">Thanks for the feedback</span>}
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
        className="inline-flex items-baseline mx-0.5 px-1 py-0.5 rounded text-[11px] text-ink bg-white border border-mist hover:border-graphite transition-colors"
      >
        cite
      </button>
    )
  })
}
