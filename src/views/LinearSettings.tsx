import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { useAuthStore } from '../store/authStore'
import { linearApi, type LinearStatusDTO } from '../lib/api/endpoints'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const WEBHOOK_URL = `${API_BASE}/api/v1/linear/webhook`

export function LinearSettings() {
  const user = useAuthStore((s) => s.user)

  const [status, setStatus] = useState<LinearStatusDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justConnected, setJustConnected] = useState(false)

  useEffect(() => {
    let cancelled = false
    linearApi
      .status()
      .then((s) => {
        if (!cancelled) setStatus(s)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load Linear status.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (user && user.role !== 'admin') {
    return <Navigate to="/brain/company" replace />
  }

  async function connect() {
    if (!token.trim() || !secret.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await linearApi.connect(token.trim(), secret.trim())
      setStatus({
        connected: true,
        org_id: result.org_id,
        org_name: result.org_name,
        connected_at: new Date().toISOString(),
      })
      setToken('')
      setSecret('')
      setJustConnected(true)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail === 'invalid_token') {
        setError('That token was rejected by Linear.')
      } else if (detail === 'already_claimed') {
        setError('This Linear organization is already connected to another company.')
      } else {
        setError("Couldn't connect — check the token and try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect Linear? New issues will stop feeding the brain.')) return
    setError(null)
    try {
      await linearApi.disconnect()
      setStatus({ connected: false, org_id: null, org_name: null, connected_at: null })
      setJustConnected(false)
    } catch {
      setError("Couldn't disconnect.")
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-screen">
      <TopBar title="Linear" subtitle="Manage integration" />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-4">
          {justConnected && (
            <div className="px-4 py-3 rounded-xl border border-mist bg-paper text-[12.5px] text-graphite">
              Linear workspace connected.
            </div>
          )}

          {loading && <p className="text-[13px] text-stone">Loading…</p>}

          {!loading && error && <p className="text-[13px] text-ink">{error}</p>}

          {!loading && !status?.connected && (
            <div className="px-6 py-6 rounded-xl border border-mist bg-paper">
              <p className="text-[13px] text-graphite">Connect Linear to feed the brain from issues.</p>
              <p className="text-[12px] text-stone mt-1">
                New and updated issues become feature/task nodes, with assignees and projects linked in.
              </p>

              <div className="mt-5 space-y-3">
                <div>
                  <label htmlFor="linear-token" className="block text-[10.5px] uppercase tracking-[0.16em] text-stone mb-1">
                    Linear API token
                  </label>
                  <input
                    id="linear-token"
                    type="password"
                    autoComplete="off"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') connect()
                    }}
                    placeholder="lin_api_***************************"
                    className="w-full px-3 py-2 rounded-xl border border-mist bg-white text-[12.5px] text-ink outline-none focus:border-ink transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="linear-secret" className="block text-[10.5px] uppercase tracking-[0.16em] text-stone mb-1">
                    Webhook signing secret
                  </label>
                  <input
                    id="linear-secret"
                    type="password"
                    autoComplete="off"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') connect()
                    }}
                    placeholder="The signing secret from your Linear webhook"
                    className="w-full px-3 py-2 rounded-xl border border-mist bg-white text-[12.5px] text-ink outline-none focus:border-ink transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={connect}
                  disabled={!token.trim() || !secret.trim() || submitting}
                  className="px-4 py-2 rounded-xl bg-ink text-white text-[12px] uppercase tracking-[0.16em] hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {submitting ? 'Connecting…' : 'Connect'}
                </button>
              </div>

              <p className="mt-4 text-[11px] text-stone">
                Create a token at linear.app → Settings → API → Personal API keys (read access). Add a webhook
                pointing at the URL below, subscribed to <span className="text-ink">Issues</span> events, and paste its
                signing secret here.
              </p>
              <div className="mt-2 px-3 py-2 rounded-xl border border-mist bg-white">
                <code className="text-[11.5px] text-ink break-all">{WEBHOOK_URL}</code>
              </div>
            </div>
          )}

          {!loading && status?.connected && (
            <section className="px-5 py-4 rounded-xl border border-mist bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{status.org_name ?? status.org_id}</p>
                  {status.connected_at && (
                    <p className="text-[10.5px] text-stone mt-0.5">
                      Connected {new Date(status.connected_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="text-[10.5px] uppercase tracking-[0.16em] text-stone hover:text-ink transition-colors"
                >
                  Disconnect
                </button>
              </div>

              <div className="mt-4">
                <p className="text-[10.5px] uppercase tracking-[0.16em] text-stone mb-2">Webhook URL</p>
                <div className="px-3 py-2 rounded-xl border border-mist bg-paper">
                  <code className="text-[11.5px] text-ink break-all">{WEBHOOK_URL}</code>
                </div>
                <p className="mt-2 text-[10.5px] text-stone">
                  Paste this into Linear → Settings → API → Webhooks and subscribe to Issues events only.
                </p>
              </div>

              <p className="mt-4 text-[10.5px] text-stone">Issues feeding the brain: all projects.</p>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  )
}
