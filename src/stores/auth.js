import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const initialized = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))

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
    fetchCurrentUser,
    logout,
    clearAuth,
  }
})
