<script setup>
import { computed, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import AppIcon from '../components/AppIcon.vue'

const searchQuery = ref('')
const typeFilter = ref('All Types')
const yearFilter = ref('All Years')
const selectedItem = ref(null)
const feedback = ref('')
const archived = ref([
  { id: 'R-2025-0310', client: 'Elena Mendoza', type: 'Child Welfare', closed: '2025-12-18', archived: '2026-01-18', outcome: 'Services completed', archivedBy: 'M. D. Reyes' },
  { id: 'R-2025-0288', client: 'Ramon Garcia', type: 'Senior Citizen', closed: '2025-11-25', archived: '2025-12-25', outcome: 'Assistance granted', archivedBy: 'J. Santos' },
  { id: 'R-2025-0251', client: 'Maribel Flores', type: 'Disability', closed: '2025-10-09', archived: '2025-11-09', outcome: 'Referred to partner agency', archivedBy: 'L. Garcia' },
  { id: 'R-2025-0199', client: 'Teresa Aquino', type: "Women's Welfare", closed: '2025-08-17', archived: '2025-09-17', outcome: 'Case plan completed', archivedBy: 'C. Perez' },
  { id: 'R-2024-0477', client: 'Jose Villanueva', type: 'Mental Health', closed: '2024-12-02', archived: '2025-01-02', outcome: 'Transferred to specialist', archivedBy: 'J. Santos' },
  { id: 'R-2024-0412', client: 'Lorna Cruz', type: 'Child Welfare', closed: '2024-10-21', archived: '2024-11-21', outcome: 'Family reunification', archivedBy: 'M. D. Reyes' },
])

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return archived.value.filter((item) => (!query || `${item.id} ${item.client} ${item.type}`.toLowerCase().includes(query)) && (typeFilter.value === 'All Types' || item.type === typeFilter.value) && (yearFilter.value === 'All Years' || item.closed.startsWith(yearFilter.value)))
})
const notify = (message) => { feedback.value = message; window.setTimeout(() => { feedback.value = '' }, 2200) }
const restore = (item) => {
  if (!window.confirm(`Restore ${item.id} to active referrals?`)) return
  archived.value = archived.value.filter((entry) => entry.id !== item.id)
  selectedItem.value = null
  notify(`${item.id} restored to referrals.`)
}
const permanentlyDelete = (item) => {
  if (!window.confirm(`Permanently delete ${item.id}? This cannot be undone.`)) return
  archived.value = archived.value.filter((entry) => entry.id !== item.id)
  selectedItem.value = null
  notify(`${item.id} permanently removed from this demo.`)
}
</script>

<template>
  <AdminShell active-route="archive" title="Archive" subtitle="Review and restore closed referral records">
    <section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><article class="stat"><span>Archived Records</span><strong>{{ archived.length }}</strong><small>Demo records available</small></article><article class="stat"><span>Archived This Year</span><strong>{{ archived.filter((item) => item.archived.startsWith('2026')).length }}</strong><small>Since January 2026</small></article><article class="stat"><span>Retention Period</span><strong>7 years</strong><small>Configured in Settings</small></article><article class="stat"><span>Storage Used</span><strong>1.8 GB</strong><small>32% of archive allocation</small></article></section>
    <section class="filters"><label class="search"><AppIcon name="search" class="h-4 w-4 text-gray-400" /><input v-model="searchQuery" type="search" placeholder="Search archived referrals..."></label><select v-model="typeFilter"><option>All Types</option><option>Child Welfare</option><option>Senior Citizen</option><option>Disability</option><option>Women's Welfare</option><option>Mental Health</option></select><select v-model="yearFilter"><option>All Years</option><option>2025</option><option>2024</option></select></section>
    <section class="table-card"><div class="overflow-x-auto"><table class="w-full min-w-[820px]"><thead><tr><th>Referral</th><th>Client</th><th>Type</th><th>Closed</th><th>Archived</th><th>Outcome</th><th class="text-right">Actions</th></tr></thead><tbody><tr v-for="item in filteredItems" :key="item.id"><td class="font-medium text-[#003366]">{{ item.id }}</td><td class="font-medium text-gray-700">{{ item.client }}</td><td>{{ item.type }}</td><td>{{ item.closed }}</td><td>{{ item.archived }}</td><td>{{ item.outcome }}</td><td class="text-right"><button class="mr-3 font-medium text-[#c9a83e]" type="button" @click="selectedItem = item">View</button><button class="font-medium text-blue-600" type="button" @click="restore(item)">Restore</button></td></tr><tr v-if="!filteredItems.length"><td colspan="7" class="py-10 text-center text-gray-400">No archived records found.</td></tr></tbody></table></div><div class="footer">Showing {{ filteredItems.length }} of {{ archived.length }} archived records</div></section>
    <div v-if="selectedItem" class="overlay" @click.self="selectedItem = null"><div class="modal"><div class="mb-4 flex items-center justify-between"><div><h2 class="text-lg font-semibold text-gray-800">{{ selectedItem.id }}</h2><p class="text-xs text-gray-400">Archived referral details</p></div><button class="text-2xl text-gray-400" @click="selectedItem = null">×</button></div><dl><div><dt>Client</dt><dd>{{ selectedItem.client }}</dd></div><div><dt>Case Type</dt><dd>{{ selectedItem.type }}</dd></div><div><dt>Outcome</dt><dd>{{ selectedItem.outcome }}</dd></div><div><dt>Closed Date</dt><dd>{{ selectedItem.closed }}</dd></div><div><dt>Archived Date</dt><dd>{{ selectedItem.archived }}</dd></div><div><dt>Archived By</dt><dd>{{ selectedItem.archivedBy }}</dd></div></dl><div class="mt-5 flex flex-wrap justify-end gap-2"><button class="danger" @click="permanentlyDelete(selectedItem)">Delete Permanently</button><button class="secondary" @click="selectedItem = null">Close</button><button class="primary" @click="restore(selectedItem)">Restore Referral</button></div></div></div>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </AdminShell>
</template>

<style scoped>
.stat,.filters,.table-card{border-radius:1rem;background:white;box-shadow:0 2px 8px rgb(0 0 0/4%)}.stat{padding:1rem}.stat span,.stat strong,.stat small{display:block}.stat span{color:#94a3b8;font-size:.78rem;font-weight:500}.stat strong{margin-top:.2rem;color:#1f2937;font-size:1.45rem}.stat small{color:#94a3b8;font-size:.68rem}.filters{display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:1.25rem;padding:1rem}.search{display:flex;min-width:220px;flex:1;align-items:center;gap:.5rem;border:1px solid #e5e7eb;border-radius:.75rem;background:#f9fafb;padding:.6rem .75rem}.search input{width:100%;background:transparent;font-size:.8rem;outline:none}.filters select{border:1px solid #e5e7eb;border-radius:.75rem;background:#f9fafb;padding:.6rem .75rem;font-size:.8rem}.table-card{overflow:hidden}th{background:#f9fafb;padding:.75rem 1rem;text-align:left;color:#64748b;font-size:.68rem;text-transform:uppercase}td{padding:.85rem 1rem;color:#64748b;font-size:.76rem}tbody tr{border-top:1px solid #f3f4f6}tbody tr:hover{background:#f8fafc}.footer{border-top:1px solid #f3f4f6;padding:.75rem 1rem;color:#94a3b8;font-size:.72rem}.overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgb(0 0 0/50%);padding:1rem;backdrop-filter:blur(4px)}.modal{width:100%;max-width:560px;border-radius:1.25rem;background:white;padding:1.5rem}.modal dl div{display:grid;grid-template-columns:7rem 1fr;border-bottom:1px solid #f3f4f6;padding:.65rem 0;font-size:.8rem}.modal dt{color:#94a3b8}.primary,.secondary,.danger{border-radius:.75rem;padding:.6rem .9rem;font-size:.78rem}.primary{background:#c9a83e;color:white}.secondary{border:1px solid #e5e7eb}.danger{background:#fee2e2;color:#b91c1c}.feedback{position:fixed;right:1rem;bottom:1rem;z-index:120;border-radius:.75rem;background:#003366;padding:.75rem 1rem;color:white;font-size:.8rem;box-shadow:0 10px 25px rgb(0 0 0/18%)}
</style>
