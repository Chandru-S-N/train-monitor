export const SEVERITY_COLORS = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#06b6d4',
  low:      '#14e6b4',
}

export const STATUS_COLORS = {
  normal:      '#10b981',
  warning:     '#f59e0b',
  critical:    '#ef4444',
  offline:     'var(--text-secondary)',
  active:      '#14e6b4',
  idle:        '#06b6d4',
  maintenance: '#f59e0b',
}

export const TRAIN_COLORS = {
  'TN-001': '#14e6b4',
  'TN-002': '#06b6d4',
  'TN-003': '#6366f1',
  'TN-004': '#f59e0b',
  'TN-005': '#ef4444',
}

export const CHART_COLORS = ['#4f46e5', '#8b5cf6', '#0d9488', '#d97706', '#ef4444']

export const lightChartTheme = {
  theme: {
    mode: 'light',
  },
  chart: {
    background: 'transparent',
    foreColor: '#1e293b',
    fontFamily: 'Inter, sans-serif',
    toolbar: {
      show: true,
      tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
    },
    animations: { enabled: true, speed: 400 },
  },
  grid: { borderColor: 'rgba(99,102,241,0.08)', strokeDashArray: 4 },
  tooltip: { theme: 'light' },
  xaxis: {
    axisBorder: { color: 'rgba(99,102,241,0.15)' },
    axisTicks:  { color: 'rgba(99,102,241,0.15)' },
    labels: { style: { colors: ['#1e293b'], fontSize: '11px' } }
  },
  yaxis: { labels: { style: { color: '#1e293b', fontSize: '11px' } } },
  legend: { labels: { colors: ['#1e293b'] } },
}

export const darkChartTheme = lightChartTheme;

// Hard-coded route waypoints for map visualization
export const TRAIN_ROUTES = {
  'TN-001': {
    name: 'Mumbai - Delhi Express',
    waypoints: [[19.0760, 72.8777], [21.1458, 79.0882], [23.1765, 75.7885], [26.9124, 75.7873], [28.6139, 77.2090]],
    color: '#14e6b4',
  },
  'TN-002': {
    name: 'Chennai - Bangalore Express',
    waypoints: [[13.0827, 80.2707], [12.9716, 77.5946]],
    color: '#06b6d4',
  },
  'TN-003': {
    name: 'Kolkata - Patna Express',
    waypoints: [[22.5726, 88.3639], [25.5941, 85.1376]],
    color: '#6366f1',
  },
  'TN-004': {
    name: 'Hyderabad - Pune Express',
    waypoints: [[17.3850, 78.4867], [18.5204, 73.8567]],
    color: '#f59e0b',
  },
  'TN-005': {
    name: 'Ahmedabad - Surat Local',
    waypoints: [[23.0225, 72.5714], [21.1702, 72.8311]],
    color: '#ef4444',
  },
}
