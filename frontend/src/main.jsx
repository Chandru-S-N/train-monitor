import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 2000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Cache data for 30 seconds before considering it stale
      staleTime: 30_000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid rgba(20,230,180,0.18)',
          borderRadius: '12px',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#14e6b4', secondary: 'var(--bg-secondary)' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: 'var(--bg-secondary)' } },
        loading: { iconTheme: { primary: '#06b6d4', secondary: 'var(--bg-secondary)' } },
      }}
    />
  </QueryClientProvider>
)
