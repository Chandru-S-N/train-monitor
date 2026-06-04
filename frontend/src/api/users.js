import api from './axios'
export const getUsers = () => api.get('/auth/users/')
export const createUser = (data) => api.post('/auth/users/', data)
export const updateUser = (id, data) => api.put(`/auth/users/${id}/`, data)
export const deleteUser = (id) => api.delete(`/auth/users/${id}/`)
