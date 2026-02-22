<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth'
import { useHomeStore, type TodayTraining } from '@/stores/home';


const homeStore = useHomeStore()
const authStore = useAuthStore()

const homeInfo = ref<TodayTraining | null>(null)

onMounted(async () => {

  homeInfo.value = await homeStore.getTodayTraining(authStore.userId || 0)
})


</script>

<template>
  <main class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="border-2 h-100 w-screen text-center flex items-center justify-center text-6xl">

        {{ homeInfo?.training_name ?? 'Carregando...' }}
      </div>
    </div>

    <button @click="authStore.logout()"
      class="bg-red-500 active:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors">
      Sair
    </button>
  </main>
</template>
