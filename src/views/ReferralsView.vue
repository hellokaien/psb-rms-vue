<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const isSidebarOpen = ref(false)
const isModalOpen = ref(false)
const currentStep = ref(1)
const searchQuery = ref('')
const statusFilter = ref('All Status')
const sortOrder = ref('newest')
const formError = ref('')

const navigation = [
  { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
  { label: 'Referrals', icon: 'referrals', badge: '24', route: 'referrals' },
  { label: 'Referrals for Action', icon: 'clock', badge: '7', route: 'actions' },
  { label: 'User Management', icon: 'users', route: 'users' },
  { label: 'Settings', icon: 'settings', route: 'settings' },
  { label: 'Reference Data', icon: 'database', route: 'reference' },
  { label: 'Reports', icon: 'reports', route: 'reports' },
  { label: 'Archive', icon: 'archive', route: 'archive' },
  { label: 'Audit Log', icon: 'audit', route: 'audit' },
]

const referrals = ref([
  { id: 'R-2026-0421', client: 'Maria Cruz', type: 'Child Welfare', date: '2026-06-17', status: 'For Action' },
  { id: 'R-2026-0398', client: 'Antonio Santos', type: 'Senior Citizen', date: '2026-06-15', status: 'Completed' },
  { id: 'R-2026-0435', client: 'Joseph Bautista', type: 'Disability', date: '2026-06-14', status: 'In Progress' },
  { id: 'R-2026-0442', client: 'Luz Rivera', type: "Women's Welfare", date: '2026-06-12', status: 'For Action' },
  { id: 'R-2026-0410', client: 'Elena Mendoza', type: 'Child Welfare', date: '2026-06-10', status: 'Archived' },
  { id: 'R-2026-0405', client: 'Ramon Garcia', type: 'Senior Citizen', date: '2026-06-08', status: 'Completed' },
])

const emptyForm = () => ({
  firstName: '', lastName: '', middleName: '', birthDate: '', gender: '', contact: '', email: '',
  houseNumber: '', barangay: '', city: '', province: '', postalCode: '',
  type: '', priority: '', summary: '', assignedTo: '',
  memoNumber: '', memoDate: '', memoSubject: '', memoDetails: '', files: [],
})
const form = reactive(emptyForm())

const steps = ['Personal Information', 'Address', 'Referral Details', 'Memorandum']
const requiredFields = {
  1: ['firstName', 'lastName', 'birthDate', 'gender', 'contact'],
  2: ['barangay', 'city', 'province'],
  3: ['type', 'priority', 'summary'],
  4: ['memoNumber', 'memoDate', 'memoSubject'],
}

const filteredReferrals = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const filtered = referrals.value.filter((referral) => {
    const matchesQuery = !query || [referral.id, referral.client, referral.type].some((value) => value.toLowerCase().includes(query))
    const matchesStatus = statusFilter.value === 'All Status' || referral.status === statusFilter.value
    return matchesQuery && matchesStatus
  })
  return [...filtered].sort((a, b) => sortOrder.value === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
})

const statusClass = (status) => `status-${status.toLowerCase().replace(' ', '-')}`
const navigate = (item) => {
  if (item.route) router.push({ name: item.route })
}
const openModal = () => {
  currentStep.value = 1
  formError.value = ''
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
  Object.assign(form, emptyForm())
  router.replace({ query: {} })
}
const nextStep = () => {
  const missing = requiredFields[currentStep.value].some((field) => !String(form[field]).trim())
  if (missing) {
    formError.value = 'Please complete all fields marked with an asterisk (*).'
    return
  }
  formError.value = ''
  currentStep.value += 1
}
const submitReferral = () => {
  const missing = requiredFields[4].some((field) => !String(form[field]).trim())
  if (missing) {
    formError.value = 'Please complete all fields marked with an asterisk (*).'
    return
  }
  referrals.value.unshift({
    id: `R-${new Date().getFullYear()}-${String(referrals.value.length + 443).padStart(4, '0')}`,
    client: `${form.firstName} ${form.lastName}`,
    type: form.type,
    date: form.memoDate,
    status: 'For Action',
  })
  closeModal()
}
const handleFiles = (event) => { form.files = [...event.target.files] }

onMounted(() => {
  if (route.query.create === '1') openModal()
})
</script>

<template>
  <div class="page-shell">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-30 bg-slate-950/45 md:hidden" @click="isSidebarOpen = false"></div>
    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="brand">
        <div class="logo"><img src="/dswdlogo_notext.png" alt="DSWD Logo"></div><span>PSB · RMS</span>
        <button class="ml-auto md:hidden" type="button" aria-label="Close menu" @click="isSidebarOpen = false"><AppIcon name="close" class="h-5 w-5" /></button>
      </div>
      <nav class="scrollable flex-1 space-y-1.5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <button v-for="item in navigation" :key="item.label" type="button" class="nav-item" :class="{ active: item.route === 'referrals' }" @click="navigate(item)">
          <AppIcon :name="item.icon" class="h-5 w-5 shrink-0" /><span>{{ item.label }}</span><span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </button>
      </nav>
      <div class="profile">
        <div class="avatar">MR</div><div class="min-w-0"><p class="truncate text-xs text-white/90">M. D. Reyes</p><p class="text-[11px] text-white/50">PSB · Admin</p></div>
        <button class="ml-auto text-white/40 hover:text-white" type="button" aria-label="Log out" @click="router.push({ name: 'login' })"><AppIcon name="logout" class="h-4 w-4" /></button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <div class="flex min-w-0 items-center gap-3">
          <button class="menu-button md:hidden" type="button" aria-label="Open menu" @click="isSidebarOpen = true"><AppIcon name="menu" class="h-5 w-5" /></button>
          <div><h1 class="text-xl font-semibold tracking-tight text-gray-800">Referrals</h1><p class="text-sm text-gray-400">Manage and track all referral cases</p></div>
        </div>
        <button class="primary-button" type="button" @click="openModal"><AppIcon name="plus" class="h-4 w-4" /><span class="hidden sm:inline">New Referral</span></button>
      </header>

      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <section class="filter-card" aria-label="Referral filters">
          <label class="search-input"><AppIcon name="search" class="h-4 w-4 text-gray-400" /><input v-model="searchQuery" type="search" placeholder="Search by name, ID, or case..."></label>
          <div class="flex flex-wrap gap-2">
            <select v-model="statusFilter" class="control"><option>All Status</option><option>For Action</option><option>In Progress</option><option>Completed</option><option>Archived</option></select>
            <select v-model="sortOrder" class="control"><option value="newest">Sort: Newest</option><option value="oldest">Sort: Oldest</option></select>
          </div>
        </section>

        <section class="table-card">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[650px]">
              <thead><tr><th>Referral ID</th><th>Client Name</th><th>Type</th><th>Date</th><th>Status</th><th class="text-right">Action</th></tr></thead>
              <tbody>
                <tr v-for="referral in filteredReferrals" :key="referral.id">
                  <td class="font-medium text-[#003366]">{{ referral.id }}</td><td>{{ referral.client }}</td><td class="text-gray-500">{{ referral.type }}</td><td class="text-gray-400">{{ referral.date }}</td>
                  <td><span class="status" :class="statusClass(referral.status)">{{ referral.status }}</span></td><td class="text-right"><button class="font-medium text-blue-600 hover:text-blue-800" type="button">View</button></td>
                </tr>
                <tr v-if="!filteredReferrals.length"><td colspan="6" class="py-10 text-center text-gray-400">No referrals found.</td></tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><span>Showing {{ filteredReferrals.length }} of {{ referrals.length }} referrals</span><div class="flex gap-1"><button disabled>Previous</button><button class="current">1</button><button disabled>Next</button></div></div>
        </section>
      </main>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" @click.self="closeModal">
      <div class="modal">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6"><div><h2 id="modal-title" class="text-lg font-semibold text-gray-800">Create New Referral</h2><p class="text-xs text-gray-400">Step {{ currentStep }} of 4 · {{ steps[currentStep - 1] }}</p></div><button type="button" class="text-2xl text-gray-400" aria-label="Close" @click="closeModal">×</button></div>
        <div class="stepper"><template v-for="step in 4" :key="step"><span class="step" :class="{ active: step === currentStep, completed: step < currentStep }">{{ step < currentStep ? '✓' : step }}</span><span v-if="step < 4" class="step-line" :class="{ completed: step < currentStep }"></span></template></div>

        <form class="px-5 pb-5 sm:px-6 sm:pb-6" @submit.prevent="submitReferral">
          <div v-if="currentStep === 1" class="form-grid">
            <label>First Name *<input v-model="form.firstName" type="text"></label><label>Last Name *<input v-model="form.lastName" type="text"></label><label>Middle Name<input v-model="form.middleName" type="text"></label><label>Date of Birth *<input v-model="form.birthDate" type="date"></label>
            <label>Gender *<select v-model="form.gender"><option value="" disabled>Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label><label>Contact Number *<input v-model="form.contact" type="tel"></label><label class="sm:col-span-2">Email Address<input v-model="form.email" type="email"></label>
          </div>
          <div v-else-if="currentStep === 2" class="form-grid">
            <label>House/Unit Number<input v-model="form.houseNumber" type="text"></label><label>Barangay *<input v-model="form.barangay" type="text"></label><label>City/Municipality *<input v-model="form.city" type="text"></label><label>Province *<input v-model="form.province" type="text"></label><label>Postal Code<input v-model="form.postalCode" type="text"></label>
          </div>
          <div v-else-if="currentStep === 3" class="form-grid">
            <label>Type of Referral *<select v-model="form.type"><option value="" disabled>Select type</option><option>Child Welfare</option><option>Senior Citizen</option><option>Disability</option><option>Women's Welfare</option><option>Other</option></select></label>
            <label>Priority Level *<select v-model="form.priority"><option value="" disabled>Select priority</option><option>Normal</option><option>Urgent</option><option>Critical</option></select></label>
            <label class="sm:col-span-2">Referral Summary *<textarea v-model="form.summary" rows="3"></textarea></label><label class="sm:col-span-2">Assigned To<select v-model="form.assignedTo"><option value="">Unassigned</option><option>Social Worker A</option><option>Social Worker B</option></select></label>
          </div>
          <div v-else class="form-grid">
            <label>Memorandum Number *<input v-model="form.memoNumber" type="text" placeholder="MEMO-2026-001"></label><label>Memorandum Date *<input v-model="form.memoDate" type="date"></label><label class="sm:col-span-2">Memorandum Subject *<input v-model="form.memoSubject" type="text"></label><label class="sm:col-span-2">Memorandum Details<textarea v-model="form.memoDetails" rows="3"></textarea></label><label class="sm:col-span-2">Attachments<input type="file" multiple @change="handleFiles"></label>
          </div>
          <p v-if="formError" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ formError }}</p>
          <div class="mt-6 flex items-center justify-between border-t border-gray-100 pt-4"><button v-if="currentStep > 1" type="button" class="secondary-button" @click="currentStep--; formError = ''">Previous</button><span v-else></span><div class="flex gap-2"><button type="button" class="secondary-button" @click="closeModal">Cancel</button><button v-if="currentStep < 4" type="button" class="primary-button" @click="nextStep">Next</button><button v-else type="submit" class="primary-button">Submit Referral</button></div></div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f0f4f8;
  color: #334155
}

.sidebar {
  position: relative;
  z-index: 40;
  display: flex;
  width: 250px;
  flex-shrink: 0;
  flex-direction: column;
  background: linear-gradient(180deg, #003366, #002244);
  box-shadow: 0 20px 25px -5px rgb(0 0 0/18%);
  transition: transform .2s
}

.brand {
  display: flex;
  height: 4rem;
  align-items: center;
  gap: .625rem;
  border-bottom: 2px solid rgb(201 168 62/20%);
  padding: 0 1.25rem;
  color: rgb(255 255 255/90%);
  font-size: .875rem;
  font-weight: 600
}

.logo {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  background: white
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain
}

.nav-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: .75rem;
  border-radius: .75rem;
  padding: .625rem .75rem;
  color: rgb(255 255 255/70%);
  text-align: left;
  font-size: .875rem
}

.nav-item:hover {
  background: rgb(201 168 62/15%);
  color: white
}

.nav-item.active {
  background: rgb(201 168 62/20%);
  color: #e8d48b;
  box-shadow: inset 3px 0 #c9a83e
}

.badge {
  margin-left: auto;
  border-radius: 999px;
  background: rgb(201 168 62/20%);
  padding: .125rem .5rem;
  color: #e8d48b;
  font-size: 11px
}

.profile {
  display: flex;
  align-items: center;
  gap: .75rem;
  border-top: 2px solid rgb(201 168 62/15%);
  padding: .75rem 1rem
}

.avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(201 168 62/20%);
  color: #e8d48b;
  font-size: .75rem;
  font-weight: 700
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border-bottom: 2px solid rgb(201 168 62/15%);
  background: rgb(255 255 255/85%);
  padding: .75rem 1.5rem;
  backdrop-filter: blur(8px)
}

.menu-button {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: white;
  padding: .5rem;
  color: #64748b
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  border-radius: 999px;
  background: #c9a83e;
  padding: .625rem 1rem;
  color: white;
  font-size: .875rem;
  font-weight: 500
}

.primary-button:hover {
  background: #b8942e
}

.filter-card {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: 1.5rem;
  border-radius: 1rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.search-input {
  display: flex;
  flex: 1;
  align-items: center;
  gap: .5rem;
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .625rem .75rem
}

.search-input input {
  width: 100%;
  background: transparent;
  font-size: .875rem;
  outline: none
}

.control {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .625rem .75rem;
  font-size: .875rem;
  outline: none
}

.table-card {
  overflow: hidden;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

th {
  background: #f9fafb;
  padding: .75rem 1rem;
  text-align: left;
  font-size: .7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #64748b
}

td {
  padding: .875rem 1rem;
  font-size: .875rem
}

tbody tr {
  border-top: 1px solid #f3f4f6
}

tbody tr:hover {
  background: #f8fafc
}

.status {
  display: inline-block;
  border-radius: 999px;
  padding: .25rem .75rem;
  font-size: .7rem;
  font-weight: 500
}

.status-for-action {
  background: #fef3c7;
  color: #b45309
}

.status-in-progress {
  background: #dbeafe;
  color: #1d4ed8
}

.status-completed {
  background: #dcfce7;
  color: #15803d
}

.status-archived {
  background: #f3e8ff;
  color: #7e22ce
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f3f4f6;
  padding: .75rem 1rem;
  color: #94a3b8;
  font-size: .75rem
}

.table-footer button {
  border: 1px solid #e5e7eb;
  padding: .35rem .65rem
}

.table-footer button:first-child {
  border-radius: .5rem 0 0 .5rem
}

.table-footer button:last-child {
  border-radius: 0 .5rem .5rem 0
}

.table-footer .current {
  background: #003366;
  color: white
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0/50%);
  padding: 1rem;
  backdrop-filter: blur(4px)
}

.modal {
  width: 100%;
  max-width: 800px;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 25px 50px -12px rgb(0 0 0/25%)
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem
}

.step {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 999px;
  background: #e5e7eb;
  color: #9ca3af;
  font-size: .75rem;
  font-weight: 600
}

.step.active {
  background: #c9a83e;
  color: white
}

.step.completed {
  background: #003366;
  color: white
}

.step-line {
  width: 2rem;
  height: 2px;
  background: #e5e7eb
}

.step-line.completed {
  background: #003366
}

.form-grid {
  display: grid;
  gap: 1rem
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: .35rem;
  color: #374151;
  font-size: .875rem;
  font-weight: 500
}

.form-grid input,
.form-grid select,
.form-grid textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: .75rem;
  padding: .625rem .75rem;
  font-weight: 400;
  outline: none
}

.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%)
}

.secondary-button {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .625rem 1rem;
  color: #4b5563;
  font-size: .875rem
}

.scrollable {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent
}

@media(min-width:640px) {
  .filter-card {
    flex-direction: row
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr))
  }
}

@media(max-width:767px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%)
  }

  .sidebar.open {
    transform: translateX(0)
  }

  .topbar {
    padding: .75rem 1rem
  }
}

@media(prefers-reduced-motion:reduce) {
  .sidebar {
    transition: none
  }
}
</style>
