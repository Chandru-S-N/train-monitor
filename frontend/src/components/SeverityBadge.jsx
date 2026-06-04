export default function SeverityBadge({ severity, size = 'sm' }) {
  const classes = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    normal: 'badge-normal',
    warning: 'badge-warning',
    offline: 'badge-offline',
    active: 'badge-normal',
    idle: 'badge-medium',
    maintenance: 'badge-high',
  }
  const labels = {
    critical: '🔴 Critical', high: '🟠 High', medium: '🔵 Medium',
    low: '🟢 Low', normal: '✅ Normal', warning: '⚠️ Warning',
    offline: '⚫ Offline', active: '🟢 Active', idle: '🔵 Idle',
    maintenance: '🟠 Maintenance',
  }
  const padding = size === 'xs' ? '2px 7px' : '3px 10px'
  const fontSize = size === 'xs' ? 10 : 11
  return (
    <span className={classes[severity] || 'badge-offline'} style={{
      padding, fontSize, fontWeight: 600, borderRadius: 20,
      display: 'inline-block', whiteSpace: 'nowrap', letterSpacing: '0.03em',
    }}>
      {labels[severity] || severity}
    </span>
  )
}
