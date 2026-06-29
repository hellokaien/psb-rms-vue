<script setup>
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'
import AppSidebar from './AppSidebar.vue'

defineProps({
  activeRoute: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
})

const isSidebarOpen = ref(false)
</script>

<template>
  <div class="shell">
    <AppSidebar v-model:open="isSidebarOpen" :active-route="activeRoute" />

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <div class="flex min-w-0 items-center gap-3">
          <button class="menu-button md:hidden" type="button" aria-label="Open menu" @click="isSidebarOpen = true">
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
  color: #334155;
}

.topbar {
  display: flex;
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 2px solid rgb(201 168 62 / 15%);
  background: rgb(255 255 255 / 85%);
  padding: 0.7rem 1.5rem;
  backdrop-filter: blur(8px);
}

.menu-button {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: white;
  padding: 0.5rem;
  color: #64748b;
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
  .topbar {
    padding: 0.7rem 1rem;
  }
}
</style>
