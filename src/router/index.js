import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { requiresAuth: true, allowPending: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/referrals',
      name: 'referrals',
      component: () => import('../views/ReferralsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UserManagementView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('../views/AuditLogView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reference',
      name: 'reference',
      component: () => import('../views/ReferenceDataView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/actions',
      name: 'actions',
      component: () => import('../views/ReferralActionsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/ArchiveView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)

  if (to.meta.requiresAuth || to.meta.guestOnly) {
    await authStore.fetchCurrentUser(true)
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (authStore.isAuthenticated && !authStore.canAccessApp && !to.meta.allowPending) {
    return { name: 'signup' }
  }

  if (to.name === 'signup' && authStore.canAccessApp) {
    return { name: 'dashboard' }
  }

  if (to.meta.guestOnly && authStore.canAccessApp) {
    return { name: 'dashboard' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated && !authStore.canAccessApp) {
    return { name: 'signup' }
  }
})

export default router
