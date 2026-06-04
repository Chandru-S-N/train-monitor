import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrains } from '../api/trains'
import { generateReport } from '../api/reports'
import { getSensorStats } from '../api/sensors'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { FileText, Download, Calendar, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Reports() {
  const { user } = useAuthStore()
  const isMaintenance = user?.role === 'maintenance'
  
  const [reportType, setReportType] = useState('daily') // daily, weekly, monthly
  const [format, setFormat] = useState('pdf') // pdf, excel
  const [selectedTrain, setSelectedTrain] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [generating, setGenerating] = useState(false)

  const { data: trainsData } = useQuery({
    queryKey: ['trains'],
    queryFn: getTrains,
  })
  const trains = trainsData?.data?.results || trainsData?.data || []

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['sensorStats'],
    queryFn: getSensorStats,
  })
  const stats = statsData?.data || {}

  const handleDownload = async () => {
    if (isMaintenance) {
      toast.error('Your role does not have permission to download reports')
      return
    }
    setGenerating(true)
    const toastId = toast.loading('Compiling report data...')
    try {
      const response = await generateReport(reportType, format, selectedDate, selectedTrain || undefined)
      const mimeType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
      const ext = format === 'excel' ? 'xlsx' : 'pdf'
      const filename = `train_report_${reportType}_${selectedDate}.${ext}`
      const blob = new Blob([response.data], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully!', { id: toastId })
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Unknown error'
      toast.error(`Download failed: ${msg}`, { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Configuration Column */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <FileText size={20} color="var(--indigo)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Export Custom Reports</h3>
        </div>

        {isMaintenance && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 8, padding: '12px 14px', marginBottom: 20,
            fontSize: 12, color: '#f59e0b', display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>Your maintenance account does not have access to compile or download reports. Please contact an operator or administrator.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Report Type */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>REPORT TIMEFRAME</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {['daily', 'weekly', 'monthly'].map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  disabled={isMaintenance}
                  style={{
                    padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isMaintenance ? 'not-allowed' : 'pointer',
                    background: reportType === type ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.04)',
                    border: `1px solid ${reportType === type ? 'var(--indigo)' : 'var(--border)'}`,
                    color: reportType === type ? 'var(--indigo)' : 'var(--text-secondary)',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                    opacity: isMaintenance ? 0.5 : 1,
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>DOCUMENT FORMAT</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['pdf', 'excel'].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  disabled={isMaintenance}
                  style={{
                    padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isMaintenance ? 'not-allowed' : 'pointer',
                    background: format === f ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.04)',
                    border: `1px solid ${format === f ? '#06b6d4' : 'var(--border)'}`,
                    color: format === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    opacity: isMaintenance ? 0.5 : 1,
                  }}
                >
                  {f === 'excel' ? 'Spreadsheet (Excel)' : 'Portable Doc (PDF)'}
                </button>
              ))}
            </div>
          </div>

          {/* Train Selection */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>FILTER BY TRAIN (OPTIONAL)</label>
            <select
              value={selectedTrain}
              onChange={(e) => setSelectedTrain(e.target.value)}
              disabled={isMaintenance}
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px', fontSize: 13, outline: 'none', opacity: isMaintenance ? 0.5 : 1 }}
            >
              <option value="">All Trains (Entire Fleet Summary)</option>
              {trains.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>END DATE FOR REPORT</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={isMaintenance}
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px', fontSize: 13, outline: 'none', opacity: isMaintenance ? 0.5 : 1 }}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleDownload}
            disabled={generating || isMaintenance}
            style={{
              width: '100%', padding: '14px', borderRadius: 10,
              background: isMaintenance ? 'rgba(239,68,68,0.06)' : generating ? 'rgba(20,230,180,0.3)' : 'linear-gradient(135deg, #14e6b4, #06b6d4)',
              border: isMaintenance ? '1px solid rgba(239,68,68,0.2)' : 'none',
              color: isMaintenance ? '#ef4444' : '#0f172a',
              fontWeight: 700, fontSize: 14,
              cursor: (generating || isMaintenance) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: isMaintenance ? 'none' : '0 4px 18px rgba(20,230,180,0.30)',
              marginTop: 10, transition: 'all 0.2s',
              opacity: (generating || isMaintenance) ? 0.75 : 1,
            }}
          >
            {isMaintenance ? (
              <span>🔒 Reports Restricted for Maintenance Role</span>
            ) : (
              <>
                <Download size={18} />
                {generating ? 'Compiling Report...' : 'Generate & Download Report'}
              </>
            )}
          </button>
        </div>
      </div>


      {/* Analytics Summary Preview Column */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <Calendar size={20} color="#06b6d4" />
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>System Telemetry Health Overview</h3>
        </div>

        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Reports compile telemetry logs, speed averages, threshold violations, geofencing deviation alerts, and detailed diagnostic graphs. The selected timeframe will fetch:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 10 }}>
              <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(99,102,241,0.02)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ingested Logs</span>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{stats.total_readings_24h || 0}</p>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>last 24 hours</span>
              </div>

              <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(99,102,241,0.02)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unresolved Alerts</span>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>{stats.active_alerts || 0}</p>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>currently active</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--border)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '12px 14px', marginTop: 15 }}>
              <HelpCircle size={18} color="var(--teal)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <b style={{ color: 'var(--text-primary)' }}>Note:</b> PDF reports include clean executive print-friendly layouts. Excel format exports the raw high-fidelity 5000+ data rows, perfect for custom analytics pivot tables.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
