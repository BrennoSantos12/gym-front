import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export const appClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

appClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
