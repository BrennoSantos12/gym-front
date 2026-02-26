<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HamburgerMenu from '@/components/HamburgerMenu.vue'

const authStore = useAuthStore()
</script>

<template>
  <HamburgerMenu v-if="authStore.isAuthenticated" />
  <RouterView />
</template>
