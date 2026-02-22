import { defineStore } from 'pinia'
import api from '@/services/api'

export type TodayTraining = {
  id: number
  user_id: number
  training_name: string
  day_name: string
}

export const useHomeStore = defineStore('home', {
  actions: {
    async getTodayTraining(userId: string | number) {
      const res = await api.get(`/users/today_training/${userId}`)
      return res.data
    }
  }
})
