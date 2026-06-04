import { useDataStore } from '../store/dataStore'
import { useAuthStore } from '../store/authStore'
import { Wifi, WifiOff, Bell, Clock, LogOut, ChevronDown, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

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

const ROLE_STYLES = {
  admin:       { bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.20)', color: 'var(--teal)', label: 'Admin' },
  operator:    { bg: 'rgba(8,145,178,0.08)',  border: 'rgba(8,145,178,0.20)',  color: 'var(--cyan)', label: 'Operator' },
  maintenance: { bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.20)', color: 'var(--amber)', label: 'Maintenance' },
}

const ROLE_EMOJI = { admin: '🛡️', operator: '🎛️', maintenance: '🔧' }

export default function Navbar({ onMenuClick }) {
  const { isConnected, alertStats } = useDataStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[location.pathname] || 'Dashboard'
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const [now, setNow] = useState(() =>
    new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  )
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
    }, 10000)
    return () => clearInterval(id)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.operator
  const roleEmoji = ROLE_EMOJI[user?.role] || '👤'

  return (
    <header style={{
      height: 64,
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
    }} className="md:px-6">
      {/* Left: page title with hamburger on mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }} className="md:text-lg">{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <Clock size={10} color="var(--text-secondary)" />
            <p style={{ fontSize: 10, color: 'var(--text-secondary)' }} className="md:text-xs">{now}</p>
          </div>
        </div>
      </div>

      {/* Right: status + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* WS Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          color: isConnected ? 'var(--teal)' : 'var(--text-secondary)',
          background: isConnected ? 'rgba(13,148,136,0.08)' : 'rgba(90,115,120,0.08)',
          border: `1px solid ${isConnected ? 'rgba(13,148,136,0.20)' : 'rgba(90,115,120,0.20)'}`,
          padding: '5px 12px', borderRadius: 20,
        }}>
          {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isConnected ? 'Live' : 'Polling'}
          {isConnected && <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />}
        </div>

        {/* Critical alert badge */}
        {alertStats.critical > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.20)',
            padding: '5px 12px', borderRadius: 20,
            fontSize: 12, color: 'var(--red)', fontWeight: 600,
          }}>
            <Bell size={13} />
            {alertStats.critical} Critical
          </div>
        )}

        {/* User identity dropdown */}
        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '6px 12px',
                cursor: 'pointer', color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
            >
              {/* Avatar */}
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: roleStyle.bg,
                border: `1px solid ${roleStyle.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>{roleEmoji}</span>

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user.username || user.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 10, color: roleStyle.color, fontWeight: 600 }}>
                  {roleStyle.label}
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 200,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: 6,
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(20px)',
                zIndex: 999,
              }}>
                {/* User info header */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{user.username}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>{user.email}</div>
                  <div style={{
                    display: 'inline-block', marginTop: 6,
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: roleStyle.bg, border: `1px solid ${roleStyle.border}`, color: roleStyle.color,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {roleEmoji} {roleStyle.label}
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: 'var(--red)', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
