import api from './axios'
export const getTrains = () => api.get('/trains/')
export const createTrain = (data) => api.post('/trains/', data)
export const updateTrain = (id, data) => api.put(`/trains/${id}/`, data)
export const deleteTrain = (id) => api.delete(`/trains/${id}/`)
