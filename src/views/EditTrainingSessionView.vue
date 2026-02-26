<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingPlanStore } from '@/stores/training_plan'
import { useTrainingSessionStore } from '@/stores/training_session'
import router from '@/router'

const route = useRoute()
const trainingPlanStore = useTrainingPlanStore()
const trainingSessionStore = useTrainingSessionStore()

const sessionId = Number(route.params.id)
const planId = Number(route.query.plan_id)

type PlanExercise = { id: number; exercise_id: number; exercise_name: string }
type ExerciseRow = {
  plan_exercise_id: number
  name: string
  sets_done: string
  reps: string
  weight: string
}

const rows = ref<ExerciseRow[]>([])
const performedDate = ref('')
const loading = ref(false)

const hasAnyValue = computed(() => rows.value.some(r => r.sets_done || r.reps || r.weight))

onMounted(async () => {
  const [exercises, executions, sessions] = await Promise.all([
    trainingPlanStore.getTrainingPlanExercises(planId) as Promise<PlanExercise[]>,
    trainingSessionStore.getExecutionsForSession(sessionId),
    trainingSessionStore.getSessionsForPlan(planId),
  ])

  const execByPlanExercise = Object.fromEntries(
    executions.map(e => [e.training_plan_exercise_id, e])
  )

  rows.value = exercises.map(ex => {
    const exec = execByPlanExercise[ex.id]
    return {
      plan_exercise_id: ex.id,
      name: ex.exercise_name,
      sets_done: exec?.sets_done != null ? String(exec.sets_done) : '',
      reps: exec?.reps != null ? String(exec.reps) : '',
      weight: exec?.weight != null ? String(exec.weight) : '',
    }
  })

  const today = new Date().toISOString().split('T')[0]
  const thisSession = (sessions as Array<{ id: number; performed_date: string }>).find(s => s.id === sessionId)
  performedDate.value = thisSession?.performed_date ? String(thisSession.performed_date) : today
})

async function submit() {
  loading.value = true
  try {
    const executions = rows.value
      .filter(r => r.sets_done || r.reps || r.weight)
      .map(r => ({
        training_plan_exercise_id: r.plan_exercise_id,
        sets_done: r.sets_done ? Number(r.sets_done) : undefined,
        reps: r.reps ? Number(r.reps) : undefined,
        weight: r.weight ? Number(r.weight) : undefined,
      }))

    await trainingSessionStore.updateTrainingSession(sessionId, { executions })
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-black text-white pb-24">
    <div class="px-4 pt-8 pb-4 flex items-center gap-3">
      <button @click="router.back()" class="text-gray-400 p-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold tracking-tight">Editar treino</h1>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <!-- Exercises -->
      <div class="flex flex-col gap-3">
        <label class="text-xs text-gray-500 font-medium uppercase tracking-wide">Exercícios</label>

        <div
          v-for="row in rows"
          :key="row.plan_exercise_id"
          class="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-3"
        >
          <p class="font-semibold text-sm">{{ row.name }}</p>

          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] text-gray-500 text-center">Séries</label>
              <input
                v-model="row.sets_done"
                type="number"
                min="0"
                placeholder="—"
                class="bg-gray-800 rounded-lg px-2 py-2 text-center text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] text-gray-500 text-center">Reps</label>
              <input
                v-model="row.reps"
                type="number"
                min="0"
                placeholder="—"
                class="bg-gray-800 rounded-lg px-2 py-2 text-center text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] text-gray-500 text-center">Peso (kg)</label>
              <input
                v-model="row.weight"
                type="number"
                min="0"
                step="0.5"
                placeholder="—"
                class="bg-gray-800 rounded-lg px-2 py-2 text-center text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>
          </div>

          <p
            v-if="!row.sets_done && !row.reps && !row.weight"
            class="text-[10px] text-gray-600 text-center"
          >
            Vazio — será removido ao salvar
          </p>
        </div>

        <p v-if="!rows.length" class="text-gray-600 text-center text-sm py-4">
          Nenhum exercício encontrado.
        </p>
      </div>

      <button
        @click="submit"
        :disabled="!hasAnyValue || loading"
        class="w-full py-3 rounded-xl font-semibold text-base transition-colors"
        :class="hasAnyValue && !loading ? 'bg-green-700 active:bg-green-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'"
      >
        {{ loading ? 'Salvando...' : 'Salvar alterações' }}
      </button>
    </div>
  </main>
</template>
