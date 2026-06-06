import { useDataStore } from '../store/dataStore'
import { Wifi, WifiOff, Bell, Clock, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const PAGE_TITLES = {
  '/':            'Dashboard',
  '/analytics':   'Analytics & Charts',
  '/map':         'Live Train Map',
  '/alerts':      'Alert Center',
  '/reports':     'Reports & Export',
  '/trains':      'Train Management',
  '/users':       'User Management',
  '/maintenance': 'Maintenance Logs',
}

export default function Navbar({ onMenuClick }) {
  const { isConnected, alertStats } = useDataStore()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Dashboard'

  const [now, setNow] = useState(() =>
    new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  )
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
    }, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <header style={{
      height: 64,
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      flexShrink: 0,
    }}>
      {/* Left: hamburger + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, display: 'flex', alignItems: 'center',
            color: 'var(--text-secondary)', borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <Menu size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: 15, fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock size={10} color="var(--text-secondary)" />
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{now}</p>
          </div>
        </div>
      </div>

      {/* Right: connection status + alert badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* WS Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
          color: isConnected ? 'var(--teal)' : 'var(--text-secondary)',
          background: isConnected ? 'rgba(13,148,136,0.08)' : 'rgba(90,115,120,0.08)',
          border: `1px solid ${isConnected ? 'rgba(13,148,136,0.20)' : 'rgba(90,115,120,0.20)'}`,
          padding: '5px 10px', borderRadius: 20,
        }}>
          {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Polling'}</span>
          {isConnected && <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />}
        </div>

        {/* Critical alert badge */}
        {alertStats.critical > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.20)',
            padding: '5px 10px', borderRadius: 20,
            fontSize: 12, color: 'var(--red)', fontWeight: 600,
          }}>
            <Bell size={13} />
            <span>{alertStats.critical}</span>
            <span className="hidden sm:inline">Critical</span>
          </div>
        )}
      </div>
    </header>
  )
}
