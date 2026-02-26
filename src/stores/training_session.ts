
import { defineStore } from 'pinia'
import api from '@/services/api'
import { appClient } from '@/services/axiosConfig'

export type TrainingSession = {
  id?: number | string
  user_id?: number
  training_plan_id?: number
  performed_date: string
  executions: Execution[]
}

export type Execution = {
  training_plan_exercise_id?: number
  sets_done: number
  reps: number
  weight: number
}

export type SessionExecution = {
  id: number
  training_session_id: number
  training_plan_exercise_id: number
  sets_done: number
  reps: number
  weight: number
}

export type TrainingSessionUpdate = {
  performed_date?: string
  executions?: { training_plan_exercise_id: number; sets_done?: number; reps?: number; weight?: number }[]
}

export const useTrainingSessionStore = defineStore('training_session', {
  actions: {
    async createTrainingSession(data: TrainingSession) {
      await appClient.post('/training_sessions/with_executions', data)
    },

    async getTrainingSessionThisWeek(training_plan_id: string | number) {
      const res = await api.get(`/training_sessions/this_week/${training_plan_id}`)
      return res.data
    },

    async getThisWeekSession(training_plan_id: number): Promise<{ exists: boolean; session_id: number | null }> {
      const res = await api.get(`/training_sessions/${training_plan_id}`)
      const sessions = res.data as Array<{ id: number; performed_date: string }>
      const today = new Date()
      const dayOfWeek = (today.getDay() + 6) % 7
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - dayOfWeek)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      const found = sessions.find(s => {
        const d = new Date(s.performed_date + 'T12:00:00')
        return d >= weekStart && d <= weekEnd
      })
      return { exists: !!found, session_id: found?.id ?? null }
    },

    async getExecutionsForSession(session_id: number): Promise<SessionExecution[]> {
      const res = await api.get(`/training_executions/${session_id}`)
      return res.data
    },

    async getSessionsForPlan(training_plan_id: number) {
      const res = await api.get(`/training_sessions/${training_plan_id}`)
      return res.data
    },

    async updateTrainingSession(session_id: number, data: TrainingSessionUpdate) {
      const res = await api.put(`/training_sessions/${session_id}`, data)
      return res.data
    },

    async getFirstDate(training_plan_id: string | number): Promise<string | null> {
      const res = await api.get(`/training_sessions/first_date/${training_plan_id}`)
      return res.data.first_date
    },

  }
})
