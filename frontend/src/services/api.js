// frontend/src/services/api.js

import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' }
})

// Auto-attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth APIs
export const registerUser  = (data) => API.post('/api/auth/register', data)
export const loginUser     = (data) => API.post('/api/auth/login', data)

// Detection APIs
export const detectStress  = (formData) =>
  API.post('/api/detect/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const getHistory    = (cropId) =>
  API.get(`/api/detect/history/${cropId}`)

// Farm APIs
export const getFarmData   = () => API.get('/api/farm/dashboard')
export const getHeatmap    = () => API.get('/api/farm/heatmap')

// Alert APIs
export const getAlerts     = () => API.get('/api/alerts/active')

// Agronomist APIs
export const getAgroQueries = (status = 'pending') => API.get(`/api/agronomist/queries?status=${status}`)
export const getAgroQueryDetail = (id) => API.get(`/api/agronomist/queries/${id}`)
export const respondToQuery = (id, data) => API.post(`/api/agronomist/respond/${id}`, data)
export const getAgroStats = () => API.get('/api/agronomist/stats')
export const getAgroNotifications = () => API.get('/api/agronomist/notifications')
export const markAgroNotificationsRead = () => API.patch('/api/agronomist/notifications/read')
export const updateAgroProfile = (data) => API.put('/api/agronomist/profile', data)

// Farmer APIs
export const submitFarmerQuery = (formData) => API.post('/api/farmer/query', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const getFarmerQueries = () => API.get('/api/farmer/queries')
export const getNotifications = () => API.get('/api/farmer/notifications')
export const markNotificationsRead = () => API.patch('/api/farmer/notifications/read')

export default API
