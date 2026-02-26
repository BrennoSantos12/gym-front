import { defineStore } from 'pinia'
import api from '@/services/api'

export type TrainingPlanReportItem = {
  training_plan_id: number
  training_id: number
  day_id: number
  planned_total: number
  done_right_day: number
  done_early: number
  done_wrong_day: number
  not_done: number
}

export type ExerciseExecutionStats = {
  sets_done: number | null
  reps: number | null   // float: média ponderada das séries
  weight: number | null // float: peso médio ponderado
  performed_date: string
}

export type ExerciseProgressReport = {
  exercise_id: number
  exercise_name: string
  exercise_type: string
  times_performed: number
  times_skipped: number
  first_execution: ExerciseExecutionStats | null
  best_execution: ExerciseExecutionStats | null
  last_execution: ExerciseExecutionStats | null
  improvement_summary: string | null
  improvement_percentage: number | null
}

export const useReportStore = defineStore('report', {
  actions: {
    async getPlanAdherence(userId: number, startDate: string, endDate: string) {
      const res = await api.get('/reports/plan-adherence', {
        params: { user_id: userId, start_date: startDate, end_date: endDate },
      })
      return res.data as TrainingPlanReportItem[]
    },

    async getExerciseProgress(trainingPlanId: number, startDate: string, endDate: string) {
      const res = await api.get(`/reports/exercise-progress/${trainingPlanId}`, {
        params: { start_date: startDate, end_date: endDate },
      })
      return res.data as ExerciseProgressReport[]
    },
  },
})
