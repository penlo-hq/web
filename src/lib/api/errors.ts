import axios from 'axios'

/** Parse FastAPI / axios error bodies into a user-facing string. */
export function extractApiError(err: unknown, fallback = 'Something went wrong — try again.'): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string' && detail) return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
    if (err.response?.status === 401) return 'Session expired — sign in again.'
    if (err.response?.status === 403) return 'You do not have permission for this action.'
    if (err.response?.status === 429) return 'Too many requests — wait a moment and try again.'
    if (err.code === 'ERR_NETWORK') {
      return "Can't reach the Brain API. Check that it's running and VITE_API_URL is correct."
    }
  }
  return fallback
}
