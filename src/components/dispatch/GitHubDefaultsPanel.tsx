import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, GitBranch, Settings2 } from 'lucide-react'
import axios from 'axios'
import { dispatchApi } from '../../lib/api/endpoints'
import { extractApiError } from '../../lib/api/errors'

type Props = {
  executorEnabled: boolean
  emphasizeRequired: boolean
  onRepoChange?: (repo: string) => void
}

export function GitHubDefaultsPanel({ executorEnabled, emphasizeRequired, onRepoChange }: Props) {
  const [open, setOpen] = useState(false)
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    dispatchApi
      .getGitHubSettings()
      .then((s) => {
        const r = s.github_repo ?? ''
        setRepo(r)
        setBranch(s.github_base_branch ?? 'main')
        onRepoChange?.(r)
        setLoadError(null)
        setReadOnly(false)
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setReadOnly(true)
          setLoadError('Only company admins can change GitHub defaults.')
        } else {
          setLoadError(extractApiError(err, 'Could not load GitHub settings.'))
        }
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      const trimmed = repo.trim()
      await dispatchApi.upsertGitHubSettings(trimmed, branch.trim() || 'main')
      onRepoChange?.(trimmed)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(extractApiError(err, 'Could not save GitHub settings.'))
    } finally {
      setSaving(false)
    }
  }

  const subtext = repo
    ? `${repo} · ${branch}`
    : emphasizeRequired && executorEnabled
      ? 'Required for auto-build PRs — set owner/repo'
      : 'No default set — set per dispatch or configure here'

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-black/[0.05] flex items-center justify-center shrink-0">
          <GitBranch className="w-4 h-4 text-text-secondary" strokeWidth={1.75} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[13px] font-medium text-text-primary">GitHub defaults</p>
          <p className="text-[11px] text-text-tertiary truncate">{subtext}</p>
        </div>
        <Settings2 className="w-4 h-4 text-text-tertiary shrink-0" />
        {open ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          {loadError && (
            <p className="text-[12px] text-text-secondary">{loadError}</p>
          )}
          {!readOnly && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider" htmlFor="gh-repo">
                  Default repo
                </label>
                <input
                  id="gh-repo"
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="owner/repository"
                  className="input-field"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider" htmlFor="gh-branch">
                  Base branch
                </label>
                <input
                  id="gh-branch"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="input-field"
                  disabled={readOnly}
                />
              </div>
              {saveError && <p className="text-[12px] text-destructive">{saveError}</p>}
              <button
                type="button"
                disabled={saving || !repo.trim() || readOnly}
                onClick={() => void handleSave()}
                className="px-3.5 py-1.5 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save defaults'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
