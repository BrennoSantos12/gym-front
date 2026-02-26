<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function logout() {
  close()
  authStore.logout()
}
</script>

<template>
  <!-- Botão hamburguer -->
  <button @click="toggle"
    class="fixed top-4 right-4 z-50 flex flex-col justify-center items-center w-10 h-10 gap-1.5 cursor-pointer"
    aria-label="Menu">
    <span class="block w-7 h-0.5 bg-white transition-all duration-300 origin-center"
      :class="isOpen ? 'rotate-45 translate-y-2' : ''" />
    <span class="block w-7 h-0.5 bg-white transition-all duration-300" :class="isOpen ? 'opacity-0 scale-x-0' : ''" />
    <span class="block w-7 h-0.5 bg-white transition-all duration-300 origin-center"
      :class="isOpen ? '-rotate-45 -translate-y-2' : ''" />
  </button>

  <!-- Overlay full screen -->
  <Transition name="menu">
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-zinc-900 flex flex-col items-center justify-center gap-8">
      <nav class="flex flex-col items-center gap-6 text-2xl font-semibold">
        <RouterLink to="/" @click="close" class="text-white hover:text-zinc-400 transition-colors">
          Início
        </RouterLink>
        <RouterLink to="/training_plan" @click="close" class="text-white hover:text-zinc-400 transition-colors">
          Treinos
        </RouterLink>
        <RouterLink to="/report" @click="close" class="text-white hover:text-zinc-400 transition-colors">
          Relatórios
        </RouterLink>
        <RouterLink to="/perfil" @click="close" class="text-white hover:text-zinc-400 transition-colors">
          Perfil
        </RouterLink>
      </nav>

      <div class="w-16 h-px bg-zinc-700" />

      <button @click="logout" class="text-red-400 hover:text-red-300 text-lg font-semibold transition-colors">
        Sair
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
