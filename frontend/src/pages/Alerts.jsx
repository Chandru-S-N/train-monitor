import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, getAlertStats, acknowledgeAlert, resolveAlert } from '../api/alerts'
import SeverityBadge from '../components/SeverityBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { fmtDate, timeAgo } from '../utils/helpers'
import { useDataStore } from '../store/dataStore'
import {
  Bell, Filter, Search, Check, AlertTriangle, ShieldCheck, ChevronDown, X,
  MessageSquare, Clock, ArrowUpCircle, Trash2, CheckSquare, Square, Info,
  AlertCircle, Wrench, Bot, AlarmClock
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Resolve Reason Options ──────────────────────────────────────────────────
const RESOLVE_REASONS = [
  { value: 'resolved',       label: 'Resolved',         icon: Check,        color: '#10b981', desc: 'Issue has been fixed' },
  { value: 'false_positive', label: 'False Positive',   icon: AlertCircle,  color: '#06b6d4', desc: 'Alert was triggered in error' },
  { value: 'maintenance',    label: 'Maintenance',       icon: Wrench,       color: '#f59e0b', desc: 'Expected during maintenance window' },
  { value: 'auto_resolved',  label: 'Auto-Resolved',    icon: Bot,          color: '#8b5cf6', desc: 'Condition self-corrected' },
]

const SNOOZE_OPTIONS = [
  { label: '15 min',  minutes: 15 },
  { label: '1 hour',  minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: '1 day',   minutes: 1440 },
]

// ─── Alert Action Dropdown ────────────────────────────────────────────────────
function AlertActionMenu({ alert, onResolve, onSnooze, onEscalate, onNote, onDismiss, isResolving }) {
  const [open, setOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  const closeAll = () => { setOpen(false); setResolveOpen(false); setSnoozeOpen(false); setNoteOpen(false) }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '6px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.04)',
          border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12,
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
      >
        Actions <ChevronDown size={12} style={{ transition: '0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={closeAll} />
          <div style={{
            position: 'absolute', right: 0, top: '110%', zIndex: 50, minWidth: 210,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '6px', boxShadow: '0 8px 30px rgba(99,102,241,0.08)',
          }}>

            {/* Acknowledge */}
            {!alert.is_acknowledged && !alert.is_resolved && (
              <ActionItem
                icon={<Check size={13} color="var(--teal)" />}
                label="Acknowledge"
                onClick={() => { closeAll(); onResolve(null, 'ack') }}
                color="var(--teal)"
              />
            )}

            {/* Resolve with reason */}
            {!alert.is_resolved && (
              <div>
                <ActionItem
                  icon={<ShieldCheck size={13} color="#10b981" />}
                  label="Resolve As…"
                  hasArrow
                  onClick={() => setResolveOpen(o => !o)}
                  color="#10b981"
                />
                {resolveOpen && (
                  <div style={{ paddingLeft: 10, marginTop: 2, borderLeft: '2px solid rgba(16,185,129,0.2)', marginLeft: 8 }}>
                    {RESOLVE_REASONS.map(r => {
                      const Ico = r.icon
                      return (
                        <button
                          key={r.value}
                          onClick={() => { closeAll(); onResolve(r.value) }}
                          disabled={isResolving}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8,
                            padding: '7px 8px', borderRadius: 8, border: 'none', background: 'transparent',
                            cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = `${r.color}10`}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Ico size={12} color={r.color} style={{ marginTop: 1, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{r.desc}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Snooze */}
            {!alert.is_resolved && (
              <div>
                <ActionItem
                  icon={<AlarmClock size={13} color="#6366f1" />}
                  label="Snooze…"
                  hasArrow
                  onClick={() => setSnoozeOpen(o => !o)}
                  color="#6366f1"
                />
                {snoozeOpen && (
                  <div style={{ paddingLeft: 10, marginTop: 2, borderLeft: '2px solid rgba(99,102,241,0.2)', marginLeft: 8 }}>
                    {SNOOZE_OPTIONS.map(s => (
                      <button
                        key={s.minutes}
                        onClick={() => { closeAll(); onSnooze(s.minutes) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent',
                          cursor: 'pointer', color: 'var(--text-primary)', fontSize: 11, transition: 'background 0.12s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.10)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Clock size={10} color="#6366f1" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Escalate */}
            {!alert.is_resolved && (
              <ActionItem
                icon={<ArrowUpCircle size={13} color="#ef4444" />}
                label="Escalate to Critical"
                onClick={() => { closeAll(); onEscalate() }}
                color="#ef4444"
              />
            )}

            {/* Add Note */}
            <div>
              <ActionItem
                icon={<MessageSquare size={13} color="#f59e0b" />}
                label="Add Note"
                hasArrow
                onClick={() => setNoteOpen(o => !o)}
                color="#f59e0b"
              />
              {noteOpen && (
                <div style={{ padding: '8px 10px', borderLeft: '2px solid rgba(245,158,11,0.2)', marginLeft: 8 }}>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={2}
                    placeholder="Enter note..."
                    style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, padding: '6px 8px',
                      outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={() => { closeAll(); onNote(noteText); setNoteText('') }}
                    disabled={!noteText.trim()}
                    style={{
                      marginTop: 5, padding: '4px 12px', fontSize: 10, fontWeight: 700,
                      background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                      color: '#f59e0b', borderRadius: 6, cursor: 'pointer',
                      opacity: !noteText.trim() ? 0.5 : 1,
                    }}
                  >
                    Save Note
                  </button>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

            {/* Dismiss */}
            <ActionItem
              icon={<Trash2 size={13} color="#6b7280" />}
              label="Dismiss Alert"
              onClick={() => { closeAll(); onDismiss() }}
              color="#6b7280"
              danger
            />
          </div>
        </>
      )}
    </div>
  )
}

function ActionItem({ icon, label, onClick, color, hasArrow, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px', borderRadius: 8, border: 'none',
        background: 'transparent', cursor: 'pointer', transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(107,114,128,0.10)' : `${color}10`}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 12, color: danger ? '#6b7280' : color, fontWeight: 600 }}>{label}</span>
      </div>
      {hasArrow && <ChevronDown size={11} color="var(--text-secondary)" style={{ transform: 'rotate(-90deg)' }} />}
    </button>
  )
}

// ─── Main Alerts Page ─────────────────────────────────────────────────────────
export default function Alerts() {
  const queryClient = useQueryClient()
  const { alerts: liveAlerts } = useDataStore()
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterResolved, setFilterResolved] = useState('false')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [snoozed, setSnoozed] = useState({})   // id -> until timestamp
  const [notes, setNotes] = useState({})         // id -> note string
  const [detailAlert, setDetailAlert] = useState(null)

  const { data: statsRes } = useQuery({
    queryKey: ['alertStats'],
    queryFn: getAlertStats,
    refetchInterval: 10000,
  })
  const stats = statsRes?.data || { total: 0, unresolved: 0, critical: 0, high: 0, medium: 0, low: 0 }

  const { data: alertsRes, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', filterSeverity, filterResolved, searchQuery],
    queryFn: () => getAlerts({
      severity: filterSeverity || undefined,
      is_resolved: filterResolved === 'all' ? undefined : filterResolved === 'true',
      train_id: searchQuery || undefined,
    }),
    refetchInterval: 10000,
  })
  const alertsList = (alertsRes?.data?.results || alertsRes?.data || []).filter(a => {
    const snz = snoozed[a.id]
    if (snz && Date.now() < snz) return false
    return true
  })

  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alerts'] }); queryClient.invalidateQueries({ queryKey: ['alertStats'] }); toast.success('Alert acknowledged') },
    onError: () => toast.error('Failed to acknowledge'),
  })

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alertStats'] })
      toast.success(ctx?.reason ? `Alert resolved: ${ctx.reason.replace(/_/g,' ')}` : 'Alert resolved')
    },
    onError: () => toast.error('Failed to resolve'),
  })

  const handleAction = (alertId, reason, type) => {
    if (type === 'ack') {
      ackMutation.mutate(alertId)
    } else {
      resolveMutation.mutate(alertId, { meta: { reason } })
    }
  }

  const handleSnooze = (alertId, minutes) => {
    setSnoozed(s => ({ ...s, [alertId]: Date.now() + minutes * 60000 }))
    toast.success(`Alert snoozed for ${minutes < 60 ? minutes + ' min' : minutes / 60 + ' hr'}`)
  }

  const handleEscalate = (alert) => {
    toast(`Alert escalated: ${alert.train_name} - ${alert.message}`, { icon: '🚨', style: { background: '#fff1f2', border: '1px solid #fecdd3', color: '#ef4444' } })
  }

  const handleNote = (alertId, text) => {
    setNotes(n => ({ ...n, [alertId]: text }))
    toast.success('Note saved')
  }

  const handleDismiss = (alertId) => {
    setSnoozed(s => ({ ...s, [alertId]: Date.now() + 365 * 24 * 60 * 60000 }))
    toast('Alert dismissed', { icon: '🗑️' })
  }

  // Bulk actions
  const allIds = alertsList.map(a => a.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(allIds))
  const toggleOne = (id) => setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const bulkResolve = () => {
    selectedIds.forEach(id => resolveMutation.mutate(id))
    setSelectedIds(new Set())
    toast.success(`Resolved ${selectedIds.size} alert(s)`)
  }
  const bulkDismiss = () => {
    const now = Date.now() + 365 * 24 * 60 * 60000
    setSnoozed(s => { const n = { ...s }; selectedIds.forEach(id => n[id] = now); return n })
    setSelectedIds(new Set())
    toast('Selected alerts dismissed', { icon: '🗑️' })
  }

  const STAT_CARDS = [
    { label: 'Critical', val: stats.critical, color: '#ef4444' },
    { label: 'High',     val: stats.high,     color: '#f59e0b' },
    { label: 'Medium',   val: stats.medium,   color: '#3b82f6' },
    { label: 'Low',      val: stats.low,      color: '#10b981' },
    { label: 'Active',   val: stats.unresolved, color: '#8b5cf6' },
  ]

  return (
    <div className="animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="glass-card" style={{ padding: '16px', borderLeft: `4px solid ${c.color}` }}>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>{c.label} Alerts</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: c.color, marginTop: 4 }}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}>
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search by Train ID (e.g. TN-001)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%' }}
          />
        </div>

        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 13, outline: 'none' }}
        >
          <option value="">All Severities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🔵 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <select
          value={filterResolved}
          onChange={e => setFilterResolved(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 13, outline: 'none' }}
        >
          <option value="false">Unresolved Only</option>
          <option value="true">Resolved Only</option>
          <option value="all">All Alerts</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 12,
          background: 'var(--border)', border: '1px solid rgba(20,230,180,0.20)',
          borderRadius: 10, flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700 }}>{selectedIds.size} selected</span>
          <button onClick={bulkResolve} style={bulkBtnStyle('#10b981')}>
            <Check size={12} /> Resolve All
          </button>
          <button onClick={bulkDismiss} style={bulkBtnStyle('#334155')}>
            <Trash2 size={12} /> Dismiss All
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={{ ...bulkBtnStyle('#334155'), marginLeft: 'auto' }}>
            <X size={12} /> Clear Selection
          </button>
        </div>
      )}

      {/* Alert List */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color="#3b82f6" />
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>System Alerts Log</h3>
          </div>
          {alertsList.length > 0 && (
            <button
              onClick={toggleAll}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {allSelected ? <CheckSquare size={14} color="var(--teal)" /> : <Square size={14} />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {alertsLoading ? (
          <LoadingSpinner />
        ) : alertsList.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            <ShieldCheck size={40} color="#10b981" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.7 }} />
            No alerts found. System is running normal.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alertsList.map(alert => {
              const isSelected = selectedIds.has(alert.id)
              const noteForAlert = notes[alert.id]
              const sc = alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f59e0b' : alert.severity === 'medium' ? '#3b82f6' : '#10b981'

              return (
                <div
                  key={alert.id}
                  className="alert-card"
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: isSelected ? `1px solid rgba(20,230,180,0.35)` : '1px solid rgba(99,102,241,0.04)',
                    background: isSelected ? 'var(--border)' : alert.is_resolved ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s',
                    borderLeft: `3px solid ${sc}`,
                  }}
                >
                  {/* Left: Checkbox + Info */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => toggleOne(alert.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                    >
                      {isSelected ? <CheckSquare size={16} color="var(--teal)" /> : <Square size={16} color="var(--text-secondary)" />}
                    </button>

                    <div style={{ marginTop: 1, flexShrink: 0 }}>
                      <SeverityBadge severity={alert.severity} size="xs" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{alert.message}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span>Train: <b>{alert.train_name} ({alert.train})</b></span>
                        <span>•</span>
                        <span>Triggered: <b>{fmtDate(alert.timestamp)} ({timeAgo(alert.timestamp)})</b></span>
                        {alert.is_acknowledged && !alert.is_resolved && (
                          <span style={{ color: 'var(--teal)', fontSize: 10, background: 'var(--border)', padding: '1px 7px', borderRadius: 10 }}>✓ Acknowledged</span>
                        )}
                        {alert.is_resolved && (
                          <span style={{ color: '#10b981', fontSize: 10, background: 'rgba(16,185,129,0.08)', padding: '1px 7px', borderRadius: 10 }}>✓ Resolved</span>
                        )}
                      </div>
                      {noteForAlert && (
                        <div style={{ marginTop: 5, fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MessageSquare size={10} /> <em>{noteForAlert}</em>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="alert-card-actions">
                    {/* Detail Info */}
                    <button
                      onClick={() => setDetailAlert(alert)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6 }}
                      title="View details"
                    >
                      <Info size={15} color="var(--text-secondary)" />
                    </button>

                    {!alert.is_resolved && (
                      <AlertActionMenu
                        alert={alert}
                        isResolving={resolveMutation.isPending}
                        onResolve={(reason, type) => handleAction(alert.id, reason, type)}
                        onSnooze={(minutes) => handleSnooze(alert.id, minutes)}
                        onEscalate={() => handleEscalate(alert)}
                        onNote={(text) => handleNote(alert.id, text)}
                        onDismiss={() => handleDismiss(alert.id)}
                      />
                    )}
                    {alert.is_resolved && (
                      <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Alert Detail Drawer */}
      {detailAlert && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setDetailAlert(null)} />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 360, zIndex: 101,
            background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
            padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: '-8px 0 32px rgba(99,102,241,0.08)',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Alert Details</span>
              <button onClick={() => setDetailAlert(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            <SeverityBadge severity={detailAlert.severity} />

            <DetailRow label="Message" value={detailAlert.message} />
            <DetailRow label="Train" value={`${detailAlert.train_name} (${detailAlert.train})`} />
            <DetailRow label="Triggered At" value={fmtDate(detailAlert.timestamp)} />
            <DetailRow label="Time Ago" value={timeAgo(detailAlert.timestamp)} />
            <DetailRow label="Acknowledged" value={detailAlert.is_acknowledged ? '✓ Yes' : 'No'} />
            <DetailRow label="Resolved" value={detailAlert.is_resolved ? '✓ Yes' : 'No'} />
            {notes[detailAlert.id] && <DetailRow label="Note" value={notes[detailAlert.id]} />}
            {snoozed[detailAlert.id] && Date.now() < snoozed[detailAlert.id] && (
              <DetailRow label="Snoozed Until" value={new Date(snoozed[detailAlert.id]).toLocaleString()} />
            )}

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => setDetailAlert(null)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(99,102,241,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

const bulkBtnStyle = (color) => ({
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
  background: `rgba(${hexToRgb(color)},0.10)`, border: `1px solid rgba(${hexToRgb(color)},0.25)`,
  color: color, cursor: 'pointer',
})

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
