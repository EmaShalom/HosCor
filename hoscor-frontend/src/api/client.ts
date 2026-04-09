import axios from 'axios'

// Dev (npm run dev): '/api' proxied by Vite to localhost:8080
// Docker Compose: '/api' proxied by nginx to backend:8080
const base = import.meta.env.VITE_API_BASE
const baseURL = base ? `${base}/api` : '/api'

const client = axios.create({ baseURL, timeout: 10000 })

client.interceptors.request.use(config => {
  const token = localStorage.getItem('hoscor_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('hoscor_token')
      localStorage.removeItem('hoscor_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
