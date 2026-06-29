import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const initialized = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isApproved = computed(() => user.value?.approval_status === 'approved')
  const isActive = computed(() => Boolean(user.value?.is_active))
  const hasCompletedRegistration = computed(() => Boolean(user.value?.registration_completed))
  const canAccessApp = computed(() => isAuthenticated.value && isApproved.value && isActive.value)
  const needsRegistration = computed(() => isAuthenticated.value && !hasCompletedRegistration.value)
  const isPendingApproval = computed(() => isAuthenticated.value && user.value?.approval_status === 'pending')
  const isDeclined = computed(() => isAuthenticated.value && user.value?.approval_status === 'declined')

  async function fetchCurrentUser(force = false) {
    if (loading.value || (initialized.value && !force)) {
      return user.value
    }

    loading.value = true

    try {
      const response = await request('/auth/user')

      if (!response.ok) {
        user.value = null
        return null
      }

      const payload = await response.json()
      user.value = payload.user ?? null
      return user.value
    } catch {
      user.value = null
      return null
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function logout() {
    try {
      await request('/auth/logout', {
        method: 'POST',
      })
    } catch {
      // Even if the network fails, we still clear local auth state.
    } finally {
      user.value = null
      initialized.value = true
    }
  }

  function clearAuth() {
    user.value = null
    initialized.value = true
  }

  return {
    user,
    initialized,
    loading,
    isAuthenticated,
    isApproved,
    isActive,
    hasCompletedRegistration,
    canAccessApp,
    needsRegistration,
    isPendingApproval,
    isDeclined,
    fetchCurrentUser,
    logout,
    clearAuth,
  }
})
