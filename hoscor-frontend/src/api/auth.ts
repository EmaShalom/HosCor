import client from './client'

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
  const res = await client.post('/auth/register', payload)
  return res.data.data
}

export async function validateAccount(token: string): Promise<{ message: string }> {
  const res = await client.post('/auth/validate', { token })
  return res.data.data
}

export async function forgotPassword(usernameOrEmail: string): Promise<ForgotResult> {
  const res = await client.post('/auth/forgot-password', { usernameOrEmail })
  return res.data.data
}

export async function resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
  const res = await client.post('/auth/reset-password', { token, newPassword, confirmPassword })
  return res.data.data
}

export async function fetchUsers(_token?: string) {
  const res = await client.get('/admin/users')
  return res.data.data
}

export async function updateUserRole(id: number, role: string, _token?: string, unit?: string) {
  const res = await client.patch(`/admin/users/${id}/role`, { role, unit: unit ?? null })
  return res.data.data
}

export async function toggleUserActive(id: number, _token?: string) {
  const res = await client.patch(`/admin/users/${id}/toggle-active`, {})
  return res.data.data
}
