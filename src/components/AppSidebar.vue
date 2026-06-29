<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  activeRoute: {
    type: String,
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

const router = useRouter()
const authStore = useAuthStore()
const showLogoutConfirm = ref(false)

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

const displayName = computed(() => authStore.user?.name || authStore.user?.email || 'Signed in user')
const displaySubtitle = computed(() => authStore.user?.email || 'Google account')
const avatarUrl = computed(() => authStore.user?.avatar || '')
const avatarInitials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return 'PS'

  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || 'P'
  const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] || 'S')
  return `${first}${last}`.toUpperCase()
})

const closeSidebar = () => {
  emit('update:open', false)
}

const navigate = (route) => {
  closeSidebar()
  router.push({ name: route })
}

const openProfile = () => {
  navigate('profile')
}

const requestLogout = () => {
  closeSidebar()
  showLogoutConfirm.value = true
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const confirmLogout = async () => {
  showLogoutConfirm.value = false
  await authStore.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="sidebar-shell">
    <div v-if="open" class="overlay md:hidden" @click="closeSidebar"></div>

    <aside class="sidebar" :class="{ open }" aria-label="Primary navigation">
      <div class="brand">
        <div class="logo">
          <img src="/dswdlogo_notext.png" alt="DSWD Logo">
        </div>
        <span>PSB · RMS</span>
        <button class="ml-auto md:hidden" type="button" aria-label="Close menu" @click="closeSidebar">
          <AppIcon name="close" class="h-5 w-5" />
        </button>
      </div>

      <nav class="scrollable flex-1 space-y-1.5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <button
          v-for="item in navigation"
          :key="item.route"
          type="button"
          class="nav-item"
          :class="{ active: item.route === props.activeRoute }"
          @click="navigate(item.route)"
        >
          <AppIcon :name="item.icon" class="h-5 w-5 shrink-0" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="profile" :class="{ active: props.activeRoute === 'profile' }">
        <button class="profile-link" type="button" aria-label="Open user profile" @click="openProfile">
          <span class="avatar">
            <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="avatar-image">
            <span v-else>{{ avatarInitials }}</span>
          </span>
          <span class="min-w-0 text-left">
            <span class="block truncate text-xs text-white/90">{{ displayName }}</span>
            <span class="block truncate text-[11px] text-white/50">{{ displaySubtitle }}</span>
          </span>
        </button>
        <button class="ml-auto text-white/40 hover:text-white" type="button" aria-label="Log out" @click="requestLogout">
          <AppIcon name="logout" class="h-4 w-4" />
        </button>
      </div>
    </aside>

    <div
      v-if="showLogoutConfirm"
      class="confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      @click.self="cancelLogout"
    >
      <div class="confirm-dialog">
        <h2 id="logout-confirm-title" class="text-lg font-semibold text-gray-900">Confirm logout</h2>
        <p class="mt-2 text-sm text-gray-600">
          Are you sure you want to log out? Your current session will be closed.
        </p>
        <div class="confirm-actions">
          <button type="button" class="secondary-button" @click="cancelLogout">Cancel</button>
          <button type="button" class="primary-button" @click="confirmLogout">Log out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-shell {
  display: contents;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgb(15 23 42 / 45%);
}

.sidebar {
  position: relative;
  z-index: 40;
  display: flex;
  width: 250px;
  flex-shrink: 0;
  flex-direction: column;
  background: linear-gradient(180deg, #003366, #002244);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 18%);
  transition: transform 200ms ease;
}

.brand {
  display: flex;
  height: 4rem;
  align-items: center;
  gap: 0.625rem;
  border-bottom: 2px solid rgb(201 168 62 / 20%);
  padding: 0 1.25rem;
  color: rgb(255 255 255 / 90%);
  font-size: 0.875rem;
  font-weight: 600;
}

.logo {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  background: white;
}

.logo img,
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  padding: 0.625rem 0.75rem;
  color: rgb(255 255 255 / 70%);
  text-align: left;
  font-size: 0.875rem;
}

.nav-item:hover {
  background: rgb(201 168 62 / 15%);
  color: white;
}

.nav-item.active {
  background: rgb(201 168 62 / 20%);
  color: #e8d48b;
  box-shadow: inset 3px 0 #c9a83e;
}

.badge {
  margin-left: auto;
  border-radius: 999px;
  background: rgb(201 168 62 / 20%);
  padding: 0.125rem 0.5rem;
  color: #e8d48b;
  font-size: 11px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-top: 2px solid rgb(201 168 62 / 15%);
  padding: 0.75rem 1rem;
}

.profile.active {
  background: rgb(201 168 62 / 12%);
}

.profile-link {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.75rem;
}

.profile-link:hover .avatar {
  box-shadow: 0 0 0 2px rgb(232 212 139 / 45%);
}

.avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(201 168 62 / 20%);
  color: #e8d48b;
  font-size: 0.75rem;
  font-weight: 700;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 55%);
  padding: 1rem;
}

.confirm-dialog {
  width: min(100%, 380px);
  border-radius: 1rem;
  background: white;
  padding: 1.5rem;
  box-shadow: 0 30px 60px rgb(15 23 42 / 15%);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #dc2626;
  padding: 0.55rem 1rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.secondary-button {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: white;
  padding: 0.55rem 1rem;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
}

.scrollable {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.scrollable::-webkit-scrollbar {
  width: 5px;
}

.scrollable::-webkit-scrollbar-thumb {
  border-radius: 20px;
  background: #cbd5e1;
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar {
    transition: none;
  }
}
</style>
