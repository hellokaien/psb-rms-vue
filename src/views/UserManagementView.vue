<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import AppIcon from '../components/AppIcon.vue'
import { request } from '../lib/api'

const route = useRoute()
const router = useRouter()
const isSidebarOpen = ref(false)
const isModalOpen = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const roleFilter = ref('All Roles')
const statusFilter = ref('All Status')
const formError = ref('')
const pageError = ref('')
const loading = ref(false)
const saving = ref(false)
const actionUserId = ref(null)

const roleOptions = [
  { value: 1, label: 'Super Admin' },
  { value: 2, label: 'Admin' },
  { value: 3, label: 'User' },
  { value: 4, label: 'Viewer' },
]
const statusOptions = [
  { value: 'approved_active', label: 'Active' },
  { value: 'approved_inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
]
const avatarColors = ['#003366', '#c9a83e', '#7c3aed', '#0891b2', '#059669', '#b45309']
const users = ref([])

const emptyForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  extension_name: '',
  email: '',
  role: 3,
  position: '',
  region: '',
  status: 'pending',
})
const form = reactive(emptyForm())

const stats = computed(() => [
  { label: 'Total Users', value: users.value.length, icon: 'users', tone: 'blue' },
  { label: 'Active', value: users.value.filter((user) => user.status === 'Active').length, icon: 'check', tone: 'green' },
  { label: 'Inactive', value: users.value.filter((user) => user.status === 'Inactive').length, icon: 'clock', tone: 'gray' },
  { label: 'Pending Approval', value: users.value.filter((user) => user.status === 'Pending').length, icon: 'clock', tone: 'gold' },
])

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const matchesSearch = !query || [user.name, user.email, user.roleLabel, user.position, user.region].some((value) => String(value || '').toLowerCase().includes(query))
    return matchesSearch && (roleFilter.value === 'All Roles' || user.role === roleFilter.value) && (statusFilter.value === 'All Status' || user.status === statusFilter.value)
  })
})

const roleLabel = (role) => roleOptions.find((option) => option.value === Number(role))?.label || 'User'
const statusFromUser = (user) => {
  if (user.approval_status === 'declined') return 'Declined'
  if (user.approval_status === 'pending') return 'Pending'
  return user.is_active ? 'Active' : 'Inactive'
}
const formStatusFromUser = (user) => {
  if (user.approval_status === 'declined') return 'declined'
  if (user.approval_status === 'pending') return 'pending'
  return user.is_active ? 'approved_active' : 'approved_inactive'
}
const payloadFromForm = () => {
  const isApproved = form.status.startsWith('approved')

  return {
    first_name: form.first_name,
    middle_name: form.middle_name || null,
    last_name: form.last_name,
    extension_name: form.extension_name || null,
    email: form.email,
    role: Number(form.role),
    position: form.position || null,
    region: form.region || null,
    approval_status: isApproved ? 'approved' : form.status,
    is_active: form.status === 'approved_active',
  }
}
const normalizeUser = (user, index = 0) => ({
  ...user,
  name: user.name || [user.first_name, user.middle_name, user.last_name, user.extension_name].filter(Boolean).join(' '),
  role: roleLabel(user.role),
  roleValue: Number(user.role || 3),
  roleLabel: user.role_label || roleLabel(user.role),
  status: statusFromUser(user),
  color: avatarColors[index % avatarColors.length],
})
const replaceUser = (user) => {
  const index = users.value.findIndex((item) => item.id === user.id)
  const normalized = normalizeUser(user, Math.max(index, 0))

  if (index >= 0) {
    users.value[index] = normalized
  } else {
    users.value.unshift(normalized)
  }
}
const initials = (user) => {
  const parts = (user.name || user.email || '').split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : (parts[0] || '?').slice(0, 2)).toUpperCase()
}

async function loadUsers() {
  loading.value = true
  pageError.value = ''

  try {
    const response = await request('/auth/users')
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      pageError.value = payload.message || 'Unable to load users.'
      users.value = []
      return
    }

    users.value = (payload.users || []).map(normalizeUser)
  } catch {
    pageError.value = 'Unable to load users right now.'
    users.value = []
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  formError.value = ''
  isModalOpen.value = true
}
const openEditModal = (user) => {
  editingId.value = user.id
  Object.assign(form, {
    first_name: user.first_name || '',
    middle_name: user.middle_name || '',
    last_name: user.last_name || '',
    extension_name: user.extension_name || '',
    email: user.email || '',
    role: user.roleValue || 3,
    position: user.position || '',
    region: user.region || '',
    status: formStatusFromUser(user),
  })
  formError.value = ''
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
  router.replace({ query: {} })
}
const saveUser = async () => {
  const required = ['first_name', 'last_name', 'email', 'status']
  if (required.some((field) => !String(form[field]).trim()) || !form.role) {
    formError.value = 'Please complete all required fields.'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    const response = await request(editingId.value ? `/auth/users/${editingId.value}` : '/auth/users', {
      method: editingId.value ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadFromForm()),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      formError.value = payload.message || 'Unable to save this user.'
      return
    }

    replaceUser(payload.user)
    closeModal()
  } catch {
    formError.value = 'Unable to save this user right now.'
  } finally {
    saving.value = false
  }
}

const approveUser = async (user) => {
  actionUserId.value = user.id
  pageError.value = ''

  try {
    const response = await request(`/auth/users/${user.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: user.roleValue || 3 }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      pageError.value = payload.message || 'Unable to approve user.'
      return
    }

    replaceUser(payload.user)
  } catch {
    pageError.value = 'Unable to approve user right now.'
  } finally {
    actionUserId.value = null
  }
}

const declineUser = async (user) => {
  actionUserId.value = user.id
  pageError.value = ''

  try {
    const response = await request(`/auth/users/${user.id}/decline`, {
      method: 'POST',
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      pageError.value = payload.message || 'Unable to decline user.'
      return
    }

    replaceUser(payload.user)
  } catch {
    pageError.value = 'Unable to decline user right now.'
  } finally {
    actionUserId.value = null
  }
}

const removeUser = async (user) => {
  if (!window.confirm(`Remove ${user.name}?`)) return

  actionUserId.value = user.id
  pageError.value = ''

  try {
    const response = await request(`/auth/users/${user.id}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      pageError.value = payload.message || 'Unable to remove user.'
      return
    }

    users.value = users.value.filter((item) => item.id !== user.id)
  } catch {
    pageError.value = 'Unable to remove user right now.'
  } finally {
    actionUserId.value = null
  }
}

onMounted(async () => {
  await loadUsers()
  if (route.query.create === '1') openAddModal()
})
</script>

<template>
  <div class="page-shell">
    <AppSidebar v-model:open="isSidebarOpen" active-route="users" />
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <div class="flex min-w-0 items-center gap-3"><button class="menu-button md:hidden" type="button"
            aria-label="Open menu" @click="isSidebarOpen = true">
            <AppIcon name="menu" class="h-5 w-5" />
          </button>
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-gray-800">User Management</h1>
            <p class="text-sm text-gray-400">Manage system users, roles, and permissions</p>
          </div>
        </div>
        <button class="primary-button" type="button" @click="openAddModal">
          <AppIcon name="plus" class="h-4 w-4" /><span class="hidden sm:inline">Add User</span>
        </button>
      </header>

      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <p v-if="pageError" class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ pageError }}</p>

        <section class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="User statistics">
          <article v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="flex items-center justify-between"><span class="text-xs font-medium text-gray-400 sm:text-sm">{{
                stat.label }}</span><span class="stat-icon" :class="`tone-${stat.tone}`">
                <AppIcon :name="stat.icon" class="h-5 w-5" />
              </span></div>
            <p class="mt-1 text-2xl font-semibold text-gray-800">{{ stat.value }}</p>
          </article>
        </section>

        <section class="filter-card" aria-label="User filters">
          <label class="search-input">
            <AppIcon name="search" class="h-4 w-4 text-gray-400" /><input v-model="searchQuery" type="search"
              placeholder="Search by name, email, or role...">
          </label>
          <div class="flex flex-wrap gap-2"><select v-model="roleFilter" class="control">
              <option>All Roles</option>
              <option v-for="role in roleOptions" :key="role.value">{{ role.label }}</option>
            </select><select v-model="statusFilter" class="control">
              <option>All Status</option>
              <option v-for="status in statusOptions" :key="status.value">{{ status.label }}</option>
            </select></div>
        </section>

        <section class="table-card">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="6" class="py-10 text-center text-gray-400">Loading users...</td>
                </tr>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>
                    <div class="flex items-center gap-3"><span class="user-avatar"
                        :style="{ background: user.color }">{{ initials(user) }}</span><span
                        class="font-medium text-gray-700">{{ user.name }}</span></div>
                  </td>
                  <td class="text-gray-500">{{ user.email }}</td>
                  <td><span class="role-pill">{{ user.roleLabel }}</span></td>
                  <td class="text-gray-500">{{ user.position || user.region || '—' }}</td>
                  <td><span class="status-pill" :class="`status-${user.status.toLowerCase()}`">{{ user.status }}</span>
                  </td>
                  <td class="text-right">
                    <button v-if="user.status !== 'Active'" class="mr-3 font-medium text-green-600 hover:text-green-800"
                      type="button" :disabled="actionUserId === user.id" @click="approveUser(user)">Approve</button><button
                      v-if="user.status === 'Pending'" class="mr-3 font-medium text-amber-600 hover:text-amber-800"
                      type="button" :disabled="actionUserId === user.id" @click="declineUser(user)">Decline</button><button
                      class="mr-3 font-medium text-blue-600 hover:text-blue-800" type="button"
                      :disabled="actionUserId === user.id" @click="openEditModal(user)">Edit</button><button
                      class="text-gray-400 hover:text-red-600" type="button" :disabled="actionUserId === user.id"
                      @click="removeUser(user)">Remove</button>
                  </td>
                </tr>
                <tr v-if="!loading && !filteredUsers.length">
                  <td colspan="6" class="py-10 text-center text-gray-400">No users found.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><span>Showing {{ filteredUsers.length }} of {{ users.length }} users</span>
            <div class="flex gap-1"><button disabled>Previous</button><button class="current">1</button><button
                disabled>Next</button></div>
          </div>
        </section>
      </main>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-modal-title"
      @click.self="closeModal">
      <div class="modal">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 id="user-modal-title" class="text-xl font-semibold text-gray-800">{{ editingId ? 'Edit User' : 'Add New User' }}</h2>
            <p class="mt-1 text-xs text-gray-400">Assign account details, role, and access status.</p>
          </div><button type="button" class="text-2xl text-gray-400" aria-label="Close" @click="closeModal">Ã—</button>
        </div>
        <form @submit.prevent="saveUser">
          <div class="form-grid"><label>First Name *<input v-model="form.first_name" type="text"></label><label>Middle Name<input
                v-model="form.middle_name" type="text"></label><label>Last Name *<input v-model="form.last_name"
                type="text"></label><label>Extension Name<input v-model="form.extension_name" type="text"
                placeholder="Jr., Sr., III"></label><label class="sm:col-span-2">Email Address *<input
                v-model="form.email" type="email" placeholder="user@dswd.gov.ph"></label><label>Role *<select
                v-model="form.role">
                <option value="" disabled>Select role</option>
                <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
              </select></label><label>Position<input v-model="form.position" type="text"
                placeholder="Administrative Officer"></label><label>Region<input v-model="form.region" type="text"
                placeholder="NCR - National Capital Region"></label><label>Status *<select v-model="form.status">
                <option value="" disabled>Select status</option>
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
              </select></label></div>
          <div class="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-gray-600">
            <p class="font-medium text-[#003366]">Permission Summary</p>
            <p class="mt-1 text-xs text-gray-500">Super admins and admins can manage users. Users can access approved
              workflows, and viewers have read-only access.</p>
          </div>
          <p v-if="formError" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ formError
            }}</p>
          <div class="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button"
              class="secondary-button" @click="closeModal">Cancel</button><button type="submit"
              class="primary-button" :disabled="saving">{{ saving ? 'Saving...' : 'Save User' }}</button></div>
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

.stat-card {
  border: 1px solid rgb(255 255 255/60%);
  border-radius: 1rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.stat-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: .65rem
}

.tone-blue {
  background: #eff6ff;
  color: #003366
}

.tone-green {
  background: #ecfdf5;
  color: #16a34a
}

.tone-gray {
  background: #f3f4f6;
  color: #6b7280
}

.tone-gold {
  background: #fffbeb;
  color: #c9a83e
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
  font-size: .875rem
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

.user-avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  color: white;
  font-size: .7rem;
  font-weight: 600
}

.role-pill,
.status-pill {
  display: inline-block;
  border-radius: 999px;
  padding: .25rem .65rem;
  font-size: .7rem;
  font-weight: 500
}

.role-pill {
  background: #dbeafe;
  color: #1e40af
}

.status-active {
  background: #dcfce7;
  color: #15803d
}

.status-inactive {
  background: #f3f4f6;
  color: #4b5563
}

.status-pending {
  background: #fef3c7;
  color: #b45309
}

.status-declined {
  background: #fee2e2;
  color: #b91c1c
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
  max-width: 680px;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 1.5rem;
  background: white;
  padding: 1.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0/25%)
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
.form-grid select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: .75rem;
  padding: .625rem .75rem;
  font-weight: 400;
  outline: none
}

.form-grid input:focus,
.form-grid select:focus {
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
