export default function StatCard({ title, value, subtitle, icon: Icon, color = '#3b82f6', trend, unit = '' }) {
  return (
    <div className="glass-card stat-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `${color}15`, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="text-[24px] sm:text-[28px]" style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</span>
            {unit && <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{unit}</span>}
          </div>
          {subtitle && <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>{subtitle}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${color}22, ${color}11)`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {Icon && <Icon size={20} color={color} />}
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>vs last hour</span>
        </div>
      )}
    </div>
  )
}
