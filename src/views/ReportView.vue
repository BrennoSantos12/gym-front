<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReportStore, type TrainingPlanReportItem, type ExerciseProgressReport, type ExerciseExecutionStats } from '@/stores/report'
import { useTrainingPlanStore, type TrainingName } from '@/stores/training_plan'
import { useTrainingSessionStore } from '@/stores/training_session'

const authStore = useAuthStore()
const reportStore = useReportStore()
const trainingPlanStore = useTrainingPlanStore()
const trainingSessionStore = useTrainingSessionStore()

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

const today = new Date()
const defaultStart = new Date()
defaultStart.setDate(today.getDate() - 30)

const startDate = ref('')
const endDate = ref(formatDate(today))

const planAdherence = ref<TrainingPlanReportItem[]>([])
const trainingNames = ref<TrainingName[]>([])
const exerciseProgress = ref<Record<number, ExerciseProgressReport[]>>({})
const expandedPlan = ref<number | null>(null)
const loadingExercises = ref<Record<number, boolean>>({})
const loading = ref(false)

async function resolveStartDate() {
  const planIds = trainingNames.value.map((t) => t.id)
  const dates = await Promise.all(planIds.map((id) => trainingSessionStore.getFirstDate(id).catch(() => null)))
  const earliest = dates.filter(Boolean).sort()[0]
  startDate.value = earliest ?? formatDate(today)
}

function getTrainingName(planId: number): TrainingName | undefined {
  return trainingNames.value.find((t) => t.id === planId)
}

async function loadReport() {
  loading.value = true
  try {
    planAdherence.value = await reportStore.getPlanAdherence(
      authStore.userId ?? 0,
      startDate.value,
      endDate.value,
    )
  } finally {
    loading.value = false
  }
}

async function togglePlan(planId: number) {
  if (expandedPlan.value === planId) {
    expandedPlan.value = null
    return
  }
  expandedPlan.value = planId
  if (!exerciseProgress.value[planId]) {
    loadingExercises.value[planId] = true
    try {
      exerciseProgress.value[planId] = await reportStore.getExerciseProgress(
        planId,
        startDate.value,
        endDate.value,
      )
    } finally {
      loadingExercises.value[planId] = false
    }
  }
}

function doneTotal(item: TrainingPlanReportItem) {
  return item.done_right_day + item.done_early + item.done_wrong_day
}

function adherencePercent(item: TrainingPlanReportItem) {
  const done = doneTotal(item)
  const denominator = Math.max(item.planned_total, done)
  if (!denominator) return 0
  return Math.round((done / denominator) * 100)
}

function adherenceColor(pct: number) {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#f97316'
  return '#ef4444'
}

function formatExec(exec: ExerciseExecutionStats | null): string {
  if (!exec) return '—'
  const parts: string[] = []
  if (exec.sets_done) parts.push(`${exec.sets_done}x`)
  if (exec.reps) parts.push(`${exec.reps} reps`)
  if (exec.weight) parts.push(`${exec.weight}kg`)
  return parts.length ? parts.join(' · ') : '—'
}

function formatExecDate(exec: ExerciseExecutionStats | null): string {
  if (!exec) return ''
  return exec.performed_date
}

function improvementColor(pct: number | null): string {
  if (pct === null) return '#6b7280'
  if (pct > 0) return '#22c55e'
  if (pct < 0) return '#ef4444'
  return '#6b7280'
}

function frequencyPercent(ex: ExerciseProgressReport): number {
  const total = ex.times_performed + ex.times_skipped
  if (!total) return 0
  return Math.round((ex.times_performed / total) * 100)
}

function frequencyColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#f97316'
  return '#ef4444'
}

onMounted(async () => {
  try {
    trainingNames.value = await trainingPlanStore.getTrainingPlans(authStore.userId ?? 0)
  } catch {}
  await resolveStartDate()
  await loadReport()
})
</script>

<template>
  <main class="min-h-screen bg-black text-white pb-24">
    <!-- Header -->
    <div class="px-4 pt-8 pb-6">
      <h1 class="text-2xl font-bold tracking-tight">Relatório</h1>
      <p class="text-sm text-gray-400 mt-1">Desde o início</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!planAdherence.length" class="px-4 text-center text-gray-500 py-16">
      Nenhum plano encontrado no período.
    </div>

    <!-- Plans list -->
    <div v-else class="flex flex-col gap-3 px-4">
      <div
        v-for="item in planAdherence"
        :key="item.training_plan_id"
        class="rounded-xl border border-gray-800 overflow-hidden"
      >
        <!-- Plan header (clickable) -->
        <button
          class="w-full text-left px-4 py-4 flex flex-col gap-3 active:bg-gray-900 transition-colors"
          @click="togglePlan(item.training_plan_id)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-base leading-tight">
                {{ getTrainingName(item.training_plan_id)?.training_name ?? `Plano ${item.training_plan_id}` }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ getTrainingName(item.training_plan_id)?.day_name ?? '' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-xl font-bold"
                :style="{ color: adherenceColor(adherencePercent(item)) }"
              >{{ adherencePercent(item) }}%</span>
              <svg
                class="w-4 h-4 text-gray-500 transition-transform duration-200"
                :class="expandedPlan === item.training_plan_id ? 'rotate-180' : ''"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Adherence bar -->
          <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              class="h-full bg-green-500"
              :style="{ width: item.planned_total ? (item.done_right_day / item.planned_total * 100) + '%' : '0%' }"
            />
            <div
              class="h-full bg-blue-500"
              :style="{ width: item.planned_total ? (item.done_early / item.planned_total * 100) + '%' : '0%' }"
            />
            <div
              class="h-full bg-orange-500"
              :style="{ width: item.planned_total ? (item.done_wrong_day / item.planned_total * 100) + '%' : '0%' }"
            />
            <div
              class="h-full bg-gray-700"
              :style="{ width: item.planned_total ? (item.not_done / item.planned_total * 100) + '%' : '0%' }"
            />
          </div>

          <!-- Stats row -->
          <div class="grid grid-cols-4 gap-1 text-center">
            <div>
              <p class="text-green-400 font-bold text-base">{{ item.done_right_day }}</p>
              <p class="text-gray-500 text-[10px] leading-tight">no dia</p>
            </div>
            <div>
              <p class="text-blue-400 font-bold text-base">{{ item.done_early }}</p>
              <p class="text-gray-500 text-[10px] leading-tight">adiantado</p>
            </div>
            <div>
              <p class="text-orange-400 font-bold text-base">{{ item.done_wrong_day }}</p>
              <p class="text-gray-500 text-[10px] leading-tight">atrasado</p>
            </div>
            <div>
              <p class="text-gray-500 font-bold text-base">{{ item.not_done }}</p>
              <p class="text-gray-500 text-[10px] leading-tight">não feito</p>
            </div>
          </div>
        </button>

        <!-- Expanded: exercise progress -->
        <div v-if="expandedPlan === item.training_plan_id" class="border-t border-gray-800">
          <!-- Loading exercises -->
          <div v-if="loadingExercises[item.training_plan_id]" class="flex justify-center py-8">
            <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>

          <!-- Empty exercises -->
          <div
            v-else-if="!exerciseProgress[item.training_plan_id]?.length"
            class="px-4 py-6 text-center text-gray-600 text-sm"
          >
            Sem execuções no período.
          </div>

          <!-- Exercise cards -->
          <div v-else class="flex flex-col divide-y divide-gray-800">
            <div
              v-for="ex in exerciseProgress[item.training_plan_id]"
              :key="ex.exercise_id"
              class="px-4 py-4 flex flex-col gap-3"
            >
              <!-- Exercise header -->
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-sm leading-tight">{{ ex.exercise_name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">{{ ex.exercise_type }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p
                    class="text-base font-bold"
                    :style="{ color: improvementColor(ex.improvement_percentage) }"
                  >
                    <template v-if="ex.improvement_percentage !== null">
                      {{ ex.improvement_percentage > 0 ? '+' : '' }}{{ ex.improvement_percentage }}%
                    </template>
                    <template v-else>—</template>
                  </p>
                  <p class="text-[10px] text-gray-600">evolução</p>
                </div>
              </div>

              <!-- Performed / skipped / frequency -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex gap-4 text-sm">
                    <span>
                      <span class="font-bold text-white">{{ ex.times_performed }}</span>
                      <span class="text-gray-500 ml-1">feitos</span>
                    </span>
                    <span>
                      <span class="font-bold text-gray-500">{{ ex.times_skipped }}</span>
                      <span class="text-gray-500 ml-1">pulados</span>
                    </span>
                  </div>
                  <span
                    class="text-sm font-bold"
                    :style="{ color: frequencyColor(frequencyPercent(ex)) }"
                  >{{ frequencyPercent(ex) }}%</span>
                </div>
                <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: frequencyPercent(ex) + '%',
                      backgroundColor: frequencyColor(frequencyPercent(ex)),
                    }"
                  />
                </div>
              </div>

              <!-- Executions: first / best / last -->
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-gray-900 rounded-lg px-2 py-2">
                  <p class="text-[10px] text-gray-500 mb-1">Primeira</p>
                  <p class="text-xs font-semibold leading-snug">{{ formatExec(ex.first_execution) }}</p>
                  <p class="text-[9px] text-gray-600 mt-0.5">{{ formatExecDate(ex.first_execution) }}</p>
                </div>
                <div class="bg-gray-900 rounded-lg px-2 py-2 ring-1 ring-yellow-600/40">
                  <p class="text-[10px] text-yellow-500 mb-1">Recorde</p>
                  <p class="text-xs font-semibold leading-snug">{{ formatExec(ex.best_execution) }}</p>
                  <p class="text-[9px] text-gray-600 mt-0.5">{{ formatExecDate(ex.best_execution) }}</p>
                </div>
                <div class="bg-gray-900 rounded-lg px-2 py-2">
                  <p class="text-[10px] text-gray-500 mb-1">Última</p>
                  <p class="text-xs font-semibold leading-snug">{{ formatExec(ex.last_execution) }}</p>
                  <p class="text-[9px] text-gray-600 mt-0.5">{{ formatExecDate(ex.last_execution) }}</p>
                </div>
              </div>

              <!-- Improvement summary -->
              <p v-if="ex.improvement_summary" class="text-xs text-gray-400 italic">
                {{ ex.improvement_summary }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
