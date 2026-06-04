import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Chart from 'react-apexcharts'
import { getTrains } from '../api/trains'
import { getChartData } from '../api/sensors'
import LoadingSpinner from '../components/LoadingSpinner'
import { CHART_COLORS, lightChartTheme } from '../utils/constants'
import { BarChart3, Activity, Thermometer, Gauge, ShieldAlert, Settings, Download, RefreshCw, Sliders, Palette, Calendar, Clock } from 'lucide-react'

const TIME_RANGES = [
  { label: '1H', value: 1 },
  { label: '6H', value: 6 },
  { label: '12H', value: 12 },
  { label: '24H', value: 24 },
  { label: '3D', value: 72 },
  { label: '7D', value: 168 },
  { label: 'Custom', value: 'custom' },
]

const toLocalISO = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CHART_TYPES = [
  { label: 'Area', value: 'area' },
  { label: 'Line', value: 'line' },
  { label: 'Bar', value: 'bar' },
]

const COLOR_PALETTE = [
  { name: 'Deep Teal', value: '#0d9488' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Cyber Indigo', value: '#4f46e5' },
  { name: 'Amber Bronze', value: '#d97706' },
  { name: 'Crimson Red', value: '#dc2626' },
]

export default function Analytics() {
  const [selectedTrain, setSelectedTrain] = useState('')
  const [selectedRange, setSelectedRange] = useState(1)
  const [chartType, setChartType] = useState('area')
  const [activeMetric, setActiveMetric] = useState('temperature')

  // Custom time range states
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const [customFrom, setCustomFrom] = useState(toLocalISO(oneHourAgo))
  const [customTo, setCustomTo] = useState(toLocalISO(now))
  const [appliedCustomFrom, setAppliedCustomFrom] = useState(null)
  const [appliedCustomTo, setAppliedCustomTo] = useState(null)
  
  // Customization States
  const [strokeCurve, setStrokeCurve] = useState('smooth')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [markerSize, setMarkerSize] = useState(0)
  const [showThresholds, setShowThresholds] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [customColor, setCustomColor] = useState('')
  const [compareTrain, setCompareTrain] = useState('')

  const isCustomRange = selectedRange === 'custom'

  const applyCustomRange = () => {
    setAppliedCustomFrom(customFrom)
    setAppliedCustomTo(customTo)
  }

  const { data: trainsData, isLoading: trainsLoading } = useQuery({
    queryKey: ['trains'],
    queryFn: getTrains,
  })
  const trains = trainsData?.data?.results || trainsData?.data || []

  // Set default train if not set
  React.useEffect(() => {
    if (trains.length > 0 && !selectedTrain) {
      setSelectedTrain(trains[0].id)
    }
  }, [trains, selectedTrain])

  // Query for main train data
  const { data: chartDataResponse, isLoading: chartLoading } = useQuery({
    queryKey: ['chartData', selectedTrain, selectedRange, activeMetric, appliedCustomFrom, appliedCustomTo],
    queryFn: () => {
      if (isCustomRange && appliedCustomFrom && appliedCustomTo) {
        return getChartData({ train_id: selectedTrain, from: appliedCustomFrom, to: appliedCustomTo, sensor: activeMetric })
      }
      return getChartData({ train_id: selectedTrain, hours: selectedRange, sensor: activeMetric })
    },
    enabled: !!selectedTrain && (!isCustomRange || !!(appliedCustomFrom && appliedCustomTo)),
  })

  // Query for comparison train data
  const { data: compareDataResponse, isLoading: compareLoading } = useQuery({
    queryKey: ['chartData', compareTrain, selectedRange, activeMetric, appliedCustomFrom, appliedCustomTo],
    queryFn: () => {
      if (isCustomRange && appliedCustomFrom && appliedCustomTo) {
        return getChartData({ train_id: compareTrain, from: appliedCustomFrom, to: appliedCustomTo, sensor: activeMetric })
      }
      return getChartData({ train_id: compareTrain, hours: selectedRange, sensor: activeMetric })
    },
    enabled: !!compareTrain && (!isCustomRange || !!(appliedCustomFrom && appliedCustomTo)),
  })

  const rawData = chartDataResponse?.data || []
  const compareRawData = compareDataResponse?.data || []
  
  // Format data for ApexCharts
  const seriesData = rawData.map(item => ({
    x: new Date(item.timestamp).getTime(),
    y: item.value
  }))

  const compareSeriesData = compareRawData.map(item => ({
    x: new Date(item.timestamp).getTime(),
    y: item.value
  }))

  const mainTrainName = trains.find(t => t.id === selectedTrain)?.name || 'Selected Train'
  const compareTrainName = trains.find(t => t.id === compareTrain)?.name || 'Comparison Train'

  const chartSeries = [
    {
      name: `${mainTrainName} (${activeMetric.toUpperCase()})`,
      data: seriesData,
    },
  ]

  if (compareTrain && compareSeriesData.length > 0) {
    chartSeries.push({
      name: `${compareTrainName} (${activeMetric.toUpperCase()})`,
      data: compareSeriesData,
    })
  }

  const thresholdMap = {
    temperature: { warning: 80, critical: 100, unit: '°C' },
    pressure: { warning: 150, critical: 200, unit: 'psi' },
    humidity: { warning: 75, critical: 90, unit: '%' },
    vibration: { warning: 7, critical: 12, unit: 'g' },
  }

  const activeColor = customColor || CHART_COLORS[activeMetric === 'temperature' ? 0 : activeMetric === 'pressure' ? 1 : activeMetric === 'humidity' ? 2 : 3]
  
  const chartOptions = {
    ...lightChartTheme,
    stroke: {
      curve: strokeCurve,
      width: chartType === 'bar' ? 0 : strokeWidth,
    },
    colors: compareTrain ? [activeColor, '#a855f7'] : [activeColor],
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    grid: {
      show: showGrid,
      borderColor: 'var(--border)',
      strokeDashArray: 4,
    },
    markers: {
      size: markerSize,
      strokeWidth: 1,
      hover: {
        size: markerSize + 2
      }
    },
    xaxis: {
      ...lightChartTheme.xaxis,
      type: 'datetime',
      labels: {
        ...lightChartTheme.xaxis.labels,
        datetimeUTC: false,
      }
    },
    yaxis: {
      ...lightChartTheme.yaxis,
      title: {
        text: activeMetric === 'temperature' ? 'Temperature (°C)' : activeMetric === 'pressure' ? 'Pressure (psi)' : activeMetric === 'humidity' ? 'Humidity (%)' : 'Vibration (g)',
        style: { color: '#475569' }
      }
    },
    annotations: {
      yaxis: (showThresholds && thresholdMap[activeMetric]) ? [
        {
          y: thresholdMap[activeMetric].warning,
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          strokeDashArray: 4,
          label: {
            borderColor: '#f59e0b',
            style: { color: '#fff', background: '#f59e0b', fontSize: '9px', fontWeight: 600, padding: { left: 6, right: 6, top: 4, bottom: 4 } },
            text: `Warning: ${thresholdMap[activeMetric].warning} ${thresholdMap[activeMetric].unit}`,
            position: 'left',
            textAnchor: 'start',
          }
        },
        {
          y: thresholdMap[activeMetric].critical,
          borderColor: '#ef4444',
          borderWidth: 1.5,
          strokeDashArray: 4,
          label: {
            borderColor: '#ef4444',
            style: { color: '#fff', background: '#ef4444', fontSize: '9px', fontWeight: 600, padding: { left: 6, right: 6, top: 4, bottom: 4 } },
            text: `Critical: ${thresholdMap[activeMetric].critical} ${thresholdMap[activeMetric].unit}`,
            position: 'left',
            textAnchor: 'start',
          }
        }
      ] : []
    }
  }

  const metrics = [
    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: '#4f46e5', unit: '°C' },
    { id: 'pressure', label: 'Pressure', icon: Gauge, color: '#8b5cf6', unit: 'psi' },
    { id: 'humidity', label: 'Humidity', icon: Activity, color: '#0d9488', unit: '%' },
    { id: 'vibration', label: 'Vibration', icon: ShieldAlert, color: '#d97706', unit: 'g' },
  ]

  const exportToCSV = () => {
    if (rawData.length === 0) return
    const headers = ['Timestamp', 'Value', 'Train ID']
    const rows = rawData.map(item => [item.timestamp, item.value, item.train_id])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${activeMetric}_telemetry_${selectedTrain}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    if (rawData.length === 0) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${activeMetric}_telemetry_${selectedTrain}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.removeChild(downloadAnchor)
  }

  return (
    <div className="animate-fade-in-up">
      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Select Train</label>
            <select
              value={selectedTrain}
              onChange={(e) => setSelectedTrain(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 13, outline: 'none' }}
            >
              {trainsLoading && <option>Loading...</option>}
              {trains.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Time Range</label>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 3, borderRadius: 8, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {TIME_RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => {
                    setSelectedRange(r.value)
                    if (r.value !== 'custom') setAppliedCustomFrom(null)
                  }}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer',
                    background: selectedRange === r.value ? (r.value === 'custom' ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.12)') : 'transparent',
                    color: selectedRange === r.value ? 'var(--indigo)' : 'var(--text-secondary)',
                    fontWeight: selectedRange === r.value ? 700 : 400,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {r.value === 'custom' && <Calendar size={10} />}
                  {r.label}
                </button>
              ))}
            </div>
            {/* Custom Date-Time Picker */}
            {isCustomRange && (
              <div style={{
                marginTop: 8, padding: '12px 14px', borderRadius: 10,
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.20)',
                display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap'
              }}>
                <div>
                  <label style={{ fontSize: 10, color: '#6366f1', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    <Clock size={9} style={{ display:'inline', marginRight: 3 }} />FROM
                  </label>
                  <input
                    type="datetime-local"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    max={customTo}
                    style={{
                      background: 'var(--bg-secondary)', border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 7, color: 'var(--text-primary)', padding: '5px 9px', fontSize: 12, outline: 'none',
                      colorScheme: 'light'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#6366f1', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    <Clock size={9} style={{ display:'inline', marginRight: 3 }} />TO
                  </label>
                  <input
                    type="datetime-local"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    min={customFrom}
                    style={{
                      background: 'var(--bg-secondary)', border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 7, color: 'var(--text-primary)', padding: '5px 9px', fontSize: 12, outline: 'none',
                      colorScheme: 'light'
                    }}
                  />
                </div>
                <button
                  onClick={applyCustomRange}
                  disabled={!customFrom || !customTo}
                  style={{
                    padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                    opacity: (!customFrom || !customTo) ? 0.5 : 1,
                    transition: 'all 0.15s'
                  }}
                >
                  Apply Range
                </button>
                {appliedCustomFrom && (
                  <span style={{ fontSize: 10, color: '#6366f1', alignSelf: 'center' }}>
                    ✓ Custom range active
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase', textAlign: 'right' }}>Chart Style</label>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            {CHART_TYPES.map(c => (
              <button
                key={c.value}
                onClick={() => setChartType(c.value)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer',
                  background: chartType === c.value ? 'rgba(6,182,212,0.12)' : 'transparent',
                  color: chartType === c.value ? '#0891b2' : 'var(--text-secondary)',
                  fontWeight: chartType === c.value ? 700 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graph Customization Section (New Panel) */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, borderLeft: '3px solid #06b6d4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sliders size={14} color="#06b6d4" />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#06b6d4', letterSpacing: '0.05em' }}>Graph Customization Panel</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* Comparison and Color Swatch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Compare with Train</label>
              <select
                value={compareTrain}
                onChange={(e) => setCompareTrain(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, outline: 'none' }}
              >
                <option value="">-- None (Single Train View) --</option>
                {trains.filter(t => t.id !== selectedTrain).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Graph Theme Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <button
                  onClick={() => setCustomColor('')}
                  style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(20,230,180,0.2)',
                    background: customColor === '' ? 'var(--border)' : 'transparent',
                    color: 'var(--text-primary)', cursor: 'pointer'
                  }}
                >
                  Auto
                </button>
                {COLOR_PALETTE.map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => setCustomColor(theme.value)}
                    title={theme.name}
                    style={{
                      width: 16, height: 16, borderRadius: '50%', border: customColor === theme.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                      background: theme.value, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stroke Width and Points size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>Stroke Thickness</span>
                <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>{strokeWidth}px</span>
              </div>
              <input
                type="range" min="1" max="6" step="1"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--indigo)', background: 'rgba(99, 102, 241, 0.1)', height: 6, borderRadius: 3, outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>Data Point Markers</span>
                <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>{markerSize}px</span>
              </div>
              <input
                type="range" min="0" max="8" step="1"
                value={markerSize}
                onChange={(e) => setMarkerSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--indigo)', background: 'rgba(99, 102, 241, 0.1)', height: 6, borderRadius: 3, outline: 'none' }}
              />
            </div>
          </div>

          {/* Interpolation Style and Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Line Curve Type</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {['smooth', 'straight', 'stepline'].map(style => (
                  <button
                    key={style}
                    onClick={() => setStrokeCurve(style)}
                    style={{
                      flex: 1, padding: '4px 6px', fontSize: 10, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: strokeCurve === style ? 'rgba(6,182,212,0.12)' : 'rgba(99,102,241,0.04)',
                      color: strokeCurve === style ? '#0891b2' : 'var(--text-secondary)',
                      fontWeight: strokeCurve === style ? 700 : 400,
                      textTransform: 'capitalize',
                      transition: 'all 0.15s'
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={showThresholds}
                  onChange={(e) => setShowThresholds(e.target.checked)}
                  style={{ accentColor: 'var(--indigo)' }}
                />
                Show Thresholds
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  style={{ accentColor: 'var(--indigo)' }}
                />
                Show Grid Lines
              </label>
            </div>
          </div>

          {/* Data Export Options */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Export Plotted Data</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={exportToCSV}
                disabled={rawData.length === 0}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '7px 10px', borderRadius: 8, fontSize: 11, border: '1px solid var(--border)',
                  background: 'rgba(99,102,241,0.04)', color: 'var(--indigo)', cursor: 'pointer',
                  opacity: rawData.length === 0 ? 0.5 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (rawData.length > 0) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
              >
                <Download size={12} />
                CSV
              </button>
              <button
                onClick={exportToJSON}
                disabled={rawData.length === 0}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '7px 10px', borderRadius: 8, fontSize: 11, border: '1px solid rgba(6,182,212,0.15)',
                  background: 'rgba(6,182,212,0.04)', color: '#0891b2', cursor: 'pointer',
                  opacity: rawData.length === 0 ? 0.5 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (rawData.length > 0) e.currentTarget.style.background = 'rgba(6,182,212,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.04)' }}
              >
                <Download size={12} />
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => {
          const Icon = m.icon
          const isActive = activeMetric === m.id
          return (
            <div
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className="glass-card"
              style={{
                padding: '16px', cursor: 'pointer', border: isActive ? `1px solid ${m.color}` : '1px solid var(--border)',
                background: isActive ? `linear-gradient(135deg, var(--bg-secondary), ${m.color}08)` : 'var(--bg-secondary)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                      {rawData.length > 0 ? rawData[rawData.length - 1].value : '—'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.unit}</span>
                  </div>
                </div>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `var(--bg-primary)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} color={isActive ? m.color : 'var(--text-secondary)'} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart View */}
      <div className="glass-card" style={{ padding: '24px', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={20} color="var(--indigo)" />
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
              Time-Series Telemetry Analysis {compareTrain && <span style={{ color: '#a855f7', fontSize: 12, fontWeight: 400 }}> (Comparison Mode Active)</span>}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(chartLoading || compareLoading) && <RefreshCw size={12} className="animate-spin" color="var(--indigo)" />}
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Updates every 30s</span>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 350 }}>
          {chartLoading && rawData.length === 0 ? (
            <LoadingSpinner />
          ) : rawData.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14 }}>
              No telemetry data found for the selected time range.
            </div>
          ) : (
            <Chart
              options={chartOptions}
              series={chartSeries}
              type={chartType === 'bar' ? 'bar' : chartType === 'line' ? 'line' : 'area'}
              height="100%"
            />
          )}
        </div>
      </div>
    </div>
  )
}

