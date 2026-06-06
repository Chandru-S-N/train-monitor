import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useSensorWebSocket, useAlertWebSocket } from '../hooks/useWebSocket'

export default function Layout() {
  useSensorWebSocket()
  useAlertWebSocket()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 20,
          }}
          className="lg:hidden"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}
          className="p-3 sm:p-4 md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
