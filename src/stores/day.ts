import { defineStore } from 'pinia'
import api from '@/services/api'
import { appClient } from '@/services/axiosConfig'

export type Day = {
  id: number
  name: string
}


export const useDayStore = defineStore('day', {
  actions: {

    async getDays() {
      const res = await api.get('/days/')
      return res.data
    },

  }
})
