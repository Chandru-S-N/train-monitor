import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser } from '../api/users'
import LoadingSpinner from '../components/LoadingSpinner'
import { fmtDate } from '../utils/helpers'
import { Users, Plus, Edit2, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'operator', phone: '' })

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const usersList = usersRes?.data?.results || usersRes?.data || []

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User registered successfully')
      handleCloseModal()
    },
    onError: (err) => {
      const errData = err.response?.data
      const msg = errData ? Object.values(errData).flat().join(', ') : 'Failed to register user'
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully')
      handleCloseModal()
    },
    onError: () => toast.error('Failed to update user'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
    },
    onError: () => toast.error('Failed to delete user'),
  })

  const handleOpenCreate = () => {
    setSelectedUser(null)
    setForm({ username: '', email: '', password: '', role: 'operator', phone: '' })
    setShowModal(true)
  }

  const handleOpenEdit = (user) => {
    setSelectedUser(user)
    setForm({ username: user.username, email: user.email, password: '', role: user.role, phone: user.phone || '' })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.email) return toast.error('Please enter username and email')
    
    if (selectedUser) {
      // Update excludes password if empty
      const payload = { ...form }
      if (!payload.password) delete payload.password
      updateMutation.mutate({ id: selectedUser.id, data: payload })
    } else {
      if (!form.password) return toast.error('Password is required for new users')
      createMutation.mutate(form)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleStatus = (user) => {
    updateMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active }
    })
  }

  const getRoleBadgeStyle = (role) => {
    const styles = {
      admin:       { bg: 'var(--border)', border: '1px solid rgba(20,230,180,0.28)', text: '#14e6b4', label: 'Admin' },
      operator:    { bg: 'rgba(6,182,212,0.12)',  border: '1px solid rgba(6,182,212,0.28)',  text: '#06b6d4', label: 'Operator' },
      maintenance: { bg: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', text: '#f59e0b', label: 'Maintenance' },
    }
    return styles[role] || { bg: 'rgba(92,138,128,0.08)', border: '1px solid rgba(92,138,128,0.20)', text: 'var(--text-secondary)', label: role }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Settings</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', marginTop: 2 }}>Access Management</h2>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #14e6b4, #06b6d4)',
            border: 'none', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 15px rgba(20,230,180,0.30)'
          }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Users table */}
      <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Users size={18} color="#3b82f6" />
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Configured Accounts</h3>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 12px' }}>Username</th>
                <th style={{ padding: '10px 12px' }}>Email</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px' }}>Phone</th>
                <th style={{ padding: '10px 12px' }}>Date Joined</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13 }}>
              {usersList.map((usr) => {
                const b = getRoleBadgeStyle(usr.role)
                return (
                  <tr key={usr.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.04)', color: 'var(--text-primary)' }}>
                    <th style={{ padding: '14px 12px', fontWeight: 600 }}>{usr.username}</th>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={12} color="var(--text-secondary)" />
                        {usr.email}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                        background: b.bg, border: b.border, color: b.text
                      }}>
                        {b.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {usr.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={12} color="var(--text-secondary)" />
                          {usr.phone}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                        <Calendar size={12} />
                        {fmtDate(usr.date_joined)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <button
                        onClick={() => toggleStatus(usr)}
                        style={{
                          background: usr.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${usr.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                          color: usr.is_active ? '#10b981' : '#ef4444',
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {usr.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          onClick={() => handleOpenEdit(usr)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(usr.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(6,7,20,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              {selectedUser ? 'Edit User Roles' : 'Create Operator Account'}
            </h3>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>USERNAME</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. janesmith"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. janesmith@trainmonitor.com"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                {selectedUser ? 'PASSWORD (LEAVE BLANK TO KEEP CURRENT)' : 'PASSWORD'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters..."
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>PHONE (OPTIONAL)</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SYSTEM AUTHORIZATION ROLE</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13, outline: 'none' }}
              >
                <option value="operator">Operator (Standard view + acknowledge alerts)</option>
                <option value="maintenance">Maintenance Staff (Standard view + resolve alerts)</option>
                <option value="admin">System Administrator (Full CRUD access)</option>
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
                {selectedUser ? 'Save Updates' : 'Register User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
