import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

// ─── Sensor WebSocket + REST polling fallback ────────────────────────────────
export function useSensorWebSocket() {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const pollTimer = useRef(null)
  const wsConnected = useRef(false)
  const isMounted = useRef(true)

  const { token } = useAuthStore()
  const { updateLiveData, setConnected } = useDataStore()

  // REST polling fallback: called when WS is not connected
  // Slowed to 8s (was 4s) — sensor data updates every 3s via Celery anyway
  const pollREST = useCallback(async () => {
    if (wsConnected.current || !token || !isMounted.current) return
    try {
      const res = await fetch(`${API_URL}/sensors/latest/`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok && isMounted.current) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.results || [])
        list.forEach(item => updateLiveData(item))
      }
    } catch {
      // Backend not reachable — silent fail
    }
  }, [token, updateLiveData])

  const startPolling = useCallback(() => {
    clearInterval(pollTimer.current)
    pollREST() // immediate first call
    pollTimer.current = setInterval(pollREST, 8000) // was 4000
  }, [pollREST])

  const stopPolling = useCallback(() => {
    clearInterval(pollTimer.current)
  }, [])

  const connect = useCallback(() => {
    if (!token || !isMounted.current) return
    // Don't open duplicate connections
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return

    try {
      ws.current = new WebSocket(`${WS_URL}/ws/sensors/`)

      ws.current.onopen = () => {
        if (!isMounted.current) return
        wsConnected.current = true
        setConnected(true)
        stopPolling() // WS works — stop polling
      }

      ws.current.onmessage = (e) => {
        if (!isMounted.current) return
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'sensor_update') {
            updateLiveData(msg.data)
          }
        } catch { /* ignore parse errors */ }
      }

      ws.current.onclose = () => {
        wsConnected.current = false
        if (!isMounted.current) return
        setConnected(false)
        startPolling() // WS closed — fall back to REST polling
        reconnectTimer.current = setTimeout(connect, 8000) // was 5000
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    } catch {
      wsConnected.current = false
      startPolling() // WS failed — fall back immediately
      reconnectTimer.current = setTimeout(connect, 12000)
    }
  }, [token, updateLiveData, setConnected, startPolling, stopPolling])

  useEffect(() => {
    isMounted.current = true
    connect()
    return () => {
      isMounted.current = false
      clearTimeout(reconnectTimer.current)
      clearInterval(pollTimer.current)
      ws.current?.close()
      wsConnected.current = false
    }
  }, [connect])
}

// ─── Alert WebSocket ──────────────────────────────────────────────────────────
export function useAlertWebSocket() {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const isMounted = useRef(true)
  const { token } = useAuthStore()
  const { addAlert } = useDataStore()

  const connect = useCallback(() => {
    if (!token || !isMounted.current) return
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return

    try {
      ws.current = new WebSocket(`${WS_URL}/ws/alerts/`)

      ws.current.onmessage = (e) => {
        if (!isMounted.current) return
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'new_alert') {
            addAlert(msg.data)
            const sev = msg.data.severity
            const bgMap = {
              critical: 'rgba(239,68,68,0.20)',
              high:     'rgba(245,158,11,0.20)',
              medium:   'rgba(59,130,246,0.20)',
              low:      'rgba(16,185,129,0.20)',
            }
            const bMap = {
              critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981',
            }
            toast(`🚨 ${msg.data.train_name}: ${msg.data.message}`, {
              duration: 5000,
              style: {
                background: bgMap[sev] || 'rgba(59,130,246,0.20)',
                border: `1px solid ${bMap[sev] || '#3b82f6'}`,
                color: 'var(--text-primary)',
                borderRadius: '12px',
                fontSize: '13px',
              },
            })
          }
        } catch { /* ignore parse errors */ }
      }

      ws.current.onclose = () => {
        if (!isMounted.current) return
        reconnectTimer.current = setTimeout(connect, 8000)
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    } catch {
      reconnectTimer.current = setTimeout(connect, 12000)
    }
  }, [token, addAlert])

  useEffect(() => {
    isMounted.current = true
    connect()
    return () => {
      isMounted.current = false
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])
}
