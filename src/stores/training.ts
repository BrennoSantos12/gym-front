import { defineStore } from 'pinia'
import api from '@/services/api'
import { appClient } from '@/services/axiosConfig'

export type Training = {
  id: number
  name: string
}


export const useTrainingStore = defineStore('training', {
  actions: {

    async getTrainings() {
      const res = await api.get('/trainings/')
      return res.data
    },

  }
})
