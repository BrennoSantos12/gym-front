<script setup lang="ts">
import { useTrainingPlanStore, type TrainingName } from '@/stores/training_plan'
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref } from 'vue'
import router from '@/router'

const authStore = useAuthStore()
const trainingPlanStore = useTrainingPlanStore()

const trainingPlans = ref<TrainingName[]>([])
const planToDelete = ref<TrainingName | null>(null)
const deleting = ref(false)

onMounted(async () => {
  trainingPlans.value = await trainingPlanStore.getTrainingPlans(authStore.userId ?? 0)
})

function confirmDelete(plan: TrainingName) {
  planToDelete.value = plan
}

async function deletar() {
  if (!planToDelete.value) return
  deleting.value = true
  try {
    await trainingPlanStore.deleteTrainingPlan(planToDelete.value.id)
    trainingPlans.value = trainingPlans.value.filter(p => p.id !== planToDelete.value!.id)
    planToDelete.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-black text-white pb-24">
    <div class="px-4 pt-8 pb-4">
      <h1 class="text-2xl font-bold tracking-tight">Fichas</h1>
    </div>

    <div class="flex flex-col gap-3 px-4">
      <div
        v-for="plan in trainingPlans"
        :key="plan.id"
        class="flex items-center justify-between border border-gray-800 rounded-xl px-4 py-4"
      >
        <div>
          <p class="font-semibold text-base">{{ plan.training_name }}</p>
          <p class="text-sm text-gray-400 mt-0.5">{{ plan.day_name }}</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Editar -->
          <button
            @click="router.push(`/edit_training_plan/${plan.id}`)"
            class="text-gray-400 active:text-white transition-colors p-1"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H8v-2.414a2 2 0 01.586-1.414z" />
            </svg>
          </button>
          <!-- Deletar -->
          <button
            @click="confirmDelete(plan)"
            class="text-red-500 active:text-red-400 transition-colors p-1"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="!trainingPlans.length" class="text-center text-gray-600 py-10">
        Nenhuma ficha criada ainda.
      </div>
    </div>

    <div class="px-4 mt-6">
      <RouterLink
        to="/create_training_plan"
        class="block w-full text-center py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold"
      >
        + Criar ficha
      </RouterLink>
    </div>

    <!-- Modal de confirmação de exclusão -->
    <Teleport to="body">
      <div
        v-if="planToDelete"
        class="fixed inset-0 bg-black/80 flex items-end justify-center z-50 px-4 pb-8"
        @click.self="planToDelete = null"
      >
        <div class="bg-gray-900 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
          <div class="text-center">
            <p class="text-lg font-semibold">Excluir ficha?</p>
            <p class="text-gray-400 text-sm mt-1">
              <span class="text-white font-medium">{{ planToDelete.training_name }}</span>
              — {{ planToDelete.day_name }}
            </p>
            <p class="text-gray-500 text-xs mt-2">
              Todo o histórico de treinos desta ficha será apagado.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <button
              @click="deletar"
              :disabled="deleting"
              class="w-full py-3 rounded-xl bg-red-600 font-semibold text-sm active:bg-red-700 disabled:opacity-50"
            >
              {{ deleting ? 'Excluindo...' : 'Sim, excluir' }}
            </button>
            <button
              @click="planToDelete = null"
              class="w-full py-3 rounded-xl bg-gray-800 font-semibold text-sm text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>
