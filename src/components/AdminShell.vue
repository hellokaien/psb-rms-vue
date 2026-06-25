<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

defineProps({
  activeRoute: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
})

const router = useRouter()
const isSidebarOpen = ref(false)
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

const navigate = (route) => {
  isSidebarOpen.value = false
  router.push({ name: route })
}
</script>

<template>
  <div class="shell">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-30 bg-slate-950/45 md:hidden" @click="isSidebarOpen = false"></div>
    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="brand">
        <div class="logo"><img src="/dswdlogo_notext.png" alt="DSWD Logo"></div><span>PSB · RMS</span><button
          class="ml-auto md:hidden" type="button" aria-label="Close menu" @click="isSidebarOpen = false">
          <AppIcon name="close" class="h-5 w-5" />
        </button>
      </div>
      <nav class="scrollable flex-1 space-y-1.5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <button v-for="item in navigation" :key="item.route" type="button" class="nav-item"
          :class="{ active: item.route === activeRoute }" @click="navigate(item.route)">
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
          @click="navigate('login')">
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
          <div class="min-w-0">
            <h1 class="truncate text-xl font-semibold tracking-tight text-gray-800">{{ title }}</h1>
            <p class="truncate text-sm text-gray-400">{{ subtitle }}</p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <slot name="actions"></slot>
        </div>
      </header>
      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
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
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border-bottom: 2px solid rgb(201 168 62/15%);
  background: rgb(255 255 255/85%);
  padding: .7rem 1.5rem;
  backdrop-filter: blur(8px)
}

.menu-button {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: white;
  padding: .5rem;
  color: #64748b
}

.scrollable {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent
}

.scrollable::-webkit-scrollbar {
  width: 5px
}

.scrollable::-webkit-scrollbar-thumb {
  border-radius: 20px;
  background: #cbd5e1
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
    padding: .7rem 1rem
  }
}

@media(prefers-reduced-motion:reduce) {
  .sidebar {
    transition: none
  }
}
</style>
