import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Map, BarChart3, Bell, FileText,
  Train, Users, LogOut, Zap, Wrench
} from 'lucide-react'

// Shared nav link renderer
function SideNavLink({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      key={to}
      to={to}
      end={exact}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
    >
      {({ isActive }) => (
        <div
          className={`sidebar-link ${isActive ? 'nav-active' : ''}`}
          style={{
            fontWeight: isActive ? 600 : 400,
          }}
        >
          <Icon size={16} />
          {label}
        </div>
      )}
    </NavLink>
  )
}

const ROLE_STYLES = {
  admin:       { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.20)', color: 'var(--indigo)', label: 'Admin', emoji: '🛡️' },
  operator:    { bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.20)',  color: 'var(--cyan)', label: 'Operator', emoji: '🎛️' },
  maintenance: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)', color: 'var(--amber)', label: 'Maintenance', emoji: '🔧' },
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  const isAdmin       = user?.role === 'admin'
  const isOperator    = user?.role === 'operator'
  const isMaintenance = user?.role === 'maintenance'

  const rs = ROLE_STYLES[user?.role] || ROLE_STYLES.operator

  return (
    <aside style={{
      width: 240,
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--indigo), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.25)'
          }}>
            <Zap size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>TrainMonitor</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, letterSpacing: '0.08em' }}>IoT SYSTEM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>

        {/* ── Core — all roles ── */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px 10px', marginBottom: 4 }}>
          Monitoring
        </div>
        <SideNavLink to="/"          icon={LayoutDashboard} label="Dashboard"  exact />
        <SideNavLink to="/analytics" icon={BarChart3}       label="Analytics"  />
        <SideNavLink to="/map"       icon={Map}             label="Live Map"   />
        <SideNavLink to="/alerts"    icon={Bell}            label="Alerts"     />
        <SideNavLink to="/trains"    icon={Train}           label="Trains"     />

        {/* ── Operations — admin + operator ── */}
        {(isAdmin || isOperator) && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 8px 10px', marginBottom: 4 }}>
              Operations
            </div>
            <SideNavLink to="/reports" icon={FileText} label="Reports" />
          </>
        )}

        {/* ── Maintenance — admin + maintenance + operator ── */}
        {(isAdmin || isMaintenance || isOperator) && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 8px 10px', marginBottom: 4 }}>
              Maintenance
            </div>
            <SideNavLink to="/maintenance" icon={Wrench} label="Maint. Logs" />
          </>
        )}

        {/* ── Admin only ── */}
        {isAdmin && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 8px 10px', marginBottom: 4 }}>
              Admin
            </div>
            <SideNavLink to="/users" icon={Users} label="User Management" />
          </>
        )}
      </nav>

      {/* User Profile Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        {/* Role + username card */}
        <div style={{
          background: rs.bg,
          borderRadius: 10, padding: '10px 12px',
          border: `1px solid ${rs.border}`,
          marginBottom: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{rs.emoji}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: 10, color: rs.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {rs.label}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
