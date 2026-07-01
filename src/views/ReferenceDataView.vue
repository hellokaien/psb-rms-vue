<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import AppIcon from '../components/AppIcon.vue'
import { request } from '../lib/api'

const activeType = ref('programs')
const searchQuery = ref('')
const feedback = ref('')
const errorMessage = ref('')
const loading = ref(false)
const saving = ref(false)
const editingId = ref(null)
const esignFile = ref(null)

const programs = ref([])
const caseCategories = ref([])
const signatories = ref([])

const tabs = [
  { id: 'programs', label: 'Programs', itemLabel: 'Program' },
  { id: 'categories', label: 'Case Categories', itemLabel: 'Category' },
  { id: 'signatories', label: 'Signatories', itemLabel: 'Signatory' },
]

const programForm = reactive({ name: '', code: '', description: '', memo_feedback_timeline: '' })
const categoryForm = reactive({ name: '', description: '', subcategories: [{ name: '' }] })
const signatoryForm = reactive({
  name: '',
  position: '',
  office: '',
  is_active: true,
  is_recipient: false,
  is_originator: false,
})

const activeTab = computed(() => tabs.find((tab) => tab.id === activeType.value))
const activeItems = computed(() => {
  if (activeType.value === 'programs') return programs.value
  if (activeType.value === 'categories') return caseCategories.value
  return signatories.value
})
const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return activeItems.value.filter((item) => {
    const haystack = [
      item.name,
      item.code,
      item.description,
      item.position,
      item.office,
      item.memo_feedback_timeline,
      ...(item.subcategories?.map((subcategory) => subcategory.name) || []),
    ].join(' ').toLowerCase()
    return !query || haystack.includes(query)
  })
})

const parsePayload = async (response) => response.json().catch(() => ({}))
const notify = (message) => {
  feedback.value = message
  window.setTimeout(() => { feedback.value = '' }, 2500)
}
const fail = (message) => {
  errorMessage.value = message
  window.setTimeout(() => { errorMessage.value = '' }, 3500)
}

async function loadReferenceData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [programResponse, categoryResponse, signatoryResponse] = await Promise.all([
      request('/auth/libraries/programs'),
      request('/auth/libraries/case-categories'),
      request('/auth/libraries/signatories'),
    ])
    const [programPayload, categoryPayload, signatoryPayload] = await Promise.all([
      parsePayload(programResponse),
      parsePayload(categoryResponse),
      parsePayload(signatoryResponse),
    ])

    if (!programResponse.ok || !categoryResponse.ok || !signatoryResponse.ok) {
      fail(programPayload.message || categoryPayload.message || signatoryPayload.message || 'Unable to load reference data.')
      return
    }

    programs.value = programPayload.programs || []
    caseCategories.value = categoryPayload.case_categories || []
    signatories.value = signatoryPayload.signatories || []
  } catch {
    fail('Unable to load reference data right now.')
  } finally {
    loading.value = false
  }
}

const resetForms = () => {
  editingId.value = null
  esignFile.value = null
  Object.assign(programForm, { name: '', code: '', description: '', memo_feedback_timeline: '' })
  Object.assign(categoryForm, { name: '', description: '', subcategories: [{ name: '' }] })
  Object.assign(signatoryForm, { name: '', position: '', office: '', is_active: true, is_recipient: false, is_originator: false })
}
const switchTab = (tabId) => {
  activeType.value = tabId
  searchQuery.value = ''
  resetForms()
}

const editItem = (item) => {
  editingId.value = item.id
  if (activeType.value === 'programs') {
    Object.assign(programForm, {
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      memo_feedback_timeline: item.memo_feedback_timeline || '',
    })
  } else if (activeType.value === 'categories') {
    Object.assign(categoryForm, {
      name: item.name || '',
      description: item.description || '',
      subcategories: item.subcategories?.length ? item.subcategories.map((subcategory) => ({ name: subcategory.name })) : [{ name: '' }],
    })
  } else {
    esignFile.value = null
    Object.assign(signatoryForm, {
      name: item.name || '',
      position: item.position || '',
      office: item.office || '',
      is_active: Boolean(item.is_active),
      is_recipient: Boolean(item.is_recipient),
      is_originator: Boolean(item.is_originator),
    })
  }
}

const saveProgram = async () => {
  if (!programForm.name.trim()) return fail('Program name is required.')
  saving.value = true
  try {
    const response = await request(editingId.value ? `/auth/libraries/programs/${editingId.value}` : '/auth/libraries/programs', {
      method: editingId.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(programForm),
    })
    const payload = await parsePayload(response)
    if (!response.ok) return fail(payload.message || 'Unable to save program.')
    await loadReferenceData()
    resetForms()
    notify(payload.message || 'Program saved.')
  } catch {
    fail('Unable to save program right now.')
  } finally {
    saving.value = false
  }
}

const addSubcategory = () => categoryForm.subcategories.push({ name: '' })
const removeSubcategory = (index) => {
  categoryForm.subcategories.splice(index, 1)
  if (!categoryForm.subcategories.length) addSubcategory()
}
const saveCategory = async () => {
  if (!categoryForm.name.trim()) return fail('Case category name is required.')
  saving.value = true
  try {
    const data = {
      ...categoryForm,
      subcategories: categoryForm.subcategories.filter((subcategory) => subcategory.name.trim()),
    }
    const response = await request(editingId.value ? `/auth/libraries/case-categories/${editingId.value}` : '/auth/libraries/case-categories', {
      method: editingId.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const payload = await parsePayload(response)
    if (!response.ok) return fail(payload.message || 'Unable to save case category.')
    await loadReferenceData()
    resetForms()
    notify(payload.message || 'Case category saved.')
  } catch {
    fail('Unable to save case category right now.')
  } finally {
    saving.value = false
  }
}

const onEsignChange = (event) => {
  esignFile.value = event.target.files?.[0] || null
}
const saveSignatory = async () => {
  if (!signatoryForm.name.trim() || !signatoryForm.position.trim() || !signatoryForm.office.trim()) {
    return fail('Signatory name, position, and office are required.')
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('name', signatoryForm.name)
    formData.append('position', signatoryForm.position)
    formData.append('office', signatoryForm.office)
    formData.append('is_active', signatoryForm.is_active ? '1' : '0')
    formData.append('is_recipient', signatoryForm.is_recipient ? '1' : '0')
    formData.append('is_originator', signatoryForm.is_originator ? '1' : '0')
    if (esignFile.value) formData.append('esign', esignFile.value)

    const response = await request(editingId.value ? `/auth/libraries/signatories/${editingId.value}` : '/auth/libraries/signatories', {
      method: 'POST',
      body: formData,
    })
    const payload = await parsePayload(response)
    if (!response.ok) return fail(payload.message || 'Unable to save signatory.')
    await loadReferenceData()
    resetForms()
    notify(payload.message || 'Signatory saved.')
  } catch {
    fail('Unable to save signatory right now.')
  } finally {
    saving.value = false
  }
}

const saveActive = () => {
  if (activeType.value === 'programs') return saveProgram()
  if (activeType.value === 'categories') return saveCategory()
  return saveSignatory()
}
const removeItem = async (item) => {
  if (!window.confirm(`Delete "${item.name}"?`)) return

  const endpoint = activeType.value === 'programs'
    ? `/auth/libraries/programs/${item.id}`
    : activeType.value === 'categories'
      ? `/auth/libraries/case-categories/${item.id}`
      : `/auth/libraries/signatories/${item.id}`

  const response = await request(endpoint, { method: 'DELETE' })
  const payload = await parsePayload(response)
  if (!response.ok) return fail(payload.message || 'Unable to delete reference item.')
  await loadReferenceData()
  resetForms()
  notify('Reference item deleted.')
}

onMounted(loadReferenceData)
</script>

<template>
  <AdminShell
    active-route="reference"
    title="Reference Data"
    subtitle="Manage programs, case categories, and authorized signatories"
  >
    <div class="mb-5 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab"
        :class="{ active: activeType === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <p v-if="errorMessage" class="error-box" role="alert">{{ errorMessage }}</p>

    <section class="layout">
      <form class="card form-card" @submit.prevent="saveActive">
        <h2>{{ editingId ? 'Edit' : 'Add' }} {{ activeTab.itemLabel }}</h2>

        <template v-if="activeType === 'programs'">
          <label>Program Name *<input v-model="programForm.name" type="text" required></label>
          <label>Program Code<input v-model="programForm.code" type="text"></label>
          <label>Description<textarea v-model="programForm.description" rows="3"></textarea></label>
          <label>Memo Feedback Timeline<input v-model="programForm.memo_feedback_timeline" type="text" placeholder="fifteen (15) days"></label>
        </template>

        <template v-else-if="activeType === 'categories'">
          <label>Category Name *<input v-model="categoryForm.name" type="text" required></label>
          <label>Description<textarea v-model="categoryForm.description" rows="3"></textarea></label>
          <div>
            <p class="field-title">Subcategories</p>
            <div v-for="(subcategory, index) in categoryForm.subcategories" :key="index" class="subcategory-row">
              <input v-model="subcategory.name" type="text" placeholder="Subcategory name">
              <button type="button" class="secondary" @click="removeSubcategory(index)">Remove</button>
            </div>
            <button type="button" class="secondary" @click="addSubcategory">Add Subcategory</button>
          </div>
        </template>

        <template v-else>
          <label>Full Name *<input v-model="signatoryForm.name" type="text" required></label>
          <label>Position *<input v-model="signatoryForm.position" type="text" required></label>
          <label>Office *<input v-model="signatoryForm.office" type="text" required></label>
          <label>E-Signature Image<input type="file" accept="image/png,image/jpeg,image/webp" @change="onEsignChange"></label>
          <div class="toggle-grid">
            <label><input v-model="signatoryForm.is_active" type="checkbox"> Active</label>
            <label><input v-model="signatoryForm.is_recipient" type="checkbox"> Recipient</label>
            <label><input v-model="signatoryForm.is_originator" type="checkbox"> Originator</label>
          </div>
        </template>

        <div class="form-actions">
          <button v-if="editingId" type="button" class="secondary" @click="resetForms">Cancel</button>
          <button type="submit" class="primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Item' }}</button>
        </div>
      </form>

      <section class="card">
        <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-semibold text-gray-800">{{ activeTab.label }}</h2>
            <p class="mt-1 text-sm text-gray-400">
              {{ filteredItems.length }} configured {{ activeTab.label.toLowerCase() }}
            </p>
          </div>
          <label class="search">
            <AppIcon name="search" class="h-4 w-4 text-gray-400" />
            <input v-model="searchQuery" type="search" placeholder="Search reference data...">
          </label>
        </div>

        <div class="space-y-2">
          <p v-if="loading" class="py-10 text-center text-sm text-gray-400">Loading reference data...</p>
          <article v-for="item in filteredItems" :key="item.id" class="item">
            <img v-if="activeType === 'signatories' && item.esign_url" :src="item.esign_url" alt="" class="esign">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-medium text-gray-700">{{ item.name }}</h3>
              <p v-if="activeType === 'programs'" class="text-xs text-gray-400">
                {{ item.code || 'No code' }} · {{ item.description || 'No description' }}
              </p>
              <p v-else-if="activeType === 'categories'" class="text-xs text-gray-400">
                {{ item.description || 'No description' }} · {{ item.subcategories?.map((subcategory) => subcategory.name).join(', ') || 'No subcategories' }}
              </p>
              <p v-else class="text-xs text-gray-400">
                {{ item.position }} · {{ item.office }} · {{ item.is_active ? 'Active' : 'Inactive' }}
              </p>
            </div>
            <div class="flex shrink-0 gap-3">
              <button type="button" class="text-sm font-medium text-blue-600" @click="editItem(item)">Edit</button>
              <button type="button" class="text-sm font-medium text-red-500" @click="removeItem(item)">Delete</button>
            </div>
          </article>
          <p v-if="!loading && !filteredItems.length" class="py-10 text-center text-sm text-gray-400">
            No reference items found.
          </p>
        </div>
      </section>
    </section>

    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </AdminShell>
</template>

<style scoped>
.primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 999rem;
  background: #c9a83e;
  padding: 0.6rem 1rem;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
}
.primary:hover {
  background: #b8942e;
}
.primary:disabled {
  cursor: wait;
  opacity: .7;
}
.secondary {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.6rem 1rem;
  color: #4b5563;
  font-size: 0.8rem;
}
.tab {
  flex-shrink: 0;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}
.tab:hover {
  background: #f8fafc;
}
.tab.active {
  background: #003366;
  color: white;
}
.layout {
  display: grid;
  gap: 1rem;
}
.card {
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%);
}
.form-card {
  align-self: start;
}
.form-card h2 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
}
.form-card label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: .85rem;
  color: #374151;
  font-size: 0.8rem;
  font-weight: 500;
}
.form-card input,
.form-card textarea,
.subcategory-row input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
  font-weight: 400;
  outline: none;
}
.form-card textarea {
  min-height: 5rem;
  resize: vertical;
}
.form-card input:focus,
.form-card textarea:focus,
.subcategory-row input:focus {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%);
}
.field-title {
  margin: 1rem 0 .5rem;
  color: #374151;
  font-size: .8rem;
  font-weight: 600;
}
.subcategory-row {
  display: flex;
  gap: .5rem;
  margin-bottom: .5rem;
}
.toggle-grid {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: .85rem;
}
.toggle-grid label {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  margin: 0;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  margin-top: 1rem;
}
.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #f9fafb;
  padding: 0.6rem 0.75rem;
}
.search input {
  width: 14rem;
  background: transparent;
  font-size: 0.8rem;
  outline: none;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #f3f4f6;
  border-radius: 0.8rem;
  padding: 0.8rem;
}
.item:hover {
  background: #f8fafc;
}
.esign {
  width: 5rem;
  height: 3rem;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: .5rem;
  background: white;
  object-fit: contain;
}
.error-box {
  margin-bottom: 1rem;
  border: 1px solid #fecaca;
  border-radius: .75rem;
  background: #fef2f2;
  padding: .75rem;
  color: #b91c1c;
  font-size: .8rem;
}
.feedback {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 120;
  border-radius: 0.75rem;
  background: #003366;
  padding: 0.75rem 1rem;
  color: white;
  font-size: 0.8rem;
  box-shadow: 0 10px 25px rgb(0 0 0/18%);
}
@media (min-width: 1024px) {
  .layout {
    grid-template-columns: minmax(20rem, 26rem) minmax(0, 1fr);
  }
}
@media (max-width: 480px) {
  .search input {
    width: 100%;
  }
}
</style>
