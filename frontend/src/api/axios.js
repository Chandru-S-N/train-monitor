import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // 12-second timeout — prevents hanging requests that stack up
  timeout: 12000,
})

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    // Don't retry on timeout or network errors beyond one attempt
    if (!err.response && original._retry) {
      return Promise.reject(err)
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = useAuthStore.getState().refreshToken
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
          useAuthStore.getState().setToken(data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
          // Use hash-based navigation instead of full reload to avoid 404
          window.location.hash = ''
          window.history.replaceState(null, '', '/login')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }
      } else {
        useAuthStore.getState().logout()
        window.history.replaceState(null, '', '/login')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }

    // Don't throw 404s from the API as uncaught errors — return empty gracefully
    if (err.response?.status === 404) {
      console.warn('API 404:', err.config?.url)
      return Promise.resolve({ data: null, status: 404 })
    }

    return Promise.reject(err)
  }
)

export default api
