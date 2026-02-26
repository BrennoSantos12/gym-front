import { defineStore } from 'pinia'
import api from '@/services/api'

export type Exercise = {
  id: number
  name: string
  type: string
}

export type ExerciseFilters = {
  page?: number
  limit?: number
  name?: string
  type?: string
}

export type PaginatedExerciseResponse = {
  items: Exercise[]
  total: number
  page: number
  limit: number
  pages: number
}

export const useExerciseStore = defineStore('exercise', {
  actions: {

    async getExercises(filters: ExerciseFilters = {}): Promise<PaginatedExerciseResponse> {
      const params: Record<string, string | number> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
      }
      if (filters.name) params.name = filters.name
      if (filters.type) params.type = filters.type

      const res = await api.get('/exercises/', { params })
      return res.data
    },

  }
})
