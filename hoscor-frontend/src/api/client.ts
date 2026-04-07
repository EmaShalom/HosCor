import axios from 'axios'

// In development (npm run dev): VITE_API_BASE unset → '/api' proxied by Vite to localhost:8080
// In Docker Compose: VITE_API_BASE unset (nginx proxies /api → backend:8080)
// In Render production: VITE_API_BASE='https://hoscor-backend.onrender.com' → baseURL becomes that host + '/api'
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
