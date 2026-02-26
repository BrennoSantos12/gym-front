import { defineStore } from 'pinia'
import api from '@/services/api'
import { appClient } from '@/services/axiosConfig'

export type TrainingName = {
  id: number
  user_id: number
  training_name: string
  day_name: string
}

export type TrainingPlan = {
  id?: number | string
  user_id?: number
  training_id?: number
  day_id?: number
  exercises?: { exercise_id: number }[]
}

export const useTrainingPlanStore = defineStore('training_plan', {
  actions: {

    async getTodayTraining(userId: string | number) {
      const res = await api.get(`/training_plans/user_trainings/today/${userId}`)
      return res.data
    },

    async createTrainingPlan(data: TrainingPlan) {
      await appClient.post('/training_plans/', data)
    },

    async getTrainingPlans(user_id: string | number) {
      const res = await api.get(`/training_plans/user_trainings/name/${user_id}`)
      return res.data
    },

    async getTrainingPlanExercises(training_plan_id: string | number) {
      const res = await api.get(`/training_plans/${training_plan_id}`)
      return res.data
    },

    async updateTrainingPlan(training_plan_id: string | number, data: { day_id?: number; exercises?: { exercise_id: number }[] }) {
      await api.put(`/training_plans/${training_plan_id}`, data)
    },

    async deleteTrainingPlan(training_plan_id: string | number) {
      await api.delete(`/training_plans/${training_plan_id}`)
    }

  }
})
