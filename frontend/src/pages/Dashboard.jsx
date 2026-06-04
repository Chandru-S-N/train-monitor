import { useQuery } from '@tanstack/react-query'
import { useDataStore } from '../store/dataStore'
import { getSensorStats } from '../api/sensors'
import { getAlerts } from '../api/alerts'
import { getTrains } from '../api/trains'
import StatCard from '../components/StatCard'
import SeverityBadge from '../components/SeverityBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { fmtDate, timeAgo, round2 } from '../utils/helpers'
import { Train, Bell, Thermometer, Gauge, Activity, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function SkeletonRow() {
  return (
    <tr>
      {Array(8).fill(0).map((_, i) => (
        <td key={i}><div className="skeleton" style={{ height: 16, width: i === 0 ? 70 : i === 7 ? 80 : 50 }} /></td>
      ))}
    </tr>
  )
}

export default function Dashboard() {
  const { allLiveReadings, liveData, alerts } = useDataStore()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['sensorStats'],
    queryFn: getSensorStats,
    refetchInterval: 30000,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => getAlerts({ limit: 8, ordering: '-created_at' }),
    refetchInterval: 15000,
  })

  const { data: trainsData } = useQuery({
    queryKey: ['trains'],
    queryFn: getTrains,
  })

  const stats = statsData?.data || {}
  const trains = trainsData?.data?.results || trainsData?.data || []
  const recentAlerts = alerts.length > 0 ? alerts.slice(0, 8) : (alertsData?.data?.results || alertsData?.data || [])
  const displayReadings = allLiveReadings.slice(0, 20)

  return (
    <div className="animate-fade-in-up">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Trains"
          value={statsLoading ? '—' : (stats.active_trains ?? trains.filter(t => t.status === 'active').length)}
          subtitle="Currently operational"
          icon={Train}
          color="#14e6b4"
        />
        <StatCard
          title="Active Alerts"
          value={statsLoading ? '—' : stats.active_alerts ?? recentAlerts.filter(a => a.status !== 'resolved').length}
          subtitle="Require attention"
          icon={Bell}
          color="#ef4444"
        />
        <StatCard
          title="Avg Temperature"
          value={statsLoading ? '—' : round2(stats.avg_temperature ?? 0)}
          unit="°C"
          subtitle="Fleet average"
          icon={Thermometer}
          color="#f59e0b"
        />
        <StatCard
          title="Avg Pressure"
          value={statsLoading ? '—' : round2(stats.avg_pressure ?? 0)}
          unit="PSI"
          subtitle="Fleet average"
          icon={Gauge}
          color="#6366f1"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Live Sensor Feed */}
        <div className="glass-card xl:col-span-2" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={16} color="var(--teal)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Live Sensor Feed</span>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{displayReadings.length} readings</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Train</th>
                  <th>Temp (°C)</th>
                  <th>Pressure</th>
                  <th className="hidden sm:table-cell">Humidity</th>
                  <th className="hidden md:table-cell">Vibration</th>
                  <th className="hidden md:table-cell">Speed</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {displayReadings.length === 0 ? (
                  Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  displayReadings.map((r, i) => (
                    <tr key={`${r.train_id}-${i}`}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--teal)', fontSize: 12 }}>{r.train_id || r.train_name || '—'}</span>
                      </td>
                      <td>
                        <span style={{ color: r.temperature > 80 ? 'var(--red)' : r.temperature > 70 ? 'var(--amber)' : 'var(--green)', fontWeight: 500 }}>
                          {round2(r.temperature ?? 0)}
                        </span>
                      </td>
                      <td>{round2(r.pressure ?? 0)}</td>
                      <td className="hidden sm:table-cell">{round2(r.humidity ?? 0)}%</td>
                      <td className="hidden md:table-cell">{round2(r.vibration ?? 0)}</td>
                      <td className="hidden md:table-cell">{round2(r.speed ?? 0)} km/h</td>
                      <td><SeverityBadge severity={r.status || 'normal'} size="xs" /></td>
                      <td className="hidden sm:table-cell" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{r.timestamp ? fmtDate(r.timestamp) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {displayReadings.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Waiting for live data... Connect WebSocket to see real-time readings
            </div>
          )}
        </div>

        {/* Recent Alerts Panel */}
        <div className="glass-card xl:col-span-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} color="var(--red)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Alerts</span>
            </div>
            <Link to="/alerts" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--teal)', textDecoration: 'none' }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            {recentAlerts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                No recent alerts
              </div>
            ) : recentAlerts.map((alert, i) => (
              <div key={alert.id || i} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <SeverityBadge severity={alert.severity} size="xs" />
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{alert.train_name || alert.train_id}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.message || alert.alert_type}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0, marginTop: 2 }}>{timeAgo(alert.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Train Status Grid */}
      <div className="glass-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Train size={16} color="var(--teal)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Train Fleet Status</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {trains.length === 0 ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ background: 'rgba(99,102,241,0.02)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '80%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: 70 }} />
              </div>
            ))
          ) : trains.map((train) => {
            const live = liveData[train.train_id] || liveData[train.id]
            const statusColor = { active: '#059669', idle: '#2563eb', maintenance: '#d97706', offline: '#5a7378' }[train.status] || '#5a7378'
            return (
              <div key={train.id} style={{
                background: 'rgba(99,102,241,0.02)',
                borderRadius: 12, padding: '14px',
                border: `1px solid ${statusColor}25`,
                transition: 'all 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${statusColor}08`; e.currentTarget.style.borderColor = `${statusColor}45` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.02)'; e.currentTarget.style.borderColor = `${statusColor}25` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{train.train_id || train.name}</span>
                  <SeverityBadge severity={train.status || 'offline'} size="xs" />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{train.route_name || train.route || '—'}</p>
                {live && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Temp: </span>
                      <span style={{ color: live.temperature > 80 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{round2(live.temperature)}°C</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>PSI: </span>
                      <span style={{ fontWeight: 600 }}>{round2(live.pressure)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Speed: </span>
                      <span style={{ fontWeight: 600 }}>{round2(live.speed)} km/h</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
