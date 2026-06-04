import api from './axios'
export const getLatestSensors = () => api.get('/sensors/latest/')
export const getSensorData = (params) => api.get('/sensors/', { params })
export const getSensorStats = () => api.get('/sensors/stats/')
export const getChartData = (params) => api.get('/sensors/chart/', { params })
export const getGPSLatest = () => api.get('/gps/latest/')
export const getGPSHistory = (trainId, limit) => api.get(`/gps/history/${trainId}/`, { params: { limit } })
