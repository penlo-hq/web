import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowUpCircle, Database, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import axios from 'axios'
import { TopBar } from '../components/layout/TopBar'
import { TypingMarkdownAnswer, TypingPlainText } from '../components/chat/TypingMarkdownAnswer'
import { buildSourcesFromResponse, SourcesPanel } from '../components/chat/SourcesPanel'
import { graphApi, queryApi } from '../lib/api/endpoints'
import { useGraphStore } from '../store/graphStore'
import type { Citation, Contradiction, GraphNodeWithSource, QueryResult } from '../types/graph'
import { LiquidOrb, Spinner } from '../components/ui'
import type { PageProps } from '../types/layout'

type Scope = 'company' | 'me'

type ChatMessage =
  | { id: string; role: 'user'; text: string; at: number }
  | {
      id: string
      role: 'brain'
      answer: string
      citations: Citation[]
      sources: Citation[]
      contradictions: Contradiction[]
      relevantNodes: GraphNodeWithSource[]
      subAgent: QueryResult['sub_agent']
      queryId: string
      userQuestion: string
      at: number
    }
  | { id: string; role: 'brain-loading'; at: number }
  | { id: string; role: 'brain-error'; at: number; text: string; hint?: string }

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string' && detail) return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
    if (err.response?.status === 401) return 'Session expired — sign in again.'
    if (err.response?.status === 429) return 'Too many questions — wait a moment and try again.'
    if (err.code === 'ERR_NETWORK') {
      return "Can't reach the Brain API. Check that it's running and VITE_API_URL is correct."
    }
  }
  return "Couldn't complete your question. Try again in a moment."
}

type Props = PageProps

export function BrainQuery({ onMenuClick }: Props) {
  const navigate = useNavigate()
  const setSelected = useGraphStore((s) => s.setSelected)
  const [scope, setScope] = useState<Scope>('company')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const [graphNodeCount, setGraphNodeCount] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    graphApi
      .company()
      .then((g) => setGraphNodeCount(g.nodes?.length ?? 0))
      .catch(() => setGraphNodeCount(null))
  }, [])

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
      const relevantNodes = (result.relevant_nodes ?? []) as GraphNodeWithSource[]
      const citations = result.citations ?? []
      const sources = buildSourcesFromResponse(citations, relevantNodes)

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingId)
          .concat({
            id: uid(),
            role: 'brain',
            answer: result.answer,
            citations,
            sources,
            contradictions: result.contradictions ?? [],
            relevantNodes,
            subAgent: result.sub_agent,
            queryId: result.query_id,
            userQuestion: question,
            at: Date.now(),
          }),
      )
      if (graphNodeCount === null && relevantNodes.length > 0) {
        setGraphNodeCount(relevantNodes.length)
      }
    } catch (err) {
      const text = extractApiError(err)
      const hint =
        graphNodeCount === 0
          ? 'Your knowledge graph is empty — sync from Flow or Connect App first.'
          : undefined
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingId)
          .concat({
            id: uid(),
            role: 'brain-error',
            at: Date.now(),
            text,
            hint,
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

      <div className="flex items-center justify-between gap-3 px-5 pt-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label
            className="text-caption-sm uppercase tracking-section text-text-secondary"
            htmlFor="scope-select"
          >
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
        {graphNodeCount !== null && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <Database className="w-3.5 h-3.5" strokeWidth={1.75} />
            {graphNodeCount} nodes in graph
          </div>
        )}
      </div>

      {graphNodeCount === 0 && (
        <div className="mx-5 mt-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[13px] text-amber-900">
          <strong className="font-semibold">No memories yet.</strong> Capture on Flow iOS, approve in the
          Staging Vault, then sync — or use{' '}
          <button
            type="button"
            className="underline font-medium"
            onClick={() => navigate('/connect')}
          >
            Connect App
          </button>{' '}
          to ingest. Ask Brain cites the exact graph nodes it uses.
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-12 text-center animate-fade-in">
            <LiquidOrb size={80} className="mb-5" />
            <h2 className="font-semibold text-[18px] text-text-primary mb-1.5">Ask your company brain</h2>
            <p className="text-[14px] text-text-secondary mb-7 max-w-md">
              Answers are grounded in your knowledge graph. Every response shows{' '}
              <strong className="font-medium text-text-primary">where it came from</strong> — like Flow
              iOS cites your captured conversations.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {[
                'What decisions did we make recently?',
                "Who's working on the authentication system?",
                'What features are currently in progress?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="px-4 py-2.5 rounded-xl border border-black/[0.08] bg-surface text-[13px] text-text-secondary hover:bg-black/[0.04] hover:text-text-primary hover:border-black/[0.14] transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            onCitationClick={onCitationClick}
            onTypingProgress={() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
            }}
          />
        ))}
      </div>

      <div className="px-5 py-4 bg-canvas border-t border-black/[0.05]">
        <div className="flex gap-2 items-end max-w-3xl mx-auto bg-surface border border-black/[0.10] rounded-2xl px-4 py-2.5 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/15 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Penlo anything about your company…"
            aria-label="Ask a question about your company brain"
            rows={1}
            disabled={pending}
            className="flex-1 resize-none bg-transparent text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none min-h-[24px] max-h-36 py-0.5"
          />
          <button
            onClick={send}
            disabled={pending || !input.trim()}
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors focus-ring ${
              input.trim() && !pending ? 'bg-accent text-white hover:bg-accent/90' : 'bg-black/[0.06] text-text-tertiary'
            }`}
            aria-label="Send"
          >
            {pending ? <Spinner size="sm" /> : <ArrowUpCircle className="w-4 h-4" strokeWidth={2} />}
          </button>
        </div>
        <p className="text-center text-[11px] text-text-tertiary mt-2">
          Grounded answers with cited sources · ↵ to send
        </p>
      </div>
    </motion.div>
  )
}

function MessageRow({
  message,
  onCitationClick,
  onTypingProgress,
}: {
  message: ChatMessage
  onCitationClick: (id: string) => void
  onTypingProgress?: () => void
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
      <div className="flex items-start gap-2.5 max-w-[720px] w-full">
        <BrainAvatar />
        <div className="flex-1 min-w-0 rounded-2xl border border-black/[0.06] bg-surface px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 h-6" aria-label="Thinking">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (message.role === 'brain-error') {
    return (
      <div className="flex items-start gap-2.5 max-w-[720px] w-full animate-fade-in">
        <BrainAvatar />
        <div className="flex-1">
          <TypingPlainText
            text={message.text}
            className="text-body text-text-primary font-medium"
            enabled
          />
          {message.hint && (
            <p className="text-caption text-text-secondary mt-2">{message.hint}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <BrainAnswerBubble
      message={message}
      onCitationClick={onCitationClick}
      onTypingProgress={onTypingProgress}
    />
  )
}

function BrainAnswerBubble({
  message,
  onCitationClick,
  onTypingProgress,
}: {
  message: Extract<ChatMessage, { role: 'brain' }>
  onCitationClick: (id: string) => void
  onTypingProgress?: () => void
}) {
  const [typingDone, setTypingDone] = useState(false)

  const citationIdSet = useMemo(
    () => new Set(message.citations.map((c) => c.node_id)),
    [message.citations],
  )

  const showSources = message.sources.length > 0
  const noSourcesInAnswer =
    !showSources &&
    (message.answer.includes("don't have any knowledge") ||
      message.answer.includes("couldn't find nodes"))

  return (
    <div className="flex items-start gap-2.5 max-w-[720px] w-full animate-fade-in">
      <BrainAvatar />
      <div className="flex-1 min-w-0 rounded-2xl border border-black/[0.06] bg-surface px-4 py-3.5 shadow-sm">
        {message.subAgent && (
          <div className="text-[11px] font-medium text-accent mb-2 capitalize">
            {message.subAgent} specialist
          </div>
        )}

        <TypingMarkdownAnswer
          text={message.answer}
          citationIds={citationIdSet}
          onCitationClick={onCitationClick}
          onComplete={() => setTypingDone(true)}
          onProgress={onTypingProgress}
        />

        {typingDone && showSources && (
          <div className="mt-3 animate-fade-in">
            <SourcesPanel sources={message.sources} onOpenNode={onCitationClick} />
          </div>
        )}

        {typingDone && noSourcesInAnswer && (
          <div className="mt-3 text-[12px] text-text-tertiary animate-fade-in">
            No graph nodes matched this question yet. Add context via Flow sync or Connect App.
          </div>
        )}

        {typingDone && message.contradictions.length > 0 && (
          <div className="mt-4 px-3 py-2 rounded-card border border-amber-300/60 bg-amber-brain-bg text-caption text-amber-brain animate-fade-in">
            <span className="font-semibold">Contradiction detected:</span>{' '}
            {message.contradictions.length} source
            {message.contradictions.length === 1 ? '' : 's'} disagree.
            <div className="mt-1 flex flex-wrap gap-2">
              {message.contradictions.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onCitationClick(c.node_a_id)}
                  className="underline underline-offset-2 hover:text-amber-brain focus-ring"
                >
                  View {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {typingDone && (
          <div className="animate-fade-in">
            <QueryFeedbackRow
              queryId={message.queryId}
              question={message.userQuestion}
              answer={message.answer}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function BrainAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-accent-tint flex items-center justify-center shrink-0 mt-1">
      <Sparkles className="w-3.5 h-3.5 text-accent" />
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
    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-black/[0.06]">
      <span className="text-caption-sm text-text-secondary">Helpful?</span>
      <button
        type="button"
        onClick={() => submit('up')}
        disabled={sent !== null}
        className={`p-1.5 rounded-lg transition-colors focus-ring ${
          sent === 'up' ? 'bg-green-50 text-green-600' : 'hover:bg-canvas text-text-secondary'
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
          sent === 'down' ? 'bg-destructive-tint text-destructive' : 'hover:bg-canvas text-text-secondary'
        }`}
        aria-label="Thumbs down"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
      {sent && <span className="text-caption-sm text-text-secondary">Thanks</span>}
    </div>
  )
}
