import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/referrals',
      name: 'referrals',
      component: () => import('../views/ReferralsView.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UserManagementView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('../views/AuditLogView.vue'),
    },
    {
      path: '/reference',
      name: 'reference',
      component: () => import('../views/ReferenceDataView.vue'),
    },
    {
      path: '/actions',
      name: 'actions',
      component: () => import('../views/ReferralActionsView.vue'),
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/ArchiveView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
