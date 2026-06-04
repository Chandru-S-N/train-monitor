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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
