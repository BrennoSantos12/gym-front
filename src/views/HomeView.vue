<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth'
import { useTrainingPlanStore, type TrainingName } from '@/stores/training_plan';
import { useTrainingSessionStore } from '@/stores/training_session';


const trainingPlanStore = useTrainingPlanStore()
const trainingSessionStore = useTrainingSessionStore()
const authStore = useAuthStore()

const TodayTraining = ref<TrainingName | null>(null)
const Trainings = ref<TrainingName[] | null>(null)
const todaySessionExists = ref(false)
const todaySessionId = ref<number | null>(null)
const otherSessionsExist = ref<Record<number, boolean>>({})
const otherSessionIds = ref<Record<number, number | null>>({})

const dayOrder: Record<string, number> = {
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
  'Domingo': 0,
}

const todayIndex = new Date().getDay()

function trainingStatus(dayName: string): 'late' | 'early' | null {
  const idx = dayOrder[dayName]
  if (idx === undefined) return null
  if (idx < todayIndex) return 'late'
  if (idx > todayIndex) return 'early'
  return null
}

onMounted(async () => {
  try {
    TodayTraining.value = await trainingPlanStore.getTodayTraining(authStore.userId ?? 0)
  } catch {
    TodayTraining.value = null
  }
  if (TodayTraining.value?.id) {
    try {
      const res = await trainingSessionStore.getThisWeekSession(TodayTraining.value.id)
      todaySessionExists.value = res.exists
      todaySessionId.value = res.session_id
    } catch {
      todaySessionExists.value = false
    }
  }
  try {
    Trainings.value = await trainingPlanStore.getTrainingPlans(authStore.userId ?? 0)
  } catch {
    Trainings.value = null
  }
  const others = Trainings.value?.filter(t => t.id !== TodayTraining.value?.id) ?? []
  await Promise.all(
    others.map(async (t) => {
      try {
        const res = await trainingSessionStore.getThisWeekSession(t.id)
        otherSessionsExist.value[t.id] = res.exists
        otherSessionIds.value[t.id] = res.session_id
      } catch {
        otherSessionsExist.value[t.id] = false
        otherSessionIds.value[t.id] = null
      }
    })
  )
})

</script>

<template>
  <main class="flex flex-col items-center justify-center h-full mt-40 text-white gap-10">
    <div class="text-center">
      <div v-if="todaySessionExists"
        class="border-2 border-green-500 h-full w-full text-center text-green-500 flex flex-col items-center justify-center text-4xl p-4 gap-2">
        <span class="text-lg font-semibold opacity-80">O {{ TodayTraining?.training_name }} de {{
          TodayTraining?.day_name }} foi concluído hoje!</span>
        <router-link
          v-if="todaySessionId"
          :to="`/edit_training_session/${todaySessionId}?plan_id=${TodayTraining?.id}`"
          class="text-xs text-green-400 opacity-70 flex items-center gap-1 mt-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
          editar
        </router-link>
      </div>
      <div v-else
        class="border-2 h-full w-full text-center text-blue-500 flex flex-col items-center justify-center text-4xl p-4">
        <h1 v-if="TodayTraining">Treino de hoje:</h1>
        <router-link v-if="!Trainings?.length" :to="'/training_plan'">
          Você precisa criar uma ficha
        </router-link>
        <router-link v-else-if="TodayTraining?.training_name" :to="`/create_training_session/${TodayTraining?.id}`">
          {{ TodayTraining?.training_name }}
          <br>
          {{ TodayTraining?.day_name ? TodayTraining?.day_name : '' }}
        </router-link>
        <div v-else-if="!TodayTraining?.training_name">
          <h1>Sem treinos para hoje, bom descanso.</h1>
        </div>
      </div>
    </div>
    <div class="text-center flex flex-col gap-2">
      <h1 class="text-extrabold mb-4" v-if="Trainings?.filter(t => t.id !== TodayTraining?.id).length">
        Treinos para fazer atrasado ou adiantar
      </h1>
      <div v-for="training in Trainings?.filter(t => t.id !== TodayTraining?.id)" :key="training.id"
        class="border-2 h-20 flex items-center justify-center gap-3 px-4" :class="otherSessionsExist[training.id]
          ? 'border-green-600 text-green-500'
          : {
            'border-red-600 text-red-500': trainingStatus(training.day_name) === 'late',
            'border-orange-500 text-orange-400': trainingStatus(training.day_name) === 'early',
            'border-gray-500 text-gray-300': trainingStatus(training.day_name) === null,
          }">
        <template v-if="otherSessionsExist[training.id]">
          <span>{{ training.training_name }}</span>
          <span class="text-sm opacity-70">{{ training.day_name }}</span>
          <span class="text-xs font-bold">concluído</span>
          <router-link
            v-if="otherSessionIds[training.id]"
            :to="`/edit_training_session/${otherSessionIds[training.id]}?plan_id=${training.id}`"
            class="ml-1 opacity-60"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H8v-2.414a2 2 0 01.586-1.414z" />
            </svg>
          </router-link>
        </template>
        <router-link v-else :to="`/create_training_session/${training.id}`"
          class="flex items-center justify-center gap-3 w-full h-full">
          <span>{{ training.training_name }}</span>
          <span class="text-sm opacity-70">{{ training.day_name }}</span>
          <span v-if="trainingStatus(training.day_name) === 'late'" class="text-xs font-bold">atrasado</span>
          <span v-else-if="trainingStatus(training.day_name) === 'early'" class="text-xs font-bold">adiantar</span>
        </router-link>
      </div>
    </div>
  </main>
</template>
