<script setup lang="ts">
import { useExerciseStore, type PaginatedExerciseResponse } from '@/stores/exercise'
import { useDayStore, type Day } from '@/stores/day'
import { useTrainingPlanStore } from '@/stores/training_plan'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'

const route = useRoute()
const trainingPlanStore = useTrainingPlanStore()
const exerciseStore = useExerciseStore()
const dayStore = useDayStore()
const authStore = useAuthStore()

const planId = Number(route.params.id)

const days = ref<Day[]>([])
const selectedDayId = ref(0)
const selectedExercises = ref<number[]>([])
const allPlans = ref<{ id: number; day_name: string }[]>([])
const loading = ref(false)

const exerciseData = ref<PaginatedExerciseResponse>({
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  pages: 1,
})
const filterName = ref('')
const filterType = ref('')
const currentPage = ref(1)

const usedDayNames = computed(() =>
  allPlans.value.filter(p => p.id !== planId).map(p => p.day_name)
)

function isDayUsed(d: Day) {
  return usedDayNames.value.includes(d.name)
}

function isSelected(exerciseId: number) {
  return selectedExercises.value.includes(exerciseId)
}

function toggleExercise(exerciseId: number) {
  const idx = selectedExercises.value.indexOf(exerciseId)
  if (idx >= 0) {
    selectedExercises.value.splice(idx, 1)
  } else {
    selectedExercises.value.push(exerciseId)
  }
}

const canSubmit = computed(() => selectedDayId.value > 0 && selectedExercises.value.length > 0)

async function fetchExercises() {
  exerciseData.value = await exerciseStore.getExercises({
    page: currentPage.value,
    limit: 10,
    name: filterName.value || undefined,
    type: filterType.value || undefined,
  })
}

function prevPage() {
  if (currentPage.value > 1) { currentPage.value--; fetchExercises() }
}

function nextPage() {
  if (currentPage.value < exerciseData.value.pages) { currentPage.value++; fetchExercises() }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(filterName, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { currentPage.value = 1; fetchExercises() }, 500)
})

watch(filterType, () => { currentPage.value = 1; fetchExercises() })

onUnmounted(() => { if (debounceTimer) clearTimeout(debounceTimer) })

async function onSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await trainingPlanStore.updateTrainingPlan(planId, {
      day_id: selectedDayId.value,
      exercises: selectedExercises.value.map(id => ({ exercise_id: id })),
    })
    router.push('/training_plan')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [daysRes, plansRes, planExercises] = await Promise.all([
    dayStore.getDays(),
    trainingPlanStore.getTrainingPlans(authStore.userId ?? 0),
    trainingPlanStore.getTrainingPlanExercises(planId),
    fetchExercises(),
  ])

  days.value = daysRes
  allPlans.value = plansRes

  const thisPlan = plansRes.find((p: { id: number }) => p.id === planId)
  if (thisPlan) {
    const match = daysRes.find((d: Day) => d.name === thisPlan.day_name)
    if (match) selectedDayId.value = match.id
  }

  selectedExercises.value = planExercises.map((e: { exercise_id: number }) => e.exercise_id)
})
</script>

<template>
  <main class="min-h-screen bg-black text-white pb-24">
    <div class="px-4 pt-8 pb-4 flex items-center gap-3">
      <button @click="router.back()" class="text-gray-400 p-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold tracking-tight">Editar ficha</h1>
    </div>

    <div class="flex flex-col gap-6 px-4">
      <!-- Seletor de dia -->
      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-400 font-medium">Dia da semana</label>
        <select v-model="selectedDayId"
          class="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white w-full appearance-none">
          <option :value="0" disabled>-- Selecione o dia --</option>
          <option v-for="d in days" :key="d.id" :value="d.id" :disabled="isDayUsed(d)"
            :class="isDayUsed(d) ? 'text-gray-600' : ''">
            {{ d.name }}{{ isDayUsed(d) ? ' (em uso)' : '' }}
          </option>
        </select>
      </div>

      <!-- Filtros de exercícios -->
      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-400 font-medium">Exercícios</label>
        <div class="flex gap-2">
          <input v-model="filterName" type="text" placeholder="Buscar por nome..."
            class="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 w-20 text-white placeholder-gray-600 flex-1 text-sm" />
          <select v-model="filterType"
            class="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm">
            <option value="">Todos</option>
            <option value="superior">Superior</option>
            <option value="inferior">Inferior</option>
            <option value="posterior">Posterior</option>
          </select>
        </div>
      </div>

      <!-- Lista de exercícios -->
      <div class="flex flex-col gap-1">
        <label v-for="exercise in exerciseData.items" :key="exercise.id"
          class="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-gray-900 transition-colors cursor-pointer"
          :class="isSelected(exercise.id) ? 'bg-gray-900 border border-gray-700' : 'border border-transparent'">
          <input type="checkbox" :checked="isSelected(exercise.id)" @change="toggleExercise(exercise.id)"
            class="w-4 h-4 accent-green-500 shrink-0" />
          <span class="flex-1 text-sm">{{ exercise.name }}</span>
          <span class="text-xs text-gray-500">{{ exercise.type }}</span>
        </label>
        <p v-if="exerciseData.items.length === 0" class="text-gray-600 text-center py-6 text-sm">
          Nenhum exercício encontrado.
        </p>
      </div>

      <!-- Paginação -->
      <div class="flex items-center justify-between">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-30 text-sm">←</button>
        <span class="text-sm text-gray-500">{{ currentPage }} / {{ exerciseData.pages }}</span>
        <button @click="nextPage" :disabled="currentPage === exerciseData.pages"
          class="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-30 text-sm">→</button>
      </div>

      <p class="text-center text-sm" :class="selectedExercises.length ? 'text-gray-400' : 'text-red-400'">
        {{ selectedExercises.length }} exercício(s) selecionado(s)
      </p>

      <button @click="onSubmit" :disabled="!canSubmit || loading"
        class="w-full py-3 rounded-xl font-semibold text-base transition-colors"
        :class="canSubmit && !loading ? 'bg-green-700 active:bg-green-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'">
        {{ loading ? 'Salvando...' : 'Salvar alterações' }}
      </button>
    </div>
  </main>
</template>
