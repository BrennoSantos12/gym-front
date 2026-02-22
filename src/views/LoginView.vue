<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Informe a senha'),
  })
)

const { handleSubmit, errors } = useForm({ validationSchema: schema })
const { value: email } = useField<string>('email')
const { value: password } = useField<string>('password')

const authStore = useAuthStore()
const errorMsg = ref('')
const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login(values.email, values.password)
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.detail ?? 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-white md:bg-gray-50 flex flex-col md:items-center md:justify-center px-6 pt-16 md:pt-0 pb-8">

    <div class="w-full md:max-w-md md:bg-white md:rounded-2xl md:shadow-md md:p-8 flex flex-col gap-0">

    <!-- Cabeçalho -->
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-gray-900">Bem-vindo</h1>
      <p class="text-gray-500 mt-1">Acesse sua conta para continuar</p>
    </div>

    <!-- Formulário -->
    <form @submit.prevent="onSubmit" class="flex flex-col gap-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="seu@email.com"
          class="w-full border border-gray-300 rounded-xl px-4 py-4 text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p v-if="errors.email" class="text-red-500 text-sm mt-1.5">{{ errors.email }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Senha</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          class="w-full border border-gray-300 rounded-xl px-4 py-4 text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p v-if="errors.password" class="text-red-500 text-sm mt-1.5">{{ errors.password }}</p>
      </div>

      <p v-if="errorMsg" class="text-red-500 text-sm text-center -mb-1">{{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors mt-1"
      >
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <!-- Rodapé -->
    <p class="text-center text-gray-500 mt-8">
      Não tem conta?
      <router-link to="/register" class="text-blue-600 font-semibold">Cadastre-se</router-link>
    </p>

    </div>
  </main>
</template>
