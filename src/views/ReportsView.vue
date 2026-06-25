<script setup>
import { computed, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import AppIcon from '../components/AppIcon.vue'

const reportType = ref('Referral Summary')
const period = ref('This Month')
const startDate = ref('2026-06-01')
const endDate = ref('2026-06-22')
const generatedAt = ref('Not generated yet')
const feedback = ref('')
const monthlyData = [
  { month: 'Jan', value: 61 }, { month: 'Feb', value: 74 }, { month: 'Mar', value: 58 },
  { month: 'Apr', value: 86 }, { month: 'May', value: 78 }, { month: 'Jun', value: 92 },
]
const programs = [
  { name: 'Child Welfare', cases: 98, percent: 29 },
  { name: 'Senior Citizen', cases: 77, percent: 23 },
  { name: 'Disability', cases: 69, percent: 20 },
  { name: "Women's Welfare", cases: 55, percent: 16 },
  { name: 'Mental Health', cases: 43, percent: 12 },
]

const rangeLabel = computed(() => `${startDate.value} to ${endDate.value}`)
const generateReport = () => {
  generatedAt.value = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
  feedback.value = `${reportType.value} generated.`
  window.setTimeout(() => { feedback.value = '' }, 2200)
}
const exportCsv = () => {
  const rows = [['Program', 'Cases', 'Share'], ...programs.map((item) => [item.name, item.cases, `${item.percent}%`])]
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'psb-referral-report.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AdminShell active-route="reports" title="Reports"
    subtitle="Analyze referral trends, outcomes, and program performance">
    <template #actions><button class="primary" type="button" @click="exportCsv">
        <AppIcon name="reports" class="h-4 w-4" /><span class="hidden sm:inline">Export CSV</span>
      </button></template>
    <section class="filters"><label>Report Type<select v-model="reportType">
          <option>Referral Summary</option>
          <option>Case Outcomes</option>
          <option>Program Performance</option>
          <option>Staff Workload</option>
        </select></label><label>Period<select v-model="period">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
          <option>This Year</option>
          <option>Custom</option>
        </select></label><label>From<input v-model="startDate" type="date"></label><label>To<input v-model="endDate"
          type="date"></label><button class="primary self-end" type="button" @click="generateReport">Generate</button>
    </section>
    <section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article class="stat"><span>Total Referrals</span><strong>342</strong><small class="positive">↑ 12% from previous
          period</small></article>
      <article class="stat"><span>Resolution Rate</span><strong>86.4%</strong><small class="positive">↑ 3.1 percentage
          points</small></article>
      <article class="stat"><span>Average Resolution</span><strong>4.8 days</strong><small>Target: 5 days</small>
      </article>
      <article class="stat"><span>Overdue Rate</span><strong>3.2%</strong><small class="positive">↓ 1.4 percentage
          points</small></article>
    </section>
    <div class="grid gap-5 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h2>Monthly Referral Volume</h2>
            <p>{{ rangeLabel }}</p>
          </div><span class="text-xs text-gray-400">Generated: {{ generatedAt }}</span>
        </div>
        <div class="chart">
          <div v-for="item in monthlyData" :key="item.month" class="bar-column"><span>{{ item.value }}</span><i
              :style="{ height: `${item.value}%` }"></i><small>{{ item.month }}</small></div>
        </div>
      </section>
      <section class="card">
        <h2>Cases by Program</h2>
        <p class="mb-4">Current referral distribution</p>
        <div class="space-y-4">
          <div v-for="program in programs" :key="program.name">
            <div class="mb-1 flex justify-between text-xs"><span class="font-medium text-gray-600">{{ program.name
            }}</span><span class="text-gray-400">{{ program.cases }} · {{ program.percent }}%</span></div>
            <div class="progress"><i :style="{ width: `${program.percent}%` }"></i></div>
          </div>
        </div>
      </section>
    </div>
    <section class="card mt-5">
      <h2>Report Catalog</h2>
      <p class="mb-4">Generate commonly requested operational reports.</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><button
          v-for="item in ['Monthly Referral Summary', 'Case Resolution Analysis', 'Program Performance', 'Staff Workload']"
          :key="item" type="button" class="report-option" @click="reportType = item; generateReport()">
          <AppIcon name="reports" class="h-5 w-5" /><span>{{ item }}</span>
        </button></div>
    </section>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </AdminShell>
</template>

<style scoped>
.primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  border-radius: 999px;
  background: #c9a83e;
  padding: .62rem 1rem;
  color: white;
  font-size: .8rem;
  font-weight: 500
}

.primary:hover {
  background: #b8942e
}

.filters,
.stat,
.card {
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.filters {
  display: grid;
  gap: .75rem;
  margin-bottom: 1.25rem;
  padding: 1rem
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: .3rem;
  color: #64748b;
  font-size: .7rem;
  font-weight: 500
}

.filters select,
.filters input {
  border: 1px solid #e5e7eb;
  border-radius: .7rem;
  background: #f9fafb;
  padding: .58rem .7rem;
  color: #374151;
  font-size: .78rem;
  outline: none
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
  margin-top: .25rem;
  color: #1f2937;
  font-size: 1.45rem
}

.stat small {
  margin-top: .15rem;
  color: #94a3b8;
  font-size: .67rem
}

.stat small.positive {
  color: #22c55e
}

.card {
  padding: 1.25rem
}

.card h2 {
  color: #374151;
  font-size: .9rem;
  font-weight: 600
}

.card p {
  margin-top: .2rem;
  color: #94a3b8;
  font-size: .7rem
}

.chart {
  display: flex;
  height: 240px;
  align-items: flex-end;
  justify-content: space-around;
  gap: .75rem;
  border-bottom: 1px solid #e5e7eb;
  padding: 2rem .5rem 0
}

.bar-column {
  display: flex;
  height: 100%;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end
}

.bar-column span {
  margin-bottom: .25rem;
  color: #94a3b8;
  font-size: .65rem
}

.bar-column i {
  width: min(70%, 3rem);
  min-height: 1rem;
  border-radius: .5rem .5rem 0 0;
  background: linear-gradient(#c9a83e, #003366)
}

.bar-column small {
  margin-top: .5rem;
  color: #64748b;
  font-size: .65rem
}

.progress {
  height: .45rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0
}

.progress i {
  display: block;
  height: 100%;
  min-width: .4rem;
  border-radius: 999px;
  background: #c9a83e
}

.report-option {
  display: flex;
  align-items: center;
  gap: .65rem;
  border: 1px solid #e5e7eb;
  border-radius: .8rem;
  padding: .8rem;
  color: #003366;
  text-align: left;
  font-size: .75rem;
  font-weight: 500
}

.report-option:hover {
  border-color: #c9a83e;
  background: #fffbeb
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

@media(min-width:768px) {
  .filters {
    grid-template-columns: 1.4fr 1fr 1fr 1fr auto
  }
}
</style>
