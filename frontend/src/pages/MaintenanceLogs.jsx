import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMaintenanceLogs, getMaintenanceStats, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '../api/maintenance'
import { getTrains } from '../api/trains'
import { getUsers } from '../api/users'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { fmtDate } from '../utils/helpers'
import { Wrench, Plus, Edit2, Trash2, Clock, User, Train, AlertTriangle, CheckCircle2, Calendar, Filter, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_LABELS = {
  inspection: '🔧 Routine Inspection',
  repair: '🛠️ Repair',
  replacement: '🔩 Parts Replacement',
  calibration: '📐 Sensor Calibration',
  emergency: '🚨 Emergency Fix',
  preventive: '🛡️ Preventive Maintenance'
}

const PRIORITY_STYLES = {
  low: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#10b981', label: 'Low' },
  medium: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Medium' },
  high: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b', label: 'High' },
  critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: 'Critical' }
}

const STATUS_STYLES = {
  open: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', label: 'Open' },
  in_progress: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b', label: 'In Progress' },
  completed: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#10b981', label: 'Completed' },
  deferred: { bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', color: 'var(--text-secondary)', label: 'Deferred' }
}

export default function MaintenanceLogs() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const isMaintenance = user?.role === 'maintenance'
  const canModify = isAdmin || isMaintenance

  const [showModal, setShowModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null) // null = create mode, object = edit mode

  // Filter States
  const [filterTrain, setFilterTrain] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  // Form State
  const [form, setForm] = useState({
    train: '',
    maintenance_type: 'inspection',
    priority: 'medium',
    status: 'open',
    issue_description: '',
    work_done: '',
    parts_used: '',
    notes: '',
    scheduled_date: '',
    assigned_to: ''
  })

  // Queries
  const { data: logsRes, isLoading: logsLoading } = useQuery({
    queryKey: ['maintenanceLogs', filterTrain, filterStatus, filterPriority],
    queryFn: () => getMaintenanceLogs({
      train_id: filterTrain || undefined,
      status: filterStatus || undefined,
      priority: filterPriority || undefined
    })
  })
  const logsList = logsRes?.data?.results || logsRes?.data || []

  const { data: statsRes } = useQuery({
    queryKey: ['maintenanceStats'],
    queryFn: getMaintenanceStats
  })
  const stats = statsRes?.data || { total: 0, open: 0, in_progress: 0, completed: 0, critical: 0, high: 0 }

  const { data: trainsRes } = useQuery({
    queryKey: ['trains'],
    queryFn: getTrains
  })
  const trains = trainsRes?.data?.results || trainsRes?.data || []

  // Fetch users list only for admin roles
  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin
  })
  const users = usersRes?.data?.results || usersRes?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: createMaintenanceLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] })
      queryClient.invalidateQueries({ queryKey: ['maintenanceStats'] })
      toast.success('Maintenance log created successfully')
      handleCloseModal()
    },
    onError: (err) => {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(', ') : 'Failed to create log'
      toast.error(msg)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMaintenanceLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] })
      queryClient.invalidateQueries({ queryKey: ['maintenanceStats'] })
      toast.success('Maintenance log updated successfully')
      handleCloseModal()
    },
    onError: () => toast.error('Failed to update log')
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] })
      queryClient.invalidateQueries({ queryKey: ['maintenanceStats'] })
      toast.success('Maintenance log deleted successfully')
    },
    onError: () => toast.error('Failed to delete log')
  })

  const handleOpenCreate = () => {
    setSelectedLog(null)
    setForm({
      train: trains[0]?.id || '',
      maintenance_type: 'inspection',
      priority: 'medium',
      status: 'open',
      issue_description: '',
      work_done: '',
      parts_used: '',
      notes: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      assigned_to: ''
    })
    setShowModal(true)
  }

  const handleOpenEdit = (log) => {
    setSelectedLog(log)
    setForm({
      train: log.train,
      maintenance_type: log.maintenance_type,
      priority: log.priority,
      status: log.status,
      issue_description: log.issue_description,
      work_done: log.work_done || '',
      parts_used: log.parts_used || '',
      notes: log.notes || '',
      scheduled_date: log.scheduled_date || '',
      assigned_to: log.assigned_to || ''
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedLog(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.train || !form.issue_description) {
      return toast.error('Train and issue description are required')
    }

    const payload = { ...form }
    if (!payload.assigned_to) delete payload.assigned_to
    if (!payload.scheduled_date) delete payload.scheduled_date

    if (selectedLog) {
      updateMutation.mutate({ id: selectedLog.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this maintenance log?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header Widget Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Logs</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{stats.total}</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Open Issues</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginTop: 8 }}>{stats.open}</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', fontWeight: 600 }}>In Progress</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginTop: 8 }}>{stats.in_progress}</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 8 }}>{stats.completed}</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Critical / High Priority</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginTop: 8 }}>{(stats.critical || 0) + (stats.high || 0)}</span>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
            <Filter size={15} />
            <span>Filters:</span>
          </div>

          {/* Train filter */}
          <select
            value={filterTrain}
            onChange={(e) => setFilterTrain(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(20,230,180,0.1)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 12.5, outline: 'none' }}
          >
            <option value="">All Trains</option>
            {trains.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(20,230,180,0.1)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 12.5, outline: 'none' }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="deferred">Deferred</option>
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(20,230,180,0.1)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 12.5, outline: 'none' }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {canModify && (
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #14e6b4, #06b6d4)',
              border: 'none', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 15px rgba(20,230,180,0.25)'
            }}
          >
            <Plus size={16} /> Log Maintenance Job
          </button>
        )}
      </div>

      {/* Main Grid View */}
      {logsLoading ? (
        <LoadingSpinner />
      ) : logsList.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No maintenance logs match your selected filter criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {logsList.map(log => {
            const pStyle = PRIORITY_STYLES[log.priority] || PRIORITY_STYLES.medium
            const sStyle = STATUS_STYLES[log.status] || STATUS_STYLES.open
            return (
              <div
                key={log.id}
                className="glass-card maint-card"
                style={{
                  padding: '20px',
                  borderLeft: `3px solid ${pStyle.color}`,
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                  {/* Left Column Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: pStyle.color, flexShrink: 0
                  }}>
                    <Wrench size={18} />
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.04)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {log.train_id_str || log.train}
                      </span>
                      <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {log.train_name || 'Train'} — {TYPE_LABELS[log.maintenance_type] || log.maintenance_type}
                      </h4>

                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: pStyle.bg, border: `1px solid ${pStyle.border}`, color: pStyle.color,
                        textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>
                        {pStyle.label} Priority
                      </span>

                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: sStyle.bg, border: `1px solid ${sStyle.border}`, color: sStyle.color,
                        textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>
                        {sStyle.label}
                      </span>
                    </div>

                    {/* Issue Description */}
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 10, lineHeight: 1.5 }}>
                      {log.issue_description}
                    </p>

                    {/* Work Done & Details */}
                    {(log.work_done || log.parts_used || log.notes) && (
                      <div style={{
                        background: 'rgba(99,102,241,0.03)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '12px 14px', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6
                      }}>
                        {log.work_done && (
                          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Work Done: </span>
                            {log.work_done}
                          </div>
                        )}
                        {log.parts_used && (
                          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Parts Replaced: </span>
                            {log.parts_used}
                          </div>
                        )}
                        {log.notes && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontStyle: 'normal' }}>Notes: </span>
                            "{log.notes}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Details */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, color: 'var(--text-secondary)', fontSize: 11, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>Opened: {fmtDate(log.created_at)}</span>
                      </div>
                      {log.completed_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981' }}>
                          <CheckCircle2 size={12} />
                          <span>Completed: {fmtDate(log.completed_at)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} />
                        <span>Reported By: {log.reported_by_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Wrench size={12} />
                        <span>Assigned To: {log.assigned_to_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions column */}
                <div className="maint-card-actions">
                  {canModify && (
                    <button
                      onClick={() => handleOpenEdit(log)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.04)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <Edit2 size={12} /> Update
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(log.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(6,7,20,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form onSubmit={handleSubmit} className="glass-card" style={{ width: 'calc(100% - 32px)', maxWidth: 500, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              {selectedLog ? 'Update Maintenance Action' : 'Log Maintenance/Issue'}
            </h3>

            {/* Select Train */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>AFFECTED TRAIN</label>
              <select
                value={form.train}
                onChange={(e) => setForm({ ...form, train: e.target.value })}
                disabled={!!selectedLog}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              >
                {trains.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                ))}
              </select>
            </div>

            {/* Log Type & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>JOB TYPE</label>
                <select
                  value={form.maintenance_type}
                  onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                >
                  <option value="inspection">Routine Inspection</option>
                  <option value="repair">Repair</option>
                  <option value="replacement">Parts Replacement</option>
                  <option value="calibration">Sensor Calibration</option>
                  <option value="emergency">Emergency Fix</option>
                  <option value="preventive">Preventive Maintenance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>PRIORITY</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Status & Assignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>STATUS</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ASSIGNED TO</label>
                {isAdmin ? (
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                  >
                    <option value="">Unassigned</option>
                    <option value={user.id}>Assign to Me ({user.username})</option>
                  </select>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ISSUE DESCRIPTION</label>
              <textarea
                value={form.issue_description}
                onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
                rows={2}
                disabled={!!selectedLog && !isAdmin} // maintenance cannot re-write issue description, only add work notes
                placeholder="Describe the issue, defect, or scheduled work needed..."
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'none' }}
              />
            </div>

            {/* Action updates (Work done, parts, notes) */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>WORK DONE / DIAGNOSTICS</label>
              <textarea
                value={form.work_done}
                onChange={(e) => setForm({ ...form, work_done: e.target.value })}
                rows={2}
                placeholder="What actions were taken? Details of repair/inspection..."
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>PARTS REPLACED</label>
                <input
                  type="text"
                  value={form.parts_used}
                  onChange={(e) => setForm({ ...form, parts_used: e.target.value })}
                  placeholder="e.g. Temperature sensor, brake pad"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SCHEDULED DATE</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ADDITIONAL NOTES</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any recommendations or future inspection requests..."
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #14e6b4, #06b6d4)', border: 'none', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}
              >
                {selectedLog ? 'Update Log' : 'Create Log'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
