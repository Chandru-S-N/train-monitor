import api from './axios'
export const getAlerts = (params) => api.get('/alerts/', { params })
export const getAlertStats = () => api.get('/alerts/stats/')
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge/`)
export const resolveAlert = (id) => api.post(`/alerts/${id}/resolve/`)
