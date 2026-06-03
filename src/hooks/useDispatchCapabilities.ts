import { useCallback, useEffect, useState } from 'react'

export type DispatchCapabilities = {
  executorEnabled: boolean
  githubTokenConfigured: boolean
  canAutoBuild: boolean
  autoBuildDisabledReason: string | null
  loading: boolean
  refresh: () => Promise<void>
}

export function useDispatchCapabilities(defaultRepo: string): DispatchCapabilities {
  const [executorEnabled, setExecutorEnabled] = useState(false)
  const [githubTokenConfigured, setGithubTokenConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    try {
      const r = await fetch(`${base}/health`)
      const data = (await r.json()) as {
        executor_enabled?: boolean
        github_token_configured?: boolean
      }
      setExecutorEnabled(Boolean(data.executor_enabled))
      setGithubTokenConfigured(Boolean(data.github_token_configured))
    } catch {
      setExecutorEnabled(false)
      setGithubTokenConfigured(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const repo = defaultRepo.trim()
  const canAutoBuild = executorEnabled && githubTokenConfigured && repo.length > 0

  let autoBuildDisabledReason: string | null = null
  if (executorEnabled) {
    if (!githubTokenConfigured) {
      autoBuildDisabledReason = 'Server GitHub token is not configured.'
    } else if (!repo) {
      autoBuildDisabledReason = 'Set a default GitHub repo below to enable auto-build.'
    }
  } else if (!loading) {
    autoBuildDisabledReason = 'Auto-build is off on the server (executor disabled).'
  }

  return {
    executorEnabled,
    githubTokenConfigured,
    canAutoBuild,
    autoBuildDisabledReason,
    loading,
    refresh,
  }
}
