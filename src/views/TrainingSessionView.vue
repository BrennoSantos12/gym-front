<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTrainingPlanStore } from '@/stores/training_plan'
import { useTrainingSessionStore } from '@/stores/training_session'
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref, computed } from 'vue'
import z from 'zod'
import router from '@/router'

const serieSchema = z.object({
  reps: z.number({ invalid_type_error: 'Informe as repetições' }).int().min(1, 'Mínimo 1 repetição'),
  weight: z.number({ invalid_type_error: 'Informe o peso' }).min(0, 'Peso mínimo 0'),
})

type Serie = z.infer<typeof serieSchema>

type PlanExercise = {
  id: number
  training_plan_id: number
  exercise_id: number
  exercise_name: string
}

const route = useRoute()
const trainingPlanStore = useTrainingPlanStore()
const trainingSessionStore = useTrainingSessionStore()
const authStore = useAuthStore()

const planId = route.params.id as string

const exercises = ref<PlanExercise[]>([])
const currentIndex = ref(0)
const seriesByExercise = ref<Serie[][]>([])
const newReps = ref<number | ''>('')
const newWeight = ref<number | ''>('')
const fieldErrors = ref<{ reps?: string; weight?: string }>({})
const loading = ref(false)
const showConfirm = ref(false)
const emptyExercises = ref<string[]>([])

const currentExercise = computed(() => exercises.value[currentIndex.value])
const currentSeries = computed(() => seriesByExercise.value[currentIndex.value] ?? [])
const canSubmit = computed(() => seriesByExercise.value.some(s => s.length > 0))

onMounted(async () => {
  const data: PlanExercise[] = await trainingPlanStore.getTrainingPlanExercises(planId)
  exercises.value = data
  seriesByExercise.value = data.map(() => [])
})

function addSerie() {
  fieldErrors.value = {}
  const result = serieSchema.safeParse({
    reps: newReps.value === '' ? undefined : Number(newReps.value),
    weight: newWeight.value === '' ? undefined : Number(newWeight.value),
  })
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors
    fieldErrors.value = {
      reps: flat.reps?.[0],
      weight: flat.weight?.[0],
    }
    return
  }
  seriesByExercise.value[currentIndex.value] = [
    ...seriesByExercise.value[currentIndex.value],
    result.data,
  ]
  newReps.value = ''
  newWeight.value = ''
}

function removeSerie(idx: number) {
  seriesByExercise.value[currentIndex.value] = seriesByExercise.value[currentIndex.value].filter(
    (_, i) => i !== idx,
  )
}

function prevExercise() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    fieldErrors.value = {}
    newReps.value = ''
    newWeight.value = ''
  }
}

function nextExercise() {
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value++
    fieldErrors.value = {}
    newReps.value = ''
    newWeight.value = ''
  }
}

function requestSubmit() {
  const empty = exercises.value
    .filter((_, i) => seriesByExercise.value[i]?.length === 0)
    .map(e => e.exercise_name)
  emptyExercises.value = empty
  showConfirm.value = true
}

async function submit() {
  showConfirm.value = false
  loading.value = true
  try {
    const executions = exercises.value
      .map((ex, i) => {
        const series = seriesByExercise.value[i]
        if (!series.length) return null
        const sets_done = series.length
        const totalReps = series.reduce((acc, s) => acc + s.reps, 0)
        const avgReps = Math.round(totalReps / sets_done)
        const avgWeight = parseFloat(
          (series.reduce((acc, s) => acc + s.weight * s.reps, 0) / totalReps).toFixed(1),
        )
        return {
          training_plan_exercise_id: ex.id,
          sets_done,
          reps: avgReps,
          weight: avgWeight,
        }
      })
      .filter(Boolean) as { training_plan_exercise_id: number; sets_done: number; reps: number; weight: number }[]

    await trainingSessionStore.createTrainingSession({
      user_id: authStore.userId ?? 0,
      training_plan_id: Number(planId),
      performed_date: new Date().toISOString().split('T')[0],
      executions,
    })
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-black text-white flex flex-col items-center pt-16 px-4">
    <div v-if="exercises.length" class="w-full max-w-md flex flex-col items-center gap-6">

      <!-- Cabeçalho do exercício -->
      <div class="text-center">
        <p class="text-gray-500 text-sm">{{ currentIndex + 1 }} / {{ exercises.length }}</p>
        <h1 class="text-3xl font-bold mt-1">{{ currentExercise?.exercise_name }}</h1>
      </div>

      <!-- Tabela de séries -->
      <div class="w-full">
        <table class="w-full text-center">
          <thead>
            <tr class="text-gray-400 text-sm border-b border-gray-700">
              <th class="py-2 font-normal">Série</th>
              <th class="py-2 font-normal">Repetições</th>
              <th class="py-2 font-normal">Peso (kg)</th>
              <th class="py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(serie, i) in currentSeries" :key="i" class="border-b border-gray-800 text-sm">
              <td class="py-3 text-gray-400">{{ i + 1 }}</td>
              <td class="py-3">{{ serie.reps }}</td>
              <td class="py-3">{{ serie.weight }}</td>
              <td class="py-3">
                <button @click="removeSerie(i)" type="button" class="text-red-500 hover:text-red-400 text-xs px-1">
                  ✕
                </button>
              </td>
            </tr>
            <tr v-if="!currentSeries.length">
              <td colspan="4" class="py-5 text-gray-600 text-sm">Nenhuma série registrada</td>
            </tr>
          </tbody>
        </table>
        <p class="text-gray-500 text-xs mt-1 text-right">
          {{ currentSeries.length }} série(s)
        </p>
      </div>

      <!-- Inputs para adicionar série -->
      <div class="flex gap-3 items-end w-full">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-gray-400">Repetições</label>
          <input v-model.number="newReps" type="number" min="1" placeholder="10"
            class="bg-gray-800 rounded px-3 py-2 w-full text-center focus:outline-none focus:ring-1 focus:ring-green-600"
            :class="fieldErrors.reps ? 'ring-1 ring-red-500' : ''" @keyup.enter="addSerie" />
          <span v-if="fieldErrors.reps" class="text-red-400 text-xs">{{ fieldErrors.reps }}</span>
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-gray-400">Peso (kg)</label>
          <input v-model.number="newWeight" type="number" min="0" step="0.5" placeholder="10"
            class="bg-gray-800 rounded px-3 py-2 w-full text-center focus:outline-none focus:ring-1 focus:ring-green-600"
            :class="fieldErrors.weight ? 'ring-1 ring-red-500' : ''" @keyup.enter="addSerie" />
          <span v-if="fieldErrors.weight" class="text-red-400 text-xs">{{ fieldErrors.weight }}</span>
        </div>
        <button @click="addSerie" type="button"
          class="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
          + Série
        </button>
      </div>

      <!-- Navegação entre exercícios -->
      <div class="flex items-center justify-between w-full mt-2">
        <button @click="prevExercise" :disabled="currentIndex === 0" type="button"
          class="text-2xl px-5 py-3 bg-gray-800 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors">
          ←
        </button>
        <span class="text-gray-600 text-xs">navegar exercícios</span>
        <button @click="nextExercise" :disabled="currentIndex === exercises.length - 1" type="button"
          class="text-2xl px-5 py-3 bg-gray-800 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors">
          →
        </button>
      </div>

      <!-- Finalizar treino -->
      <button @click="requestSubmit" :disabled="!canSubmit || loading" type="button"
        class="w-full py-3 rounded-xl font-semibold text-lg mt-2 transition-colors" :class="canSubmit && !loading
          ? 'bg-green-700 hover:bg-green-600'
          : 'bg-gray-700 opacity-50 cursor-not-allowed'">
        {{ loading ? 'Enviando...' : 'Finalizar treino' }}
      </button>
    </div>

    <div v-else class="text-gray-500 mt-20 text-lg">Carregando exercícios...</div>
  </main>

  <!-- Modal de confirmação -->
  <Teleport to="body">
    <div
      v-if="showConfirm"
      class="fixed inset-0 bg-black/80 flex items-end justify-center z-50 px-4 pb-8"
    >
      <div class="bg-gray-900 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div class="text-center">
          <p class="text-lg font-semibold">Concluir treino?</p>
        </div>

        <div v-if="emptyExercises.length" class="bg-gray-800 rounded-xl px-4 py-3 flex flex-col gap-1">
          <p class="text-sm text-orange-400 font-medium mb-1">Exercícios sem registro:</p>
          <p
            v-for="name in emptyExercises"
            :key="name"
            class="text-sm text-gray-300"
          >
            · {{ name }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <button
            @click="submit"
            class="w-full py-3 rounded-xl bg-green-700 font-semibold text-sm active:bg-green-600"
          >
            Concluir assim mesmo
          </button>
          <button
            @click="showConfirm = false"
            class="w-full py-3 rounded-xl bg-gray-800 font-semibold text-sm text-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
