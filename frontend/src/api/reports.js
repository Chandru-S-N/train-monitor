import api from './axios'
export const generateReport = (type, format, date, train_id) =>
  api.get('/reports/generate/', {
    params: { type, file_format: format, date, ...(train_id ? { train_id } : {}) },
    responseType: 'blob',
  })
