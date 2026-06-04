import api from './axios'

export const getMaintenanceLogs = (params) => api.get('/maintenance/', { params })
export const getMaintenanceStats = () => api.get('/maintenance/stats/')
export const createMaintenanceLog = (data) => api.post('/maintenance/', data)
export const updateMaintenanceLog = (id, data) => api.patch(`/maintenance/${id}/`, data)
export const deleteMaintenanceLog = (id) => api.delete(`/maintenance/${id}/`)
