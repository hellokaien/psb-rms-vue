<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const isSidebarOpen = ref(false)
const selectedLog = ref(null)
const searchQuery = ref('')
const actionFilter = ref('All Actions')
const userFilter = ref('All Users')
const dateFilter = ref('')
const exportMessage = ref('')

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

const logs = [
  { id: 1, activity: 'User Created', user: 'M. D. Reyes', action: 'Create', description: 'Created new user account for A. Aguilar', ip: '192.168.1.100', date: '2026-06-18', timestamp: '2026-06-18 14:32:45', relativeTime: '2 min ago', icon: 'users' },
  { id: 2, activity: 'Referral Updated', user: 'J. Santos', action: 'Update', description: 'Updated referral R-2026-0421 to In Progress', ip: '192.168.1.102', date: '2026-06-18', timestamp: '2026-06-18 14:20:15', relativeTime: '15 min ago', icon: 'referrals' },
  { id: 3, activity: 'Referral Deleted', user: 'L. Garcia', action: 'Delete', description: 'Deleted archived referral R-2026-0410', ip: '192.168.1.103', date: '2026-06-18', timestamp: '2026-06-18 13:45:22', relativeTime: '1 hour ago', icon: 'archive' },
  { id: 4, activity: 'User Login', user: 'M. D. Reyes', action: 'Login', description: 'Successful login from Chrome browser', ip: '192.168.1.100', date: '2026-06-18', timestamp: '2026-06-18 12:30:10', relativeTime: '2 hours ago', icon: 'logout' },
  { id: 5, activity: 'Settings Updated', user: 'M. D. Reyes', action: 'Update', description: 'Updated system notification preferences', ip: '192.168.1.100', date: '2026-06-18', timestamp: '2026-06-18 11:15:30', relativeTime: '3 hours ago', icon: 'settings' },
  { id: 6, activity: 'Report Exported', user: 'J. Santos', action: 'Export', description: 'Exported monthly referral report as PDF', ip: '192.168.1.102', date: '2026-06-18', timestamp: '2026-06-18 10:45:00', relativeTime: '4 hours ago', icon: 'reports' },
  { id: 7, activity: 'User Deactivated', user: 'M. D. Reyes', action: 'Update', description: 'Deactivated user account for M. Rivera', ip: '192.168.1.100', date: '2026-06-18', timestamp: '2026-06-18 09:20:05', relativeTime: '5 hours ago', icon: 'users' },
]

const uniqueUsers = computed(() => [...new Set(logs.map((log) => log.user))])
const filteredLogs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return logs.filter((log) => {
    const matchesSearch = !query || [log.activity, log.user, log.description].some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (actionFilter.value === 'All Actions' || log.action === actionFilter.value) && (userFilter.value === 'All Users' || log.user === userFilter.value) && (!dateFilter.value || log.date === dateFilter.value)
  })
})

const navigate = (item) => { if (item.route) router.push({ name: item.route }) }
const clearFilters = () => {
  searchQuery.value = ''
  actionFilter.value = 'All Actions'
  userFilter.value = 'All Users'
  dateFilter.value = ''
}
const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`
const exportLogs = () => {
  const headings = ['Activity', 'User', 'Action', 'Description', 'IP Address', 'Timestamp']
  const rows = filteredLogs.value.map((log) => [log.activity, log.user, log.action, log.description, log.ip, log.timestamp])
  const csv = [headings, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'psb-audit-logs.csv'
  link.click()
  URL.revokeObjectURL(url)
  exportMessage.value = `Exported ${rows.length} audit ${rows.length === 1 ? 'entry' : 'entries'}.`
  window.setTimeout(() => { exportMessage.value = '' }, 2500)
}
</script>

<template>
  <div class="page-shell">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-30 bg-slate-950/45 md:hidden" @click="isSidebarOpen = false"></div>
    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="brand">
        <div class="logo"><img src="/dswdlogo_notext.png" alt="DSWD Logo"></div><span>PSB · RMS</span><button
          class="ml-auto md:hidden" type="button" aria-label="Close menu" @click="isSidebarOpen = false">
          <AppIcon name="close" class="h-5 w-5" />
        </button>
      </div>
      <nav class="scrollable flex-1 space-y-1.5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <button v-for="item in navigation" :key="item.label" type="button" class="nav-item"
          :class="{ active: item.route === 'audit' }" @click="navigate(item)">
          <AppIcon :name="item.icon" class="h-5 w-5 shrink-0" /><span>{{ item.label }}</span><span v-if="item.badge"
            class="badge">{{ item.badge }}</span>
        </button>
      </nav>
      <div class="profile">
        <div class="avatar">MR</div>
        <div class="min-w-0">
          <p class="truncate text-xs text-white/90">M. D. Reyes</p>
          <p class="text-[11px] text-white/50">PSB · Admin</p>
        </div><button class="ml-auto text-white/40 hover:text-white" type="button" aria-label="Log out"
          @click="router.push({ name: 'login' })">
          <AppIcon name="logout" class="h-4 w-4" />
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <div class="flex min-w-0 items-center gap-3"><button class="menu-button md:hidden" type="button"
            aria-label="Open menu" @click="isSidebarOpen = true">
            <AppIcon name="menu" class="h-5 w-5" />
          </button>
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-gray-800">Audit Log</h1>
            <p class="text-sm text-gray-400">Track all system activities and user actions</p>
          </div>
        </div><button class="primary-button" type="button" @click="exportLogs">
          <AppIcon name="reports" class="h-4 w-4" /><span class="hidden sm:inline">Export Logs</span>
        </button>
      </header>

      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <section class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Audit statistics">
          <article class="stat-card">
            <div><span>Total Activities</span>
              <AppIcon name="audit" />
            </div><strong>1,284</strong><small class="text-green-500">↑ 12% this week</small>
          </article>
          <article class="stat-card">
            <div><span>Today</span>
              <AppIcon name="clock" />
            </div><strong>47</strong><small>Recorded events</small>
          </article>
          <article class="stat-card">
            <div><span>Unique Users</span>
              <AppIcon name="users" />
            </div><strong>12</strong><small>Active this week</small>
          </article>
          <article class="stat-card">
            <div><span>Last Activity</span>
              <AppIcon name="clock" />
            </div><strong class="text-base">2 minutes ago</strong><small>M. Reyes updated referral</small>
          </article>
        </section>

        <section class="filter-card" aria-label="Audit log filters"><label class="search-input">
            <AppIcon name="search" class="h-4 w-4 text-gray-400" /><input v-model="searchQuery" type="search"
              placeholder="Search by user, action, or description...">
          </label>
          <div class="flex flex-wrap gap-2"><select v-model="actionFilter" class="control">
              <option>All Actions</option>
              <option>Login</option>
              <option>Create</option>
              <option>Update</option>
              <option>Delete</option>
              <option>Export</option>
            </select><select v-model="userFilter" class="control">
              <option>All Users</option>
              <option v-for="user in uniqueUsers" :key="user">{{ user }}</option>
            </select><input v-model="dateFilter" type="date" class="control"><button type="button" class="clear-button"
              @click="clearFilters">Clear</button></div>
        </section>

        <section class="table-card">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px]">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Time</th>
                  <th class="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in filteredLogs" :key="log.id">
                  <td>
                    <div class="flex items-center gap-3"><span class="activity-icon"
                        :class="`action-${log.action.toLowerCase()}`">
                        <AppIcon :name="log.icon" class="h-4 w-4" />
                      </span><span class="font-medium text-gray-700">{{ log.activity }}</span></div>
                  </td>
                  <td>{{ log.user }}</td>
                  <td><span class="action-pill" :class="`action-${log.action.toLowerCase()}`">{{ log.action }}</span>
                  </td>
                  <td class="text-gray-500">{{ log.ip }}</td>
                  <td class="whitespace-nowrap text-gray-500">{{ log.relativeTime }}</td>
                  <td class="text-right"><button type="button" class="font-medium text-[#c9a83e] hover:text-[#b8942e]"
                      @click="selectedLog = log">View</button></td>
                </tr>
                <tr v-if="!filteredLogs.length">
                  <td colspan="6" class="py-10 text-center text-gray-400">No audit entries match these filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><span>Showing {{ filteredLogs.length }} demo activities</span>
            <div class="flex gap-1"><button disabled>Previous</button><button class="current">1</button><button
                disabled>Next</button></div>
          </div>
        </section>
      </main>
    </div>

    <div v-if="selectedLog" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="audit-modal-title"
      @click.self="selectedLog = null">
      <div class="modal">
        <div class="mb-4 flex items-center justify-between">
          <h2 id="audit-modal-title" class="text-lg font-semibold text-gray-800">Activity Details</h2><button
            type="button" class="text-2xl text-gray-400" aria-label="Close" @click="selectedLog = null">×</button>
        </div>
        <dl>
          <div>
            <dt>Activity</dt>
            <dd class="font-medium">{{ selectedLog.activity }}</dd>
          </div>
          <div>
            <dt>User</dt>
            <dd>{{ selectedLog.user }}</dd>
          </div>
          <div>
            <dt>Action</dt>
            <dd>{{ selectedLog.action }}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{{ selectedLog.description }}</dd>
          </div>
          <div>
            <dt>IP Address</dt>
            <dd>{{ selectedLog.ip }}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{{ selectedLog.timestamp }}</dd>
          </div>
        </dl>
        <div class="mt-6 flex justify-end border-t border-gray-100 pt-4"><button type="button" class="clear-button"
            @click="selectedLog = null">Close</button></div>
      </div>
    </div>
    <p v-if="exportMessage" class="feedback" role="status">{{ exportMessage }}</p>
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

.stat-card div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #94a3b8;
  font-size: .8rem;
  font-weight: 500
}

.stat-card div svg {
  width: 1.1rem;
  height: 1.1rem
}

.stat-card strong,
.stat-card small {
  display: block
}

.stat-card strong {
  margin-top: .25rem;
  color: #1f2937;
  font-size: 1.5rem
}

.stat-card small {
  margin-top: .15rem;
  color: #94a3b8;
  font-size: .68rem
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

.control,
.clear-button {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .625rem .75rem;
  font-size: .8rem
}

.clear-button:hover {
  background: #f3f4f6
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
  font-size: .8rem
}

tbody tr {
  border-top: 1px solid #f3f4f6
}

tbody tr:hover {
  background: #f8fafc
}

.activity-icon {
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  place-items: center;
  border-radius: .65rem
}

.action-pill {
  display: inline-block;
  border-radius: 999px;
  padding: .25rem .65rem;
  font-size: .68rem;
  font-weight: 500
}

.action-create {
  background: #dbeafe;
  color: #1d4ed8
}

.action-update {
  background: #fef3c7;
  color: #b45309
}

.action-delete {
  background: #fee2e2;
  color: #b91c1c
}

.action-login {
  background: #ede9fe;
  color: #6d28d9
}

.action-export {
  background: #d1fae5;
  color: #047857
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
  max-width: 560px;
  border-radius: 1.5rem;
  background: white;
  padding: 1.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0/25%)
}

dl div {
  display: grid;
  grid-template-columns: 7rem 1fr;
  gap: 1rem;
  border-bottom: 1px solid #f3f4f6;
  padding: .7rem 0;
  font-size: .8rem
}

dt {
  color: #94a3b8
}

dd {
  color: #374151;
  overflow-wrap: anywhere
}

.feedback {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 120;
  border-radius: .75rem;
  background: #003366;
  padding: .75rem 1rem;
  color: white;
  box-shadow: 0 10px 25px rgb(0 0 0/18%);
  font-size: .8rem
}

.scrollable {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent
}

@media(min-width:1024px) {
  .filter-card {
    flex-direction: row
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

@media(max-width:480px) {
  dl div {
    grid-template-columns: 1fr;
    gap: .2rem
  }
}

@media(prefers-reduced-motion:reduce) {
  .sidebar {
    transition: none
  }
}
</style>
