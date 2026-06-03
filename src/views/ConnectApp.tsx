import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { apiKeysApi, type ApiKeyEntry } from '../lib/api/endpoints'
import type { PageProps } from '../types/layout'
import { Button, Card, Input, SettingsSection } from '../components/ui'

const ENDPOINT_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/ingest/penlo-brain`

export function ConnectApp({ onMenuClick }: PageProps) {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [label, setLabel] = useState('Penlo App')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiKeysApi.list().then(setKeys).catch(() => setError('Failed to load API keys'))
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const created = await apiKeysApi.create(label)
      setNewKey(created.key)
      setKeys((prev) => [{ ...created, key_prefix: created.key.slice(0, 16), last_used_at: null }, ...prev])
    } catch {
      setError('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    try {
      await apiKeysApi.revoke(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
      if (newKey && keys.find((k) => k.id === id)) setNewKey(null)
    } catch {
      setError('Failed to revoke key')
    }
  }

  function copy(text: string, tag: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tag)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <motion.div
      key="connect-app"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-screen bg-canvas"
    >
      <TopBar title="Connect App" subtitle="Link your iOS device to Enterprise Brain" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 max-w-4xl">
        <SettingsSection
          title="Pair Flow on iPhone"
          description="After you generate a key below, open Penlo Flow on your iPhone to finish setup."
        >
          <ol className="space-y-2 text-caption text-text-secondary list-decimal pl-4 mb-4">
            <li>Install and open the Penlo Flow app on your iPhone.</li>
            <li>Copy the Endpoint URL and API key from this page.</li>
            <li>In Flow onboarding (or Settings → Enterprise Brain), paste the URL and key, then tap Test Connection.</li>
            <li>Add your Claude API key in Flow to enable on-device extraction and chat.</li>
          </ol>
          <a
            href="penlo://setup"
            className="inline-flex items-center gap-2 text-caption font-medium text-accent hover:underline"
          >
            Open Flow setup on this device
          </a>
          <p className="mt-2 text-caption-sm text-text-secondary">
            Deep link works when Flow is installed. Otherwise open Flow manually and use Setup guide.
          </p>
        </SettingsSection>

        <SettingsSection title="Endpoint URL" description="Copy this URL into the Penlo iOS app under Settings → Enterprise Brain.">
          <p className="text-caption text-text-secondary mb-3">
            For the Chrome meeting-capture extension, use the brain <strong>base URL</strong> only — it posts to{' '}
            <span className="font-mono text-caption-sm">/api/v1/ingest/standup</span>.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-surface hairline-border rounded-card text-caption-sm font-mono text-text-secondary break-all">
              {ENDPOINT_URL}
            </code>
            <Button variant="secondary" size="sm" onClick={() => copy(ENDPOINT_URL, 'url')}>
              {copied === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'url' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection title="API Key" description="Generate a key for Settings → Enterprise → API Key in the iOS app.">
          {newKey && (
            <Card padding="md" className="bg-accent-tint border-accent-border mb-4 animate-reveal">
              <p className="text-caption-sm uppercase tracking-section text-accent mb-2">Your new API key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-canvas hairline-border rounded-card text-caption-sm font-mono text-text-primary break-all">
                  {newKey}
                </code>
                <Button variant="primary" size="sm" onClick={() => copy(newKey, 'key')}>
                  {copied === 'key' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="mt-2 text-caption-sm text-text-secondary">This key will not be shown again.</p>
            </Card>
          )}
          <div className="flex items-end gap-3 flex-wrap">
            <Input
              label="Key label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Penlo App"
              className="w-48"
            />
            <Button variant="primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Generating…' : 'Generate key'}
            </Button>
          </div>
          {error && <p className="mt-2 text-caption-sm text-destructive">{error}</p>}
        </SettingsSection>

        <SettingsSection title="Active keys">
          {keys.length === 0 ? (
            <p className="text-caption text-text-secondary">No keys yet. Generate one above.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between px-4 py-3 bg-surface hairline-border rounded-card">
                  <div>
                    <p className="text-body font-medium text-text-primary">{k.label}</p>
                    <p className="text-caption-sm font-mono text-text-secondary mt-0.5">{k.key_prefix}…</p>
                    <p className="text-caption-sm text-text-secondary mt-0.5">
                      Created {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive-tint" onClick={() => handleRevoke(k.id)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="How it works">
          <ul className="space-y-2 text-caption text-text-secondary list-disc pl-4">
            <li>The Penlo app captures ambient speech and transcribes it on-device.</li>
            <li>Claude extracts structured facts — who said what, about whom, with what context.</li>
            <li>When you sync to Enterprise Brain, those facts become structured knowledge.</li>
            <li>The Brain creates nodes for people, topics, and decisions with edges between related entities.</li>
            <li>Every team member&apos;s sync feeds the same shared graph.</li>
          </ul>
        </SettingsSection>
      </div>
    </motion.div>
  )
}
