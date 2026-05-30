import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL, withCredentials: true })
export const publicApi = axios.create({ baseURL: BASE_URL, withCredentials: true })

let refreshPromise: Promise<void> | null = null

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = publicApi
          .post('/api/v1/auth/refresh')
          .then(({ data }) => {
            if (data?.user) useAuthStore.getState().setUser(data.user)
          })
          .catch(() => {
            useAuthStore.getState().clearUser()
          })
          .finally(() => {
            refreshPromise = null
          })
      }
      try {
        await refreshPromise
        if (useAuthStore.getState().user) return api(original)
      } catch {
        // fall through to reject
      }
    }
    return Promise.reject(error)
  },
)
