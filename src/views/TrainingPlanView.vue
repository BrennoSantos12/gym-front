<script setup lang="ts">
import { useExerciseStore, type PaginatedExerciseResponse } from '@/stores/exercise';
import { useTrainingStore, type Training } from '@/stores/training';
import { useDayStore, type Day } from '@/stores/day';
import { useTrainingPlanStore, type TrainingName } from '@/stores/training_plan';
import { useAuthStore } from '@/stores/auth';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { useFieldArray, useForm } from 'vee-validate';
import router from '@/router';

const trainingStore = useTrainingStore()
const exerciseStore = useExerciseStore()
const dayStore = useDayStore()

const days = ref<Day[]>([])
const trainings = ref<Training[]>([])
const existingPlans = ref<TrainingName[]>([])
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


const schema = z.object({
  day_id: z.number(),
  training_id: z.number(),
  exercises: z.object({
    exercise_id: z.number()
  }).array()
})

const { defineField, handleSubmit } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    day_id: 0,
    training_id: 0,
    exercises: [],
  }
})

const [day] = defineField('day_id')
const [training] = defineField('training_id')

const { remove: removeExercise, push: pushExercise, fields: exerciseFields } = useFieldArray('exercises') as any

function isSelected(id: number) {
  return exerciseFields.value.some((f: any) => f.value.exercise_id === id)
}

function toggleExercise(id: number) {
  const idx = exerciseFields.value.findIndex((f: any) => f.value.exercise_id === id)
  if (idx >= 0) {
    removeExercise(idx)
  } else {
    pushExercise({ exercise_id: id })
  }
}

const trainingPlanStore = useTrainingPlanStore()
const { userId } = useAuthStore()

const usedDayNames = computed(() => existingPlans.value.map(p => p.day_name))
const usedTrainingNames = computed(() => existingPlans.value.map(p => p.training_name))

function isDayUsed(d: Day) {
  return usedDayNames.value.includes(d.name)
}

function isTrainingUsed(t: Training) {
  return usedTrainingNames.value.includes(t.name)
}

const canSubmit = computed(() =>
  (day.value ?? 0) > 0 &&
  (training.value ?? 0) > 0 &&
  exerciseFields.value.length > 0
)

const onSubmit = handleSubmit(async (values) => {
  await trainingPlanStore.createTrainingPlan({ ...values, user_id: userId ?? 0 })
  router.push('/training_plan')
})

async function fetchExercises() {
  exerciseData.value = await exerciseStore.getExercises({
    page: currentPage.value,
    limit: 10,
    name: filterName.value || undefined,
    type: filterType.value || undefined,
  })
}

onMounted(async () => {
  trainings.value = await trainingStore.getTrainings()
  days.value = await dayStore.getDays()
  existingPlans.value = await trainingPlanStore.getTrainingPlans(userId ?? 0)
  await fetchExercises()
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(filterName, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchExercises()
  }, 500)
})

watch(filterType, () => {
  currentPage.value = 1
  fetchExercises()
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchExercises()
  }
}

function nextPage() {
  if (currentPage.value < exerciseData.value.pages) {
    currentPage.value++
    fetchExercises()
  }
}

function clearSelect() {
  while (exerciseFields.value.length > 0) {
    removeExercise(0)
  }
}

</script>

<template>
  <main class="min-h-screen bg-black text-white pb-24">
    <div class="px-4 pt-8 pb-4">
      <h1 class="text-2xl font-bold tracking-tight">Criar ficha</h1>
    </div>

    <div class="flex flex-col gap-6 px-4">
      <!-- Seletores de dia e treino -->
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-400 font-medium">Dia da semana</label>
          <select v-model="day" class="bg-gray-900 border rounded-xl px-4 py-3 text-white w-full appearance-none"
            :class="(day ?? 0) === 0 ? 'border-red-500' : 'border-gray-700'">
            <option :value="0" disabled>-- Selecione o dia --</option>
            <option v-for="d in days" :key="d.id" :value="d.id" :disabled="isDayUsed(d)"
              :class="isDayUsed(d) ? 'text-gray-600' : ''">
              {{ d.name }}{{ isDayUsed(d) ? ' (em uso)' : '' }}
            </option>
          </select>
          <span v-if="(day ?? 0) === 0" class="text-xs text-red-400 px-1">Selecione um dia</span>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-400 font-medium">Treino</label>
          <select v-model="training" class="bg-gray-900 border rounded-xl px-4 py-3 text-white w-full appearance-none"
            :class="(training ?? 0) === 0 ? 'border-red-500' : 'border-gray-700'">
            <option :value="0" disabled>-- Selecione o treino --</option>
            <option v-for="t in trainings" :key="t.id" :value="t.id" :disabled="isTrainingUsed(t)"
              :class="isTrainingUsed(t) ? 'text-gray-600' : ''">
              {{ t.name }}{{ isTrainingUsed(t) ? ' (em uso)' : '' }}
            </option>
          </select>
          <span v-if="(training ?? 0) === 0" class="text-xs text-red-400 px-1">Selecione um treino</span>
        </div>
      </div>

      <!-- Filtros -->
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
          class="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors"
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

      <!-- Paginação + limpar -->
      <div class="flex items-center justify-between">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-30 text-sm">←</button>
        <span class="text-sm text-gray-500">{{ currentPage }} / {{ exerciseData.pages }}</span>
        <button @click="nextPage" :disabled="currentPage === exerciseData.pages"
          class="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-30 text-sm">→</button>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm" :class="exerciseFields.length ? 'text-gray-400' : 'text-red-400'">
          {{ exerciseFields.length }} exercício(s) selecionado(s)
        </p>
        <button @click="clearSelect()" type="button"
          class="text-xs text-red-500 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
          Limpar todos
        </button>
      </div>

      <button @click="onSubmit" type="button" :disabled="!canSubmit"
        class="w-full py-3 rounded-xl font-semibold text-base transition-colors"
        :class="canSubmit ? 'bg-green-700 active:bg-green-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'">
        Salvar ficha
      </button>
    </div>
  </main>
</template>
