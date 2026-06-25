<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const isSidebarOpen = ref(false)
const searchQuery = ref('')

const navigation = [
  { label: 'Dashboard', icon: 'dashboard', active: true, route: 'dashboard' },
  { label: 'Referrals', icon: 'referrals', badge: '24', route: 'referrals' },
  { label: 'Referrals for Action', icon: 'clock', badge: '7', route: 'actions' },
  { label: 'User Management', icon: 'users', route: 'users' },
  { label: 'Settings', icon: 'settings', route: 'settings' },
  { label: 'Reference Data', icon: 'database', route: 'reference' },
  { label: 'Reports', icon: 'reports', route: 'reports' },
  { label: 'Archive', icon: 'archive', route: 'archive' },
  { label: 'Audit Log', icon: 'audit', route: 'audit' },
]

const stats = [
  { label: 'Total Referrals', value: '342', detail: '12% this month', icon: 'folder', color: 'blue' },
  { label: 'For Action', value: '27', detail: '4 overdue', icon: 'clock', color: 'gold' },
  { label: 'Active Cases', value: '156', detail: '8% this month', icon: 'reports', color: 'indigo' },
  { label: 'Resolved', value: '159', detail: '5% this month', icon: 'check', color: 'green' },
]

const referrals = [
  { id: 'R-2026-0421', client: 'M. Cruz', date: '2026-06-17', status: 'For action', tone: 'amber' },
  { id: 'R-2026-0398', client: 'A. Santos', date: '2026-06-15', status: 'Completed', tone: 'green' },
  { id: 'R-2026-0435', client: 'J. Bautista', date: '2026-06-14', status: 'In progress', tone: 'blue' },
  { id: 'R-2026-0442', client: 'L. Rivera', date: '2026-06-12', status: 'For action', tone: 'amber' },
]

const quickActions = [
  { label: 'Add User', icon: 'users', tone: 'blue' },
  { label: 'New Referral', icon: 'referrals', tone: 'indigo' },
  { label: 'Action Queue', icon: 'clock', tone: 'amber' },
  { label: 'Reports', icon: 'reports', tone: 'green' },
]

const filteredReferrals = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return referrals
  return referrals.filter((referral) =>
    [referral.id, referral.client, referral.status].some((value) => value.toLowerCase().includes(query)),
  )
})

const currentDate = new Intl.DateTimeFormat('en-PH', {
  month: 'long', day: 'numeric', year: 'numeric',
}).format(new Date())

const logout = () => router.push({ name: 'login' })
const openNavigation = (item) => {
  if (item.route) router.push({ name: item.route })
}
const openNewReferral = () => router.push({ name: 'referrals', query: { create: '1' } })
const runQuickAction = (action) => {
  if (action.label === 'New Referral') openNewReferral()
  if (action.label === 'Add User') router.push({ name: 'users', query: { create: '1' } })
  if (action.label === 'Action Queue') router.push({ name: 'actions' })
  if (action.label === 'Reports') router.push({ name: 'reports' })
}
</script>

<template>
  <div class="dashboard-shell">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-30 bg-slate-950/45 md:hidden" @click="isSidebarOpen = false"></div>

    <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="sidebar-brand">
        <div class="logo-wrapper"><img src="/dswdlogo_notext.png" alt="DSWD Logo"></div>
        <span>PSB · RMS</span>
        <button class="ml-auto md:hidden" type="button" aria-label="Close menu" @click="isSidebarOpen = false">
          <AppIcon name="close" class="h-5 w-5" />
        </button>
      </div>

      <nav class="scrollable flex-1 space-y-1.5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <button v-for="item in navigation" :key="item.label" type="button" class="sidebar-item" :class="{ active: item.active }" @click="openNavigation(item)">
          <AppIcon :name="item.icon" class="h-5 w-5 shrink-0" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="user-profile">
        <div class="avatar">MR</div>
        <div class="min-w-0 leading-tight">
          <span class="block truncate text-xs font-medium text-white/90">M. D. Reyes</span>
          <span class="text-[11px] text-white/50">PSB · Admin</span>
        </div>
        <button type="button" class="logout-button" title="Log out" aria-label="Log out" @click="logout">
          <AppIcon name="logout" class="h-4 w-4" />
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="glass-topbar">
        <div class="flex min-w-0 items-center gap-3">
          <button class="menu-button md:hidden" type="button" aria-label="Open menu" @click="isSidebarOpen = true">
            <AppIcon name="menu" class="h-5 w-5" />
          </button>
          <div class="min-w-0">
            <h1 class="text-xl font-semibold tracking-tight text-gray-800">Dashboard</h1>
            <p class="truncate text-sm text-gray-400">{{ currentDate }} · PSB referral overview</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <label class="search-box">
            <span class="sr-only">Search referrals</span>
            <AppIcon name="search" class="h-4 w-4 text-gray-400" />
            <input v-model="searchQuery" type="search" placeholder="Search referrals...">
          </label>
          <button class="round-button hidden sm:grid" type="button" aria-label="Notifications"><AppIcon name="bell" class="h-5 w-5" /></button>
          <button class="primary-button" type="button" @click="openNewReferral"><AppIcon name="plus" class="h-4 w-4" /><span class="hidden sm:inline">New Referral</span></button>
        </div>
      </header>

      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <section class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Referral statistics">
          <article v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-medium text-gray-400 sm:text-sm">{{ stat.label }}</span>
              <span class="stat-icon" :class="`stat-${stat.color}`"><AppIcon :name="stat.icon" class="h-5 w-5" /></span>
            </div>
            <p class="mt-1 text-2xl font-semibold text-gray-800">{{ stat.value }}</p>
            <span class="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <AppIcon v-if="stat.label !== 'For Action'" name="arrowUp" class="h-3 w-3 text-green-500" />{{ stat.detail }}
            </span>
          </article>
        </section>

        <div class="grid gap-5 lg:grid-cols-3">
          <section class="content-card lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-sm font-semibold text-gray-700"><AppIcon name="referrals" class="h-4 w-4 text-[#c9a83e]" />Recent Referrals</h2>
              <button type="button" class="text-xs font-medium text-[#003366] hover:text-[#c9a83e]" @click="router.push({ name: 'referrals' })">View all →</button>
            </div>
            <div v-if="filteredReferrals.length" class="space-y-3">
              <button v-for="referral in filteredReferrals" :key="referral.id" type="button" class="referral-row">
                <span class="min-w-0 text-left">
                  <span class="block truncate text-sm font-medium text-gray-700">{{ referral.id }} · {{ referral.client }}</span>
                  <span class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">{{ referral.date }}<span class="status-pill" :class="`status-${referral.tone}`">{{ referral.status }}</span></span>
                </span>
                <span class="text-gray-300">›</span>
              </button>
            </div>
            <p v-else class="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">No referrals match “{{ searchQuery }}”.</p>
          </section>

          <section class="content-card flex flex-col">
            <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700"><AppIcon name="bolt" class="h-4 w-4 text-[#c9a83e]" />Quick Actions</h2>
            <div class="grid grid-cols-2 gap-2.5">
              <button v-for="action in quickActions" :key="action.label" type="button" class="quick-action" :class="`quick-${action.tone}`" @click="runQuickAction(action)">
                <AppIcon :name="action.icon" class="h-5 w-5" /><span>{{ action.label }}</span>
              </button>
            </div>
            <div class="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-400">
              <p class="flex items-center gap-2"><AppIcon name="lock" class="h-4 w-4 text-[#c9a83e]" />6 active users · 2 pending invites</p>
              <p class="mt-2 flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-green-400"></span>All systems operational</p>
            </div>
          </section>
        </div>

        <footer class="mt-6 flex items-center justify-between border-t border-gray-200/60 pt-4 text-[11px] text-gray-400">
          <span>PSB Referral Management · v2.0</span>
          <span class="flex items-center gap-2"><AppIcon name="lock" class="h-3.5 w-3.5" />Secured by Google OAuth</span>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f0f4f8;
  color: #334155;
}

.sidebar {
  position: relative;
  z-index: 40;
  display: flex;
  width: 250px;
  flex-shrink: 0;
  flex-direction: column;
  background: linear-gradient(180deg, #003366, #002244);
  border-right: 2px solid rgb(201 168 62 / 20%);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 18%);
  transition: transform 200ms ease;
}

.sidebar-brand {
  display: flex;
  height: 4rem;
  align-items: center;
  gap: .625rem;
  border-bottom: 2px solid rgb(201 168 62 / 20%);
  padding: 0 1.25rem;
  color: rgb(255 255 255 / 90%);
  font-size: .875rem;
  font-weight: 600;
}

.logo-wrapper {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
}

.logo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sidebar-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: .75rem;
  border-radius: .75rem;
  padding: .625rem .75rem;
  color: rgb(255 255 255 / 70%);
  text-align: left;
  font-size: .875rem;
  transition: 150ms ease;
}

.sidebar-item:hover {
  background: rgb(201 168 62 / 15%);
  color: white;
}

.sidebar-item.active {
  background: rgb(201 168 62 / 20%);
  color: #e8d48b;
  box-shadow: inset 3px 0 #c9a83e;
  font-weight: 500;
}

.nav-badge {
  margin-left: auto;
  border-radius: 999px;
  background: rgb(201 168 62 / 20%);
  padding: .125rem .5rem;
  color: #e8d48b;
  font-size: 11px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: .75rem;
  border-top: 2px solid rgb(201 168 62 / 15%);
  padding: .75rem 1rem;
}

.avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  background: rgb(201 168 62 / 20%);
  color: #e8d48b;
  font-size: .75rem;
  font-weight: 700;
}

.logout-button {
  margin-left: auto;
  color: rgb(255 255 255 / 40%);
}

.logout-button:hover {
  color: white;
}

.glass-topbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border-bottom: 2px solid rgb(201 168 62 / 15%);
  background: rgb(255 255 255 / 85%);
  padding: .75rem 1.5rem;
  backdrop-filter: blur(8px);
}

.menu-button,
.round-button {
  place-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: rgb(255 255 255 / 80%);
  padding: .5rem;
  color: #64748b;
}

.search-box {
  display: flex;
  align-items: center;
  gap: .5rem;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: rgb(255 255 255 / 70%);
  padding: .5rem .75rem;
}

.search-box:focus-within {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62 / 15%);
}

.search-box input {
  width: 9rem;
  background: transparent;
  font-size: .875rem;
  outline: none;
}

.primary-button {
  display: flex;
  align-items: center;
  gap: .5rem;
  border-radius: 999px;
  background: #c9a83e;
  padding: .55rem 1rem;
  color: white;
  font-size: .875rem;
  font-weight: 500;
  transition: 200ms;
}

.primary-button:hover {
  transform: translateY(-1px);
  background: #b8942e;
  box-shadow: 0 4px 12px rgb(201 168 62 / 30%);
}

.stat-card,
.content-card {
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 1.25rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 4px 12px -6px rgb(0 0 0 / 6%);
}

.content-card {
  padding: 1.25rem;
}

.stat-card {
  transition: 200ms;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -12px rgb(0 20 40 / 15%);
}

.stat-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: .65rem;
}

.stat-blue {
  background: #eff6ff;
  color: #003366;
}

.stat-gold {
  background: #fffbeb;
  color: #c9a83e;
}

.stat-indigo {
  background: #eef2ff;
  color: #818cf8;
}

.stat-green {
  background: #ecfdf5;
  color: #4ade80;
}

.referral-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid rgb(243 244 246 / 70%);
  border-radius: .75rem;
  background: rgb(249 250 251 / 80%);
  padding: .75rem;
  transition: 150ms;
}

.referral-row:hover {
  background: #f3f4f6;
}

.status-pill {
  border-radius: 999px;
  padding: .125rem .5rem;
  font-size: 10px;
  text-transform: lowercase;
}

.status-amber {
  background: #fef3c7;
  color: #b45309;
}

.status-green {
  background: #dcfce7;
  color: #15803d;
}

.status-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  border-radius: .75rem;
  padding: .75rem;
  font-size: .75rem;
  transition: 150ms;
}

.quick-blue {
  background: #eff6ff;
  color: #003366;
}

.quick-indigo {
  background: #eef2ff;
  color: #3730a3;
}

.quick-amber {
  background: #fffbeb;
  color: #b45309;
}

.quick-green {
  background: #ecfdf5;
  color: #047857;
}

.quick-action:hover {
  filter: brightness(.96);
  transform: translateY(-1px);
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

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .glass-topbar {
    padding: .75rem 1rem;
  }

  .search-box input {
    width: 5rem;
  }
}

@media (max-width: 420px) {
  .search-box {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {

  .sidebar,
  .primary-button,
  .stat-card,
  .quick-action {
    transition: none;
  }
}
</style>
