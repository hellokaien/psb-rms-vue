<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiBaseUrl } from '../lib/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isSigningIn = ref(false)
const signInMessage = ref('')

const redirectTarget = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/dashboard'
}

const handleGoogleSignIn = () => {
  const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL || `${apiBaseUrl}/auth/google/redirect`

  if (!googleAuthUrl) {
    signInMessage.value =
      'The login screen is ready. Add VITE_GOOGLE_AUTH_URL to connect it to your Google OAuth endpoint.'
    return
  }

  isSigningIn.value = true
  signInMessage.value = 'Redirecting to Google...'
  window.location.assign(googleAuthUrl)
}

authStore.fetchCurrentUser().then((user) => {
  if (user) {
    router.replace(redirectTarget())
  }
})
</script>

<template>
  <main class="login-page">
    <section class="glass-panel w-full max-w-4xl overflow-hidden rounded-3xl">
      <div class="grid md:grid-cols-2">
        <div class="flex items-center justify-center bg-white/55 p-5 md:p-6">
          <img src="/undraw_referral_ihsd.png" alt="Referral management illustration"
            class="max-h-[42vh] w-full max-w-sm object-contain md:max-h-[68vh]">
        </div>

        <div class="p-6 md:p-7 lg:p-8">
          <header class="mb-6">
            <img src="/DSWD-Logo.png" alt="Department of Social Welfare and Development"
              class="mb-4 h-12 w-auto object-contain">

            <h1 class="text-2xl font-semibold leading-tight tracking-tight text-gray-800 md:text-[1.7rem]">
              Protective Services Bureau Referral Management System
            </h1>

            <p class="mt-3 text-sm leading-6 text-gray-500">
              Please sign in with your authorized account to access and manage referral records
              securely.
            </p>
            <p class="mt-3 text-sm leading-6 text-gray-500">
              This portal helps PSB personnel organize referrals, monitor case progress, and keep
              sensitive client information protected through authorized Google access.
            </p>
          </header>

          <div class="mt-2">
            <button type="button"
              class="google-btn flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-6 py-3.5 text-base font-medium text-gray-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              :disabled="isSigningIn" @click="handleGoogleSignIn">
              <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285f4"
                  d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
                <path fill="#34a853"
                  d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
                <path fill="#fbbc05"
                  d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z" />
                <path fill="#ea4335"
                  d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
              </svg>

              <span>{{ isSigningIn ? 'Redirecting...' : 'Sign in with Google' }}</span>

              <svg class="ml-auto h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.69L10.72 5.53a.75.75 0 0 1 1.06-1.06l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l3.72-3.72H3.75A.75.75 0 0 1 3 10Z"
                  clip-rule="evenodd" />
              </svg>
            </button>

            <p class="mt-3 flex items-center justify-center gap-1.5 text-center text-xs tracking-wide text-gray-400">
              <svg class="h-3.5 w-3.5 text-[#34A853]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M10 1.944A11.954 11.954 0 0 1 3 4.56V9c0 4.55 2.85 8.43 7 9.96 4.15-1.53 7-5.41 7-9.96V4.56a11.954 11.954 0 0 1-7-2.616Zm3.03 5.526a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 1.06-1.06L9 10.44l2.97-2.97a.75.75 0 0 1 1.06 0Z"
                  clip-rule="evenodd" />
              </svg>
              Secured by Google OAuth
            </p>

            <p v-if="signInMessage"
              class="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-center text-xs leading-5 text-blue-700" role="status">
              {{ signInMessage }}
            </p>
          </div>

          <footer class="mt-6 space-y-2 text-center text-sm text-gray-500">
            <p class="flex items-center justify-center gap-1.5">
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
              <span>Authorized DSWD personnel only</span>
            </p>
            <!-- <nav aria-label="Legal and support links" class="flex justify-center gap-4 pt-1 text-xs text-gray-400">
              <a href="/privacy" class="transition-colors hover:text-gray-600">Privacy</a>
              <span class="text-gray-300" aria-hidden="true">&bull;</span>
              <a href="/terms" class="transition-colors hover:text-gray-600">Terms</a>
              <span class="text-gray-300" aria-hidden="true">&bull;</span>
              <a href="/support" class="transition-colors hover:text-gray-600">Support</a>
            </nav> -->
          </footer>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background:
    radial-gradient(circle at 18% 25%, rgb(66 133 244 / 16%), transparent 32%),
    radial-gradient(circle at 88% 80%, rgb(52 168 83 / 12%), transparent 30%),
    linear-gradient(135deg, #f8fbff 0%, #eaf1f8 100%);
}

.glass-panel {
  border: 1px solid rgb(255 255 255 / 35%);
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 20px 40px -12px rgb(0 0 0 / 25%);
  backdrop-filter: blur(8px);
}

.google-btn {
  box-shadow: 0 4px 10px rgb(0 0 0 / 5%);
  transition: all 200ms ease;
}

.google-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #f8faff;
  box-shadow: 0 12px 24px -8px rgb(66 133 244 / 30%);
}

.google-btn:active:not(:disabled) {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .google-btn {
    transition: none;
  }
}
</style>
