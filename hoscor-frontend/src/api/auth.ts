import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface RegisterPayload {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterResult {
  message: string
  validationToken: string
}

export interface ForgotResult {
  message: string
  resetToken: string
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
  const res = await api.post('/auth/register', payload)
  return res.data.data
}

export async function validateAccount(token: string): Promise<{ message: string }> {
  const res = await api.post('/auth/validate', { token })
  return res.data.data
}

export async function forgotPassword(usernameOrEmail: string): Promise<ForgotResult> {
  const res = await api.post('/auth/forgot-password', { usernameOrEmail })
  return res.data.data
}

export async function resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
  const res = await api.post('/auth/reset-password', { token, newPassword, confirmPassword })
  return res.data.data
}

export async function fetchUsers(token: string) {
  const res = await axios.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data.data
}

export async function updateUserRole(id: number, role: string, token: string, unit?: string) {
  const res = await axios.patch(`/api/admin/users/${id}/role`, { role, unit: unit ?? null }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data.data
}

export async function toggleUserActive(id: number, token: string) {
  const res = await axios.patch(`/api/admin/users/${id}/toggle-active`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data.data
}
