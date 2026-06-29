<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { request } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const submitting = ref(false)
const errorMessage = ref('')
const showPendingModal = ref(false)

const positions = [
  'Administrative Officer',
  'Social Worker',
  'Case Worker',
  'Psychologist',
  'Legal Officer',
  'Medical Officer',
  'Administrative Aide',
  'Project Development Officer',
  'Information Officer',
  'Other',
]

const regions = [
  'NCR - National Capital Region',
  'Region I - Ilocos Region',
  'Region II - Cagayan Valley',
  'Region III - Central Luzon',
  'Region IV-A - CALABARZON',
  'Region IV-B - MIMAROPA',
  'Region V - Bicol Region',
  'Region VI - Western Visayas',
  'Region VII - Central Visayas',
  'Region VIII - Eastern Visayas',
  'Region IX - Zamboanga Peninsula',
  'Region X - Northern Mindanao',
  'Region XI - Davao Region',
  'Region XII - SOCCSKSARGEN',
  'Region XIII - Caraga',
  'BARMM - Bangsamoro Autonomous Region',
  'CAR - Cordillera Administrative Region',
]

const user = computed(() => authStore.user || {})
const displayName = computed(() => user.value.name || user.value.email || 'Google user')
const accountState = computed(() => user.value.approval_status || 'pending')
const isInactiveApproved = computed(() => accountState.value === 'approved' && !user.value.is_active)
const isReadOnlyState = computed(() => authStore.hasCompletedRegistration && !authStore.isDeclined)

const form = reactive({
  first_name: user.value.first_name || firstNameFromDisplay(),
  middle_name: user.value.middle_name || '',
  last_name: user.value.last_name || lastNameFromDisplay(),
  extension_name: user.value.extension_name || '',
  position: user.value.position || '',
  region: user.value.region || '',
})

function firstNameFromDisplay() {
  return (displayName.value.split(/\s+/)[0] || '').trim()
}

function lastNameFromDisplay() {
  const parts = displayName.value.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

async function submitRegistration() {
  errorMessage.value = ''
  submitting.value = true

  try {
    const response = await request('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      errorMessage.value = payload.message || 'Please check the form and try again.'
      return
    }

    authStore.user = payload.user
    showPendingModal.value = true
  } catch {
    errorMessage.value = 'Unable to submit your registration right now.'
  } finally {
    submitting.value = false
  }
}

async function signOut() {
  await authStore.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <main class="signup-page">
    <section class="glass-panel">
      <div v-if="!isReadOnlyState && !isInactiveApproved" class="signup-form">
        <header class="form-header">
          <div class="brand-row">
            <img src="/DSWD-Logo.png" alt="DSWD Logo">
            <span>PSB · RMS</span>
            <span class="step-label">Step 1 of 2</span>
          </div>

          <h1>Complete Your Profile</h1>
          <p>Please provide your personal information to continue. Your account will be reviewed by an administrator.</p>
        </header>

        <form @submit.prevent="submitRegistration">
          <div class="form-grid">
            <label>First Name *<input v-model="form.first_name" type="text" required placeholder="Enter first name"></label>
            <label>Middle Name<input v-model="form.middle_name" type="text" placeholder="Enter middle name"></label>
            <label>Last Name *<input v-model="form.last_name" type="text" required placeholder="Enter last name"></label>
            <label>Extension Name<select v-model="form.extension_name"><option value="">None</option><option>Jr.</option><option>Sr.</option><option>II</option><option>III</option><option>IV</option><option>V</option></select></label>
            <label>Position *<select v-model="form.position" required><option value="">Select position...</option><option v-for="position in positions" :key="position">{{ position }}</option></select></label>
            <label>Region *<select v-model="form.region" required><option value="">Select region...</option><option v-for="region in regions" :key="region">{{ region }}</option></select></label>
            <label class="md:col-span-2">Email Address *<input :value="user.email" type="email" disabled><small>This email is from your Google account and cannot be changed.</small></label>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

          <div class="form-actions">
            <button type="button" class="secondary-button" @click="signOut">
              Sign Out
            </button>
            <button type="submit" class="primary-button" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Continue' }}
              <AppIcon name="arrowRight" class="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <div v-else class="pending-panel">
        <div class="pending-icon" :class="{ declined: accountState === 'declined', inactive: isInactiveApproved }">
          <AppIcon :name="accountState === 'declined' ? 'close' : 'clock'" class="h-10 w-10" />
        </div>
        <h1 v-if="accountState === 'declined'">Account Request Declined</h1>
        <h1 v-else-if="isInactiveApproved">Account Inactive</h1>
        <h1 v-else>Account Pending Activation</h1>

        <p v-if="accountState === 'declined'">
          Your account request was declined. You may update your registration details and submit again.
        </p>
        <p v-else-if="isInactiveApproved">
          Your account has been approved but is currently inactive. Please contact an administrator.
        </p>
        <p v-else>
          Your account is currently pending approval from an administrator.
        </p>

        <div v-if="accountState === 'pending'" class="next-box">
          <strong>What happens next?</strong>
          <span><AppIcon name="check" class="h-4 w-4" /> An administrator will review your account information.</span>
          <span><AppIcon name="check" class="h-4 w-4" /> You will receive access once approved and activated.</span>
          <span><AppIcon name="check" class="h-4 w-4" /> You can then sign in to access the system.</span>
        </div>

        <div class="pending-actions">
          <button v-if="accountState === 'declined'" type="button" class="primary-button" @click="authStore.user.registration_completed = false">
            Update Registration
          </button>
          <button type="button" class="secondary-button" @click="signOut">Sign Out</button>
        </div>
      </div>
    </section>

    <div v-if="showPendingModal" class="modal-overlay" role="dialog" aria-modal="true" @click.self="showPendingModal = false">
      <div class="pending-modal">
        <div class="pending-icon">
          <AppIcon name="clock" class="h-10 w-10" />
        </div>
        <h2>Account Pending Activation</h2>
        <p>Your account is currently pending approval from an administrator.</p>
        <button type="button" class="primary-button w-full" @click="showPendingModal = false">View Status</button>
        <button type="button" class="secondary-button w-full" @click="signOut">Sign Out</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.signup-page {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background:
    radial-gradient(circle at 18% 25%, rgb(0 51 102 / 8%), transparent 32%),
    radial-gradient(circle at 88% 80%, rgb(201 168 62 / 8%), transparent 30%),
    linear-gradient(135deg, #f8fbff 0%, #eaf1f8 100%);
}

.glass-panel {
  width: min(100%, 56rem);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 1.5rem;
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 20px 40px -12px rgb(0 0 0 / 25%);
  backdrop-filter: blur(8px);
}

.signup-form,
.pending-panel {
  padding: 1.75rem;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.brand-row img {
  width: auto;
  height: 2.5rem;
}

.brand-row span:nth-child(2) {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 700;
}

.step-label {
  margin-left: auto;
  color: #94a3b8;
  font-size: 0.75rem;
}

h1 {
  color: #1f2937;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0;
}

.form-header p,
.pending-panel p,
.pending-modal p {
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 700;
}

input,
select {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.7rem 0.9rem;
  color: #334155;
  font-weight: 500;
  outline: none;
}

input:focus,
select:focus {
  border-color: transparent;
  box-shadow: 0 0 0 3px rgb(201 168 62 / 35%);
}

input:disabled {
  background: #f8fafc;
  color: #64748b;
}

small {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 500;
}

.form-actions,
.pending-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 0.75rem;
  padding: 0.7rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.primary-button {
  margin-left: auto;
  background: #c9a83e;
  color: white;
}

.primary-button:hover {
  background: #b8942e;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.secondary-button {
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.error-message {
  margin-top: 1rem;
  border-radius: 0.75rem;
  background: #fef2f2;
  padding: 0.75rem 1rem;
  color: #b91c1c;
  font-size: 0.875rem;
}

.pending-panel {
  display: grid;
  justify-items: center;
  text-align: center;
}

.pending-icon {
  display: grid;
  width: 5rem;
  height: 5rem;
  place-items: center;
  margin-bottom: 1.25rem;
  border-radius: 999px;
  background: rgb(201 168 62 / 15%);
  color: #c9a83e;
}

.pending-icon.declined {
  background: #fee2e2;
  color: #dc2626;
}

.pending-icon.inactive {
  background: #f3f4f6;
  color: #64748b;
}

.next-box {
  display: grid;
  gap: 0.65rem;
  width: min(100%, 28rem);
  margin-top: 1.25rem;
  border-radius: 0.9rem;
  background: #eff6ff;
  padding: 1rem;
  text-align: left;
}

.next-box strong {
  color: #374151;
  font-size: 0.875rem;
}

.next-box span {
  display: flex;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.8rem;
}

.next-box svg {
  flex-shrink: 0;
  color: #c9a83e;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 55%);
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.pending-modal {
  display: grid;
  width: min(100%, 31rem);
  justify-items: center;
  gap: 0.85rem;
  border-radius: 1.25rem;
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 25%);
}

.w-full {
  width: 100%;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .form-actions,
  .pending-actions {
    flex-direction: column;
  }

  .primary-button {
    margin-left: 0;
  }
}
</style>
