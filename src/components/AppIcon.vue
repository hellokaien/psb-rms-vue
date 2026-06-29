<script setup>
defineProps({
  name: { type: String, required: true },
})

const paths = {
  dashboard: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  referrals: ['M5 4h14v16H5z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  settings: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M19 15a2 2 0 0 0 1-1.7v-2.6A2 2 0 0 0 19 9l-.2-.1a2 2 0 0 1-.7-2.2l.1-.2-1.8-1.8-.2.1a2 2 0 0 1-2.2-.7L14 4h-4l-.1.2a2 2 0 0 1-2.2.7l-.2-.1-1.8 1.8.1.2A2 2 0 0 1 5.1 9l-.2.1A2 2 0 0 0 4 10.8v2.6a2 2 0 0 0 1 1.7l.2.1a2 2 0 0 1 .7 2.2l-.1.2 1.8 1.8.2-.1a2 2 0 0 1 2.2.7l.1.2h4l.1-.2a2 2 0 0 1 2.2-.7l.2.1 1.8-1.8-.1-.2a2 2 0 0 1 .7-2.2Z'],
  reports: ['M4 19V9', 'M10 19V5', 'M16 19v-7', 'M2 19h20'],
  archive: ['M3 6h18', 'M5 6v14h14V6', 'M4 3h16v3H4z', 'M9 10h6'],
  audit: ['M4 4h16v16H4z', 'M8 9h8', 'M8 13h5'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.35-4.35'],
  mail: ['M4 6h16v12H4z', 'm4 7 8 5 8-5'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
  plus: ['M12 5v14', 'M5 12h14'],
  folder: ['M3 5h7l2 2h9v12H3z'],
  check: ['M20 6 9 17l-5-5'],
  arrowUp: ['M12 19V5', 'm5 12 7-7 7 7'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  logout: ['M10 17l5-5-5-5', 'M15 12H3', 'M15 3h6v18h-6'],
  bolt: ['m13 2-9 12h8l-1 8 9-12h-8z'],
  lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  key: ['M15 7a4 4 0 1 0-2.83 6.83L4 22l3-1 1-3 3-1 1-3 1.17-1.17A4 4 0 0 0 15 7Z', 'M16 6h.01'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  save: ['M5 3h14l2 2v16H3V5z', 'M7 3v6h10V3', 'M7 21v-8h10v8'],
  database: ['M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3Z', 'M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6', 'M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6'],
}
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="path in paths[name]" :key="path" :d="path" />
  </svg>
</template>
