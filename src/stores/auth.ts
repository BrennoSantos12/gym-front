import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import router from '@/router'

interface User {
  id: number
  name: string
  email: string
}

function decodeToken(token: string): { sub: string } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const userId = computed(() => {
    if (!token.value) return null
    const payload = decodeToken(token.value)
    return payload ? Number(payload.sub) : null
  })

  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const { data } = await api.post('/auth/login', formData)

    token.value = data.access_token
    localStorage.setItem('token', data.access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`

    router.push('/')
  }

  async function register(name: string, email: string, password: string) {
    await api.post('/auth/register', { name, email, password })
    router.push('/login')
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    router.push('/login')
  }

  return { token, user, userId, isAuthenticated, login, register, logout }
})
