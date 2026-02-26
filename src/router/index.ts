import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/training_plan',
    name: 'training_plan',
    component: () => import('@/views/FichaView.vue'),
  },
  {
    path: '/create_training_plan',
    name: 'create_training_plan',
    component: () => import('@/views/TrainingPlanView.vue')
  },
  {
    path: '/edit_training_plan/:id',
    name: 'edit_training_plan',
    component: () => import('@/views/EditTrainingPlanView.vue'),
  },
  {
    path: '/edit_training_session/:id',
    name: 'edit_training_session',
    component: () => import('@/views/EditTrainingSessionView.vue'),
  },
  {
    path: '/create_training_session/:id',
    name: '/create_training_session',
    component: () => import('@/views/TrainingSessionView.vue')
  },
  {
    path: '/report',
    name: '/report',
    component: () => import('@/views/ReportView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const isAuthenticated = !!localStorage.getItem('token')
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
