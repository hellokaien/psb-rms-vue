<script setup>
import { computed, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import AppIcon from '../components/AppIcon.vue'

const searchQuery = ref('')
const priorityFilter = ref('All Priorities')
const statusFilter = ref('Open')
const selectedReferral = ref(null)
const feedback = ref('')
const referrals = ref([
  { id: 'R-2026-0451', client: 'Ana Dela Cruz', type: 'Child Welfare', received: '2026-06-22', due: '2026-06-22', priority: 'Critical', status: 'Unassigned', assignee: '—', summary: 'Immediate assessment and protective intervention requested.' },
  { id: 'R-2026-0449', client: 'Roberto Lim', type: 'Senior Citizen', received: '2026-06-21', due: '2026-06-23', priority: 'Urgent', status: 'Assigned', assignee: 'J. Santos', summary: 'Home visit and assistance evaluation required.' },
  { id: 'R-2026-0447', client: 'Carla Mendoza', type: 'Disability', received: '2026-06-21', due: '2026-06-24', priority: 'Normal', status: 'In Progress', assignee: 'L. Garcia', summary: 'Validate documents and coordinate with the disability unit.' },
  { id: 'R-2026-0446', client: 'Nina Ramos', type: "Women's Welfare", received: '2026-06-20', due: '2026-06-22', priority: 'Urgent', status: 'Assigned', assignee: 'C. Perez', summary: 'Crisis assessment and referral to partner services.' },
  { id: 'R-2026-0444', client: 'Mario Flores', type: 'Mental Health', received: '2026-06-19', due: '2026-06-25', priority: 'Normal', status: 'In Progress', assignee: 'J. Santos', summary: 'Follow up psychosocial assessment and service plan.' },
  { id: 'R-2026-0441', client: 'Elisa Tan', type: 'Child Welfare', received: '2026-06-18', due: '2026-06-21', priority: 'Critical', status: 'Overdue', assignee: 'L. Garcia', summary: 'Overdue case conference and intervention update.' },
  { id: 'R-2026-0439', client: 'Pedro Aquino', type: 'Senior Citizen', received: '2026-06-18', due: '2026-06-24', priority: 'Normal', status: 'Assigned', assignee: 'C. Perez', summary: 'Verify eligibility and complete assistance recommendation.' },
])

const filteredReferrals = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return referrals.value.filter((item) => {
    const open = item.status !== 'Completed'
    const matchesStatus = statusFilter.value === 'All' || (statusFilter.value === 'Open' ? open : item.status === statusFilter.value)
    return matchesStatus && (priorityFilter.value === 'All Priorities' || item.priority === priorityFilter.value) && (!query || `${item.id} ${item.client} ${item.type} ${item.assignee}`.toLowerCase().includes(query))
  })
})
const stats = computed(() => ({
  total: referrals.value.filter((item) => item.status !== 'Completed').length,
  unassigned: referrals.value.filter((item) => item.status === 'Unassigned').length,
  overdue: referrals.value.filter((item) => item.status === 'Overdue').length,
  inProgress: referrals.value.filter((item) => item.status === 'In Progress').length,
}))

const notify = (message) => { feedback.value = message; window.setTimeout(() => { feedback.value = '' }, 2200) }
const takeAction = (item) => {
  item.status = 'In Progress'
  item.assignee = 'M. D. Reyes'
  notify(`${item.id} assigned to you.`)
}
const completeAction = (item) => {
  item.status = 'Completed'
  selectedReferral.value = null
  notify(`${item.id} marked completed.`)
}
</script>

<template>
  <AdminShell active-route="actions" title="Referrals for Action"
    subtitle="Review, assign, and resolve cases requiring attention">
    <section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article class="stat"><span>Open Queue</span><strong>{{ stats.total }}</strong><small>Cases requiring
          action</small></article>
      <article class="stat"><span>Unassigned</span><strong>{{ stats.unassigned }}</strong><small>Needs an owner</small>
      </article>
      <article class="stat"><span>Overdue</span><strong class="text-red-600">{{ stats.overdue }}</strong><small>Past due
          date</small></article>
      <article class="stat"><span>In Progress</span><strong>{{ stats.inProgress }}</strong><small>Currently
          handled</small></article>
    </section>
    <section class="filters"><label class="search">
        <AppIcon name="search" class="h-4 w-4 mt-5 text-gray-400" /><input v-model="searchQuery" type="search"
          placeholder="Search action queue...">
      </label><select v-model="priorityFilter">
        <option>All Priorities</option>
        <option>Critical</option>
        <option>Urgent</option>
        <option>Normal</option>
      </select><select v-model="statusFilter">
        <option>Open</option>
        <option>All</option>
        <option>Unassigned</option>
        <option>Assigned</option>
        <option>In Progress</option>
        <option>Overdue</option>
        <option>Completed</option>
      </select></section>
    <section class="table-card">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[820px]">
          <thead>
            <tr>
              <th>Referral</th>
              <th>Client</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredReferrals" :key="item.id">
              <td class="font-medium text-[#003366]">{{ item.id }}</td>
              <td><strong class="block font-medium text-gray-700">{{ item.client }}</strong><small
                  class="text-gray-400">{{ item.type }}</small></td>
              <td :class="{ 'font-medium text-red-600': item.status === 'Overdue' }">{{ item.due }}</td>
              <td><span class="pill" :class="`priority-${item.priority.toLowerCase()}`">{{ item.priority }}</span></td>
              <td><span class="pill status">{{ item.status }}</span></td>
              <td>{{ item.assignee }}</td>
              <td class="text-right"><button class="mr-3 font-medium text-[#c9a83e]" type="button"
                  @click="selectedReferral = item">Review</button><button v-if="item.status === 'Unassigned'"
                  class="font-medium text-blue-600" type="button" @click="takeAction(item)">Take</button></td>
            </tr>
            <tr v-if="!filteredReferrals.length">
              <td colspan="7" class="py-10 text-center text-gray-400">No referrals match this queue.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <div v-if="selectedReferral" class="overlay" @click.self="selectedReferral = null">
      <div class="modal">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-800">{{ selectedReferral.id }}</h2>
            <p class="text-xs text-gray-400">{{ selectedReferral.client }} · {{ selectedReferral.type }}</p>
          </div><button class="text-2xl text-gray-400" @click="selectedReferral = null">×</button>
        </div>
        <p class="rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-600">{{ selectedReferral.summary }}</p>
        <dl>
          <div>
            <dt>Priority</dt>
            <dd>{{ selectedReferral.priority }}</dd>
          </div>
          <div>
            <dt>Due Date</dt>
            <dd>{{ selectedReferral.due }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ selectedReferral.status }}</dd>
          </div>
          <div>
            <dt>Assigned To</dt>
            <dd>{{ selectedReferral.assignee }}</dd>
          </div>
        </dl>
        <div class="mt-5 flex justify-end gap-2"><button class="secondary"
            @click="selectedReferral = null">Close</button><button v-if="selectedReferral.status === 'Unassigned'"
            class="primary" @click="takeAction(selectedReferral)">Assign to Me</button><button
            v-else-if="selectedReferral.status !== 'Completed'" class="primary"
            @click="completeAction(selectedReferral)">Mark Completed</button></div>
      </div>
    </div>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </AdminShell>
</template>

<style scoped>
.stat,
.filters,
.table-card {
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.stat {
  padding: 1rem
}

.stat span,
.stat strong,
.stat small {
  display: block
}

.stat span {
  color: #94a3b8;
  font-size: .78rem;
  font-weight: 500
}

.stat strong {
  margin-top: .2rem;
  color: #1f2937;
  font-size: 1.5rem
}

.stat small {
  color: #94a3b8;
  font-size: .68rem
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: .6rem;
  margin-bottom: 1.25rem;
  padding: 1rem
}

.search {
  display: flex;
  min-width: 220px;
  flex: 1;
  align-items: center;
  gap: .5rem;
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .6rem .75rem
}

.search input {
  width: 100%;
  background: transparent;
  font-size: .8rem;
  outline: none
}

.filters select {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .6rem .75rem;
  font-size: .8rem
}

.table-card {
  overflow: hidden
}

th {
  background: #f9fafb;
  padding: .75rem 1rem;
  text-align: left;
  color: #64748b;
  font-size: .68rem;
  text-transform: uppercase
}

td {
  padding: .8rem 1rem;
  color: #475569;
  font-size: .78rem
}

tbody tr {
  border-top: 1px solid #f3f4f6
}

tbody tr:hover {
  background: #f8fafc
}

.pill {
  display: inline-block;
  border-radius: 999px;
  padding: .25rem .6rem;
  font-size: .68rem;
  font-weight: 500
}

.priority-critical {
  background: #fee2e2;
  color: #b91c1c
}

.priority-urgent {
  background: #fef3c7;
  color: #b45309
}

.priority-normal {
  background: #dbeafe;
  color: #1d4ed8
}

.pill.status {
  background: #f1f5f9;
  color: #475569
}

.overlay {
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
  border-radius: 1.25rem;
  background: white;
  padding: 1.5rem
}

.modal dl div {
  display: grid;
  grid-template-columns: 7rem 1fr;
  border-bottom: 1px solid #f3f4f6;
  padding: .65rem 0;
  font-size: .8rem
}

.modal dt {
  color: #94a3b8
}

.primary,
.secondary {
  border-radius: .75rem;
  padding: .6rem 1rem;
  font-size: .8rem
}

.primary {
  background: #c9a83e;
  color: white
}

.secondary {
  border: 1px solid #e5e7eb
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
  font-size: .8rem;
  box-shadow: 0 10px 25px rgb(0 0 0/18%)
}
</style>
