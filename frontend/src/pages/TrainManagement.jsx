import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTrains, createTrain, updateTrain, deleteTrain } from '../api/trains'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import SeverityBadge from '../components/SeverityBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { Train, Plus, Edit2, Trash2, MapPin, Gauge, Thermometer } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrainManagement() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { liveData } = useDataStore()
  
  const [showModal, setShowModal] = useState(false)
  const [selectedTrain, setSelectedTrain] = useState(null) // null = create mode, object = edit mode
  
  const [form, setForm] = useState({ id: '', name: '', route_name: '', description: '', status: 'active' })

  const isAdmin       = user?.role === 'admin'
  const isOperator    = user?.role === 'operator' || isAdmin
  const isMaintenance = user?.role === 'maintenance'

  // Query trains
  const { data: trainsRes, isLoading } = useQuery({
    queryKey: ['trains'],
    queryFn: getTrains,
  })
  const trainsList = trainsRes?.data?.results || trainsRes?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trains'] })
      toast.success('Train added successfully')
      handleCloseModal()
    },
    onError: (err) => toast.error(err.response?.data?.id?.[0] || 'Failed to add train'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTrain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trains'] })
      toast.success('Train updated successfully')
      handleCloseModal()
    },
    onError: () => toast.error('Failed to update train'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trains'] })
      toast.success('Train deleted successfully')
    },
    onError: () => toast.error('Failed to delete train'),
  })

  const handleOpenCreate = () => {
    setSelectedTrain(null)
    setForm({ id: '', name: '', route_name: '', description: '', status: 'active' })
    setShowModal(true)
  }

  const handleOpenEdit = (train) => {
    setSelectedTrain(train)
    setForm({ id: train.id, name: train.name, route_name: train.route_name, description: train.description, status: train.status })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTrain(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.id || !form.name || !form.route_name) return toast.error('Please fill ID, Name and Route')
    
    if (selectedTrain) {
      updateMutation.mutate({ id: selectedTrain.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this train? All telemetry history will be removed.')) {
      deleteMutation.mutate(id)
    }
  }

  // Maintenance role: quick status toggle (active ↔ maintenance)
  const handleMaintenanceToggle = (train) => {
    const newStatus = train.status === 'maintenance' ? 'active' : 'maintenance'
    updateMutation.mutate({ id: train.id, data: { status: newStatus } })
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Train Operations</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', marginTop: 2 }}>Fleet Management</h2>
        </div>

        {(isOperator) && (
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #14e6b4, #06b6d4)',
              border: 'none', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 15px rgba(20,230,180,0.30)'
            }}
          >
            <Plus size={16} /> Add Train
          </button>
        )}
        {isMaintenance && (
          <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', padding: '6px 14px', borderRadius: 8 }}>
            🔧 Maintenance View — Status updates only
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : trainsList.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No trains configured. Click "Add Train" to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {trainsList.map(train => {
            const live = liveData[train.id] || {}
            return (
              <div key={train.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.04)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {train.id}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', marginTop: 4 }}>{train.name}</h3>
                    </div>
                    <SeverityBadge severity={train.status} size="xs" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    <MapPin size={12} color="#3b82f6" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{train.route_name}</span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>{train.description || 'No description provided.'}</p>
                </div>

                {/* Live Data Block */}
                {train.status === 'active' && live.temperature !== undefined && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.04)', borderRadius: 8, padding: '10px 12px', marginBottom: 20 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Temp</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Thermometer size={12} color="#f59e0b" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{live.temperature.toFixed(1)} °C</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pressure</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Gauge size={12} color="#8b5cf6" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{live.pressure.toFixed(1)} psi</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons — operator/admin */}
                {isOperator && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', borderTop: '1px solid rgba(99,102,241,0.04)', paddingTop: 14 }}>
                    <button
                      onClick={() => handleOpenEdit(train)}
                      style={{
                        flex: 1, padding: '6px', borderRadius: 6, background: 'rgba(99,102,241,0.04)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(train.id)}
                        style={{
                          padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Maintenance role: quick status toggle only */}
                {isMaintenance && (
                  <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(99,102,241,0.04)', paddingTop: 14 }}>
                    <button
                      onClick={() => handleMaintenanceToggle(train)}
                      style={{
                        width: '100%', padding: '7px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: train.status === 'maintenance'
                          ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                        border: `1px solid ${train.status === 'maintenance' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        color: train.status === 'maintenance' ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {train.status === 'maintenance' ? '✅ Set Active' : '🔧 Set Maintenance'}
                    </button>
                  </div>
                )}
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
          <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: 460, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              {selectedTrain ? 'Modify Train Parameters' : 'Add New Train to Fleet'}
            </h3>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TRAIN ID (UNIQUE)</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!!selectedTrain}
                placeholder="e.g. TN-006"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TRAIN NAME</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Shatabdi Express"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ROUTE NAME</label>
              <input
                type="text"
                value={form.route_name}
                onChange={(e) => setForm({ ...form, route_name: e.target.value })}
                placeholder="e.g. Chennai → Bangalore"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Brief train and operations description..."
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>OPERATIONAL STATUS</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              >
                <option value="active">Active (Generates simulated data)</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="offline">Offline</option>
              </select>
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
                {selectedTrain ? 'Save Changes' : 'Add Train'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
