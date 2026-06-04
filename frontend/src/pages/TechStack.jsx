import React, { useState } from 'react'
import {
  Server, Globe, Database, Zap, Cpu, ShieldCheck, BarChart3, Map,
  Layers, GitBranch, Package, Code2, Wifi, Lock, RefreshCw, ChevronRight
} from 'lucide-react'

const STACK = {
  Frontend: {
    icon: Globe,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.03))',
    border: 'rgba(6,182,212,0.25)',
    items: [
      { name: 'React 18', role: 'UI Framework', detail: 'Component-based SPA architecture', icon: Code2, tag: '18.2.0' },
      { name: 'Vite 5', role: 'Build Tool', detail: 'Lightning-fast HMR dev server & bundler', icon: Zap, tag: '5.1.1' },
      { name: 'React Router v6', role: 'Client Routing', detail: 'Protected routes with role-based guards', icon: GitBranch, tag: '6.22.0' },
      { name: 'TanStack Query v5', role: 'Server State', detail: 'Auto-refetching, caching, background sync', icon: RefreshCw, tag: '5.18.1' },
      { name: 'Zustand v4', role: 'Client State', detail: 'Lightweight global state for auth & live data', icon: Layers, tag: '4.5.0' },
      { name: 'ApexCharts', role: 'Data Visualization', detail: 'Time-series charts with real-time updates', icon: BarChart3, tag: '3.46.0' },
      { name: 'React-Leaflet', role: 'Interactive Maps', detail: 'Real OSM tile map, India-bounded GPS tracking', icon: Map, tag: '4.2.1' },
      { name: 'Lucide React', role: 'Icon Library', detail: 'Consistent SVG icon system', icon: Package, tag: '0.323.0' },
      { name: 'Axios', role: 'HTTP Client', detail: 'JWT interceptors, auto token refresh', icon: Wifi, tag: '1.6.5' },
      { name: 'React Hot Toast', role: 'Notifications', detail: 'Animated toast alerts for actions', icon: ShieldCheck, tag: '2.4.1' },
    ]
  },
  Backend: {
    icon: Server,
    color: '#14e6b4',
    gradient: 'linear-gradient(135deg, rgba(20,230,180,0.15), rgba(20,230,180,0.03))',
    border: 'rgba(20,230,180,0.25)',
    items: [
      { name: 'Django 4.2', role: 'Web Framework', detail: 'ORM, admin panel, modular app structure', icon: Server, tag: '4.2.10' },
      { name: 'Django REST Framework', role: 'API Layer', detail: 'RESTful endpoints, serializers, viewsets', icon: Code2, tag: '3.15.1' },
      { name: 'SimpleJWT', role: 'Authentication', detail: 'JWT access & refresh token lifecycle', icon: Lock, tag: '5.3.1' },
      { name: 'Django Channels', role: 'WebSockets', detail: 'Real-time sensor data push (ASGI)', icon: Wifi, tag: '4.0.0' },
      { name: 'Daphne', role: 'ASGI Server', detail: 'Async server for HTTP + WebSocket', icon: Zap, tag: '4.0.0' },
      { name: 'Celery', role: 'Task Queue', detail: 'Background jobs: alerts, reports, telemetry', icon: RefreshCw, tag: '5.3.6' },
      { name: 'django-cors-headers', role: 'CORS', detail: 'Cross-origin requests from frontend', icon: ShieldCheck, tag: '4.3.1' },
      { name: 'ReportLab + openpyxl', role: 'Report Export', detail: 'PDF & Excel report generation', icon: Package, tag: '4.1.0' },
      { name: 'django-filter', role: 'Query Filters', detail: 'Powerful API filtering by severity, time, train', icon: Layers, tag: '23.5' },
    ]
  },
  'Data & Infra': {
    icon: Database,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.03))',
    border: 'rgba(139,92,246,0.25)',
    items: [
      { name: 'SQLite / PostgreSQL', role: 'Primary Database', detail: 'SQLite in dev, PostgreSQL in production via psycopg2', icon: Database, tag: 'psycopg2 2.9.9' },
      { name: 'Redis', role: 'Message Broker', detail: 'Celery broker + Django Channels layer', icon: Zap, tag: '5.0.1' },
      { name: 'Docker Compose', role: 'Containerization', detail: 'Multi-service orchestration (backend, redis)', icon: Layers, tag: 'compose.yml' },
      { name: 'OpenStreetMap / CARTO', role: 'Map Tiles', detail: 'Real tile-based world map, dark theme, India-bounded', icon: Map, tag: 'via Leaflet' },
      { name: 'python-decouple', role: 'Config Management', detail: 'Environment variable loading from .env', icon: Lock, tag: '3.8' },
      { name: 'Pillow', role: 'Image Processing', detail: 'Image handling for reports & assets', icon: Package, tag: '10.2.0' },
    ]
  }
}

const ARCHITECTURE_NOTES = [
  { icon: Wifi, color: '#14e6b4', title: 'Real-Time Pipeline', desc: 'Django Channels (ASGI) over WebSocket → Zustand store → React components re-render live sensor data every second.' },
  { icon: Lock, color: '#f59e0b', title: 'Auth Flow', desc: 'Login returns JWT access + refresh tokens. Axios interceptors auto-attach Bearer header and handle 401 token refresh silently.' },
  { icon: Map, color: '#06b6d4', title: 'Real Map Integration', desc: 'React-Leaflet uses actual OpenStreetMap/CARTO tile data. Lat/Lng points are real Indian city coordinates — not mocked. India bounds prevent panning outside the subcontinent.' },
  { icon: BarChart3, color: '#8b5cf6', title: 'Analytics Customization', desc: 'ApexCharts with ApexZoom, custom date-time pickers, 6 presets (1H–7D + Custom range), curve types, color themes, and CSV/JSON export.' },
  { icon: RefreshCw, color: '#ef4444', title: 'Alert Engine', desc: 'Celery tasks periodically check sensor thresholds. Alerts support multi-step resolution: Acknowledge → Resolve As (False Positive / Maintenance / Auto-Resolved) + Snooze / Escalate / Add Note.' },
]

export default function TechStack() {
  const [activeTab, setActiveTab] = useState('Frontend')

  const tabs = Object.keys(STACK)
  const current = STACK[activeTab]
  const TabIcon = current.icon

  return (
    <div className="animate-fade-in-up">
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '28px 32px', marginBottom: 24,
        background: 'linear-gradient(135deg, var(--border), rgba(6,182,212,0.05), rgba(99,102,241,0.05))',
        border: '1px solid rgba(20,230,180,0.15)',
        borderRadius: 20,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow blob */}
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'var(--border)', filter:'blur(50px)', pointerEvents:'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #14e6b4, #06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(20,230,180,0.35)' }}>
                <Cpu size={20} color="var(--bg-primary)" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Tech Stack</h1>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>TrainMonitor IoT — Full Stack Architecture</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 560, lineHeight: 1.7 }}>
              A production-grade train sensor monitoring platform built with a modern Python/JavaScript stack. Features real-time WebSocket streaming, interactive GPS maps, advanced analytics, and role-based access control.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, minWidth: 260 }}>
            {[
              { label: 'Frontend Packages', val: '10+', color: '#06b6d4' },
              { label: 'Backend Packages', val: '9+', color: '#14e6b4' },
              { label: 'API Endpoints', val: '20+', color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(tab => {
          const { icon: Icon, color } = STACK[tab]
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: `1px solid ${isActive ? color + '40' : 'var(--border)'}`,
                background: isActive ? `linear-gradient(135deg, ${color}18, ${color}08)` : 'rgba(255,255,255,0.02)',
                color: isActive ? color : '#6b7280',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {tab}
            </button>
          )
        })}
      </div>

      {/* Stack Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 28 }}>
        {current.items.map((item, i) => {
          const Ico = item.icon
          return (
            <div
              key={item.name}
              className="glass-card"
              style={{
                padding: '16px 18px',
                background: current.gradient,
                border: `1px solid ${current.border}`,
                borderRadius: 14,
                display: 'flex', alignItems: 'flex-start', gap: 13,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${current.color}18` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${current.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ico size={17} color={current.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{item.name}</span>
                  <span style={{ fontSize: 10, color: current.color, background: `${current.color}15`, padding: '2px 7px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>v{item.tag}</span>
                </div>
                <div style={{ fontSize: 11, color: current.color, fontWeight: 600, marginBottom: 3 }}>{item.role}</div>
                <div style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.6 }}>{item.detail}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Architecture Notes */}
      <div className="glass-card" style={{ padding: '22px 24px', borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Layers size={16} color="#14e6b4" />
          <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Architecture Highlights</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {ARCHITECTURE_NOTES.map(n => {
            const Ico = n.icon
            return (
              <div key={n.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.04)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${n.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico size={14} color={n.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: n.color, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.65 }}>{n.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
