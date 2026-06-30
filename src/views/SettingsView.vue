<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppIcon from '../components/AppIcon.vue'
import { request } from '../lib/api'

const isSidebarOpen = ref(false)
const activeTab = ref('general')
const feedback = ref('')
const libraryError = ref('')
const libraryLoading = ref(false)
const savingLibrary = ref(false)
const programs = ref([])
const caseCategories = ref([])
const signatories = ref([])
const editingProgramId = ref(null)
const editingCaseCategoryId = ref(null)
const editingSignatoryId = ref(null)
const signatoryEsignFile = ref(null)

const tabs = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'system', label: 'System', icon: 'reports' },
  { id: 'danger', label: 'Danger Zone', icon: 'audit' },
]

const defaults = {
  systemName: 'PSB Referral Management System', shortName: 'PSB-RMS', language: 'English', timezone: 'Asia/Manila', maintenanceMode: false,
  theme: 'Light', compactSidebar: false,
  twoFactor: true, sessionTimeout: '30 minutes', passwordExpiry: '90 days', ipWhitelist: '', googleOAuth: true, googleClientId: '',
  newReferralEmail: true, actionRequiredEmail: true, weeklyDigest: false, systemAlerts: true,
  smtpServer: 'smtp.gmail.com', smtpPort: '587', encryption: 'TLS', senderEmail: 'noreply@psb.dswd.gov.ph',
  uploadLimit: '10 MB', allowedFiles: 'PDF, DOC, DOCX, JPG, PNG, XLSX', backupSchedule: 'Daily', retention: '7 years', auditLogging: true, logLevel: 'Information',
}

const getStoredSettings = () => {
  try {
    return JSON.parse(sessionStorage.getItem('psb-settings') || '{}')
  } catch {
    return {}
  }
}
const settings = reactive({ ...defaults, ...getStoredSettings() })
const programForm = reactive({ name: '', code: '', description: '', memo_feedback_timeline: '' })
const caseCategoryForm = reactive({ name: '', description: '', subcategories: [{ name: '' }] })
const signatoryForm = reactive({
  name: '',
  position: '',
  office: '',
  is_active: true,
  is_recipient: false,
  is_originator: false,
})

const showFeedback = (message) => {
  feedback.value = message
  window.setTimeout(() => { feedback.value = '' }, 2500)
}
const saveSettings = () => {
  sessionStorage.setItem('psb-settings', JSON.stringify(settings))
  showFeedback('Settings saved for this browser session.')
}
const resetSettings = () => {
  if (!window.confirm('Reset all settings to their default values?')) return
  Object.assign(settings, defaults)
  sessionStorage.removeItem('psb-settings')
  showFeedback('Settings were reset to defaults.')
}
const demoDangerAction = (action) => {
  if (window.confirm(`${action}? This is a demo and will not delete backend data.`)) showFeedback(`Demo only: ${action} was not executed.`)
}

const parsePayload = async (response) => response.json().catch(() => ({}))
const setLibraryError = (message) => {
  libraryError.value = message
  window.setTimeout(() => { libraryError.value = '' }, 3500)
}

async function loadLibraries() {
  libraryLoading.value = true
  libraryError.value = ''

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
      setLibraryError(programPayload.message || categoryPayload.message || signatoryPayload.message || 'Unable to load libraries.')
      return
    }

    programs.value = programPayload.programs || []
    caseCategories.value = categoryPayload.case_categories || []
    signatories.value = signatoryPayload.signatories || []
  } catch {
    setLibraryError('Unable to load libraries right now.')
  } finally {
    libraryLoading.value = false
  }
}

const resetProgramForm = () => {
  editingProgramId.value = null
  Object.assign(programForm, { name: '', code: '', description: '', memo_feedback_timeline: '' })
}
const editProgram = (program) => {
  editingProgramId.value = program.id
  Object.assign(programForm, {
    name: program.name || '',
    code: program.code || '',
    description: program.description || '',
    memo_feedback_timeline: program.memo_feedback_timeline || '',
  })
}
const saveProgram = async () => {
  if (!programForm.name.trim()) return setLibraryError('Program name is required.')
  savingLibrary.value = true

  try {
    const response = await request(editingProgramId.value ? `/auth/libraries/programs/${editingProgramId.value}` : '/auth/libraries/programs', {
      method: editingProgramId.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(programForm),
    })
    const payload = await parsePayload(response)
    if (!response.ok) return setLibraryError(payload.message || 'Unable to save program.')
    await loadLibraries()
    resetProgramForm()
    showFeedback(payload.message || 'Program saved.')
  } catch {
    setLibraryError('Unable to save program right now.')
  } finally {
    savingLibrary.value = false
  }
}
const deleteProgram = async (program) => {
  if (!window.confirm(`Remove program "${program.name}"?`)) return
  const response = await request(`/auth/libraries/programs/${program.id}`, { method: 'DELETE' })
  const payload = await parsePayload(response)
  if (!response.ok) return setLibraryError(payload.message || 'Unable to remove program.')
  programs.value = programs.value.filter((item) => item.id !== program.id)
  showFeedback('Program removed.')
}

const resetCaseCategoryForm = () => {
  editingCaseCategoryId.value = null
  Object.assign(caseCategoryForm, { name: '', description: '', subcategories: [{ name: '' }] })
}
const editCaseCategory = (category) => {
  editingCaseCategoryId.value = category.id
  Object.assign(caseCategoryForm, {
    name: category.name || '',
    description: category.description || '',
    subcategories: category.subcategories?.length ? category.subcategories.map((subcategory) => ({ name: subcategory.name })) : [{ name: '' }],
  })
}
const addSubcategory = () => {
  caseCategoryForm.subcategories.push({ name: '' })
}
const removeSubcategory = (index) => {
  caseCategoryForm.subcategories.splice(index, 1)
  if (!caseCategoryForm.subcategories.length) addSubcategory()
}
const saveCaseCategory = async () => {
  if (!caseCategoryForm.name.trim()) return setLibraryError('Case category name is required.')
  savingLibrary.value = true

  try {
    const payloadData = {
      ...caseCategoryForm,
      subcategories: caseCategoryForm.subcategories.filter((subcategory) => subcategory.name.trim()),
    }
    const response = await request(editingCaseCategoryId.value ? `/auth/libraries/case-categories/${editingCaseCategoryId.value}` : '/auth/libraries/case-categories', {
      method: editingCaseCategoryId.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadData),
    })
    const payload = await parsePayload(response)
    if (!response.ok) return setLibraryError(payload.message || 'Unable to save case category.')
    await loadLibraries()
    resetCaseCategoryForm()
    showFeedback(payload.message || 'Case category saved.')
  } catch {
    setLibraryError('Unable to save case category right now.')
  } finally {
    savingLibrary.value = false
  }
}
const deleteCaseCategory = async (category) => {
  if (!window.confirm(`Remove case category "${category.name}"?`)) return
  const response = await request(`/auth/libraries/case-categories/${category.id}`, { method: 'DELETE' })
  const payload = await parsePayload(response)
  if (!response.ok) return setLibraryError(payload.message || 'Unable to remove case category.')
  caseCategories.value = caseCategories.value.filter((item) => item.id !== category.id)
  showFeedback('Case category removed.')
}

const resetSignatoryForm = () => {
  editingSignatoryId.value = null
  signatoryEsignFile.value = null
  Object.assign(signatoryForm, { name: '', position: '', office: '', is_active: true, is_recipient: false, is_originator: false })
}
const editSignatory = (signatory) => {
  editingSignatoryId.value = signatory.id
  signatoryEsignFile.value = null
  Object.assign(signatoryForm, {
    name: signatory.name || '',
    position: signatory.position || '',
    office: signatory.office || '',
    is_active: Boolean(signatory.is_active),
    is_recipient: Boolean(signatory.is_recipient),
    is_originator: Boolean(signatory.is_originator),
  })
}
const onEsignChange = (event) => {
  signatoryEsignFile.value = event.target.files?.[0] || null
}
const signatoryPayload = () => {
  const formData = new FormData()
  formData.append('name', signatoryForm.name)
  formData.append('position', signatoryForm.position)
  formData.append('office', signatoryForm.office)
  formData.append('is_active', signatoryForm.is_active ? '1' : '0')
  formData.append('is_recipient', signatoryForm.is_recipient ? '1' : '0')
  formData.append('is_originator', signatoryForm.is_originator ? '1' : '0')
  if (signatoryEsignFile.value) formData.append('esign', signatoryEsignFile.value)
  return formData
}
const saveSignatory = async () => {
  if (!signatoryForm.name.trim() || !signatoryForm.position.trim() || !signatoryForm.office.trim()) {
    return setLibraryError('Signatory name, position, and office are required.')
  }

  savingLibrary.value = true

  try {
    const response = await request(editingSignatoryId.value ? `/auth/libraries/signatories/${editingSignatoryId.value}` : '/auth/libraries/signatories', {
      method: 'POST',
      body: signatoryPayload(),
    })
    const payload = await parsePayload(response)
    if (!response.ok) return setLibraryError(payload.message || 'Unable to save signatory.')
    await loadLibraries()
    resetSignatoryForm()
    showFeedback(payload.message || 'Signatory saved.')
  } catch {
    setLibraryError('Unable to save signatory right now.')
  } finally {
    savingLibrary.value = false
  }
}
const deleteSignatory = async (signatory) => {
  if (!window.confirm(`Remove signatory "${signatory.name}"?`)) return
  const response = await request(`/auth/libraries/signatories/${signatory.id}`, { method: 'DELETE' })
  const payload = await parsePayload(response)
  if (!response.ok) return setLibraryError(payload.message || 'Unable to remove signatory.')
  signatories.value = signatories.value.filter((item) => item.id !== signatory.id)
  showFeedback('Signatory removed.')
}

onMounted(loadLibraries)
</script>

<template>
  <div class="page-shell">
    <AppSidebar v-model:open="isSidebarOpen" active-route="settings" />
<div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <div class="flex min-w-0 items-center gap-3"><button class="menu-button md:hidden" type="button"
            aria-label="Open menu" @click="isSidebarOpen = true">
            <AppIcon name="menu" class="h-5 w-5" />
          </button>
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-gray-800">Settings</h1>
            <p class="text-sm text-gray-400">Configure system preferences and security</p>
          </div>
        </div>
        <button class="primary-button" type="button" @click="saveSettings">
          <AppIcon name="check" class="h-4 w-4" /><span class="hidden sm:inline">Save Changes</span>
        </button>
      </header>

      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <div class="tabs" role="tablist" aria-label="Settings sections">
          <button v-for="tab in tabs" :key="tab.id" type="button" class="tab"
            :class="{ active: activeTab === tab.id, danger: tab.id === 'danger' }" @click="activeTab = tab.id">
            <AppIcon :name="tab.icon" class="h-4 w-4" /><span>{{ tab.label }}</span>
          </button>
        </div>

        <div v-if="activeTab === 'general'" class="section-grid">
          <section class="settings-card">
            <h2>General Settings</h2>
            <div class="form-grid"><label>System Name<input v-model="settings.systemName"
                  type="text"></label><label>System Short Name<input v-model="settings.shortName"
                  type="text"></label><label>Default Language<select v-model="settings.language">
                  <option>English</option>
                  <option>Filipino</option>
                </select></label><label>Time Zone<select v-model="settings.timezone">
                  <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                  <option value="UTC">UTC</option>
                </select></label></div>
            <SettingToggle v-model="settings.maintenanceMode" title="Maintenance Mode"
              description="Temporarily prevent non-admin users from accessing the system." />
          </section>
          <section class="settings-card">
            <h2>Appearance</h2>
            <p class="field-title">Theme</p>
            <div class="grid grid-cols-3 gap-2"><button v-for="theme in ['Light', 'Dark', 'System']" :key="theme"
                type="button" class="theme-button" :class="{ active: settings.theme === theme }"
                @click="settings.theme = theme">{{ theme }}</button></div>
            <SettingToggle v-model="settings.compactSidebar" title="Compact Sidebar"
              description="Use a narrower sidebar on large screens." />
          </section>
        </div>

        <div v-else-if="activeTab === 'security'" class="section-grid">
          <section class="settings-card">
            <h2>Security Settings</h2>
            <SettingToggle v-model="settings.twoFactor" title="Require Two-Factor Authentication"
              description="Require an additional verification step for privileged accounts." />
            <div class="form-grid"><label>Session Timeout<select v-model="settings.sessionTimeout">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                </select></label><label>Password Expiry<select v-model="settings.passwordExpiry">
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                  <option>Never</option>
                </select></label><label class="sm:col-span-2">IP Whitelist<input v-model="settings.ipWhitelist"
                  type="text" placeholder="192.168.1.1, 10.0.0.1"></label></div>
          </section>
          <section class="settings-card">
            <h2>OAuth & Authentication</h2>
            <SettingToggle v-model="settings.googleOAuth" title="Enable Google OAuth"
              description="Allow authorized personnel to sign in using Google." /><label class="block-label">Google
              Client ID<input v-model="settings.googleClientId" type="text"
                placeholder="Client ID from Google Cloud Console"></label>
            <div class="info-box">Google client secrets must stay on your backend and should never be saved in Vue or a
              VITE_ variable.</div>
          </section>
        </div>

        <div v-else-if="activeTab === 'libraries'" class="library-stack">
          <p v-if="libraryError" class="error-box" role="alert">{{ libraryError }}</p>
          <p v-if="libraryLoading" class="info-box">Loading libraries...</p>

          <section class="library-section">
            <div class="settings-card">
              <h2>{{ editingProgramId ? 'Edit Program' : 'Add Program' }}</h2>
              <form class="form-grid" @submit.prevent="saveProgram">
                <label>Program Name *<input v-model="programForm.name" type="text"></label>
                <label>Program Code<input v-model="programForm.code" type="text"></label>
                <label class="sm:col-span-2">Description<textarea v-model="programForm.description" rows="3"></textarea></label>
                <label class="sm:col-span-2">Memo Feedback Timeline<input v-model="programForm.memo_feedback_timeline"
                    type="text" placeholder="fifteen (15) days"></label>
                <div class="form-actions sm:col-span-2">
                  <button v-if="editingProgramId" type="button" class="secondary-button" @click="resetProgramForm">Cancel</button>
                  <button type="submit" class="primary-button" :disabled="savingLibrary">{{ editingProgramId ? 'Update' : 'Save' }} Program</button>
                </div>
              </form>
            </div>
            <div class="settings-card">
              <h2>Programs</h2>
              <div class="library-list">
                <article v-for="program in programs" :key="program.id" class="library-item">
                  <div>
                    <strong>{{ program.name }}</strong>
                    <span>{{ program.code || 'No code' }}</span>
                    <p>{{ program.description || 'No description.' }}</p>
                  </div>
                  <div class="row-actions">
                    <button type="button" @click="editProgram(program)">Edit</button>
                    <button type="button" class="danger-link" @click="deleteProgram(program)">Remove</button>
                  </div>
                </article>
                <p v-if="!programs.length" class="empty-text">No programs found.</p>
              </div>
            </div>
          </section>

          <section class="library-section">
            <div class="settings-card">
              <h2>{{ editingCaseCategoryId ? 'Edit Case Category' : 'Add Case Category' }}</h2>
              <form class="form-grid" @submit.prevent="saveCaseCategory">
                <label class="sm:col-span-2">Category Name *<input v-model="caseCategoryForm.name" type="text"></label>
                <label class="sm:col-span-2">Description<textarea v-model="caseCategoryForm.description" rows="3"></textarea></label>
                <div class="sm:col-span-2">
                  <p class="field-title">Subcategories</p>
                  <div v-for="(subcategory, index) in caseCategoryForm.subcategories" :key="index" class="subcategory-row">
                    <input v-model="subcategory.name" type="text" placeholder="Subcategory name">
                    <button type="button" class="secondary-button" @click="removeSubcategory(index)">Remove</button>
                  </div>
                  <button type="button" class="secondary-button" @click="addSubcategory">Add Subcategory</button>
                </div>
                <div class="form-actions sm:col-span-2">
                  <button v-if="editingCaseCategoryId" type="button" class="secondary-button" @click="resetCaseCategoryForm">Cancel</button>
                  <button type="submit" class="primary-button" :disabled="savingLibrary">{{ editingCaseCategoryId ? 'Update' : 'Save' }} Category</button>
                </div>
              </form>
            </div>
            <div class="settings-card">
              <h2>Case Categories</h2>
              <div class="library-list">
                <article v-for="category in caseCategories" :key="category.id" class="library-item">
                  <div>
                    <strong>{{ category.name }}</strong>
                    <p>{{ category.description || 'No description.' }}</p>
                    <span>{{ category.subcategories?.map((subcategory) => subcategory.name).join(', ') || 'No subcategories' }}</span>
                  </div>
                  <div class="row-actions">
                    <button type="button" @click="editCaseCategory(category)">Edit</button>
                    <button type="button" class="danger-link" @click="deleteCaseCategory(category)">Remove</button>
                  </div>
                </article>
                <p v-if="!caseCategories.length" class="empty-text">No case categories found.</p>
              </div>
            </div>
          </section>

          <section class="library-section">
            <div class="settings-card">
              <h2>{{ editingSignatoryId ? 'Edit Signatory' : 'Add Signatory' }}</h2>
              <form class="form-grid" @submit.prevent="saveSignatory">
                <label>Full Name *<input v-model="signatoryForm.name" type="text"></label>
                <label>Position *<input v-model="signatoryForm.position" type="text"></label>
                <label class="sm:col-span-2">Office *<input v-model="signatoryForm.office" type="text"></label>
                <label class="sm:col-span-2">E-Signature Image<input type="file" accept="image/png,image/jpeg,image/webp"
                    @change="onEsignChange"></label>
                <div class="toggle-grid sm:col-span-2">
                  <label><input v-model="signatoryForm.is_active" type="checkbox"> Active</label>
                  <label><input v-model="signatoryForm.is_recipient" type="checkbox"> Recipient</label>
                  <label><input v-model="signatoryForm.is_originator" type="checkbox"> Originator</label>
                </div>
                <div class="form-actions sm:col-span-2">
                  <button v-if="editingSignatoryId" type="button" class="secondary-button" @click="resetSignatoryForm">Cancel</button>
                  <button type="submit" class="primary-button" :disabled="savingLibrary">{{ editingSignatoryId ? 'Update' : 'Save' }} Signatory</button>
                </div>
              </form>
            </div>
            <div class="settings-card">
              <h2>Signatories</h2>
              <div class="library-list">
                <article v-for="signatory in signatories" :key="signatory.id" class="library-item signatory-item">
                  <img v-if="signatory.esign_url" :src="signatory.esign_url" alt="" class="esign-preview">
                  <div>
                    <strong>{{ signatory.name }}</strong>
                    <span>{{ signatory.position }} · {{ signatory.office }}</span>
                    <p>{{ signatory.is_active ? 'Active' : 'Inactive' }}{{ signatory.is_recipient ? ' · Recipient' : '' }}{{ signatory.is_originator ? ' · Originator' : '' }}</p>
                  </div>
                  <div class="row-actions">
                    <button type="button" @click="editSignatory(signatory)">Edit</button>
                    <button type="button" class="danger-link" @click="deleteSignatory(signatory)">Remove</button>
                  </div>
                </article>
                <p v-if="!signatories.length" class="empty-text">No signatories found.</p>
              </div>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'notifications'" class="section-grid">
          <section class="settings-card">
            <h2>Notification Preferences</h2>
            <SettingToggle v-model="settings.newReferralEmail" title="New Referral"
              description="Email assigned personnel when a referral is created." />
            <SettingToggle v-model="settings.actionRequiredEmail" title="Action Required"
              description="Notify users when a case requires attention." />
            <SettingToggle v-model="settings.weeklyDigest" title="Weekly Digest"
              description="Send a weekly referral activity summary." />
            <SettingToggle v-model="settings.systemAlerts" title="System Alerts"
              description="Send maintenance and security notifications." />
          </section>
          <section class="settings-card">
            <h2>Email Settings</h2>
            <div class="form-grid"><label class="sm:col-span-2">SMTP Server<input v-model="settings.smtpServer"
                  type="text"></label><label>SMTP Port<input v-model="settings.smtpPort"
                  type="number"></label><label>Encryption<select v-model="settings.encryption">
                  <option>TLS</option>
                  <option>SSL</option>
                  <option>None</option>
                </select></label><label class="sm:col-span-2">Sender Email<input v-model="settings.senderEmail"
                  type="email"></label></div>
          </section>
        </div>

        <div v-else-if="activeTab === 'system'" class="section-grid">
          <section class="settings-card">
            <h2>System Configuration</h2>
            <div class="form-grid"><label>Upload Limit<select v-model="settings.uploadLimit">
                  <option>5 MB</option>
                  <option>10 MB</option>
                  <option>25 MB</option>
                  <option>50 MB</option>
                </select></label><label>Backup Schedule<select v-model="settings.backupSchedule">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select></label><label class="sm:col-span-2">Allowed File Types<input v-model="settings.allowedFiles"
                  type="text"></label><label>Data Retention<select v-model="settings.retention">
                  <option>3 years</option>
                  <option>5 years</option>
                  <option>7 years</option>
                  <option>Indefinite</option>
                </select></label><label>System Log Level<select v-model="settings.logLevel">
                  <option>Error</option>
                  <option>Warning</option>
                  <option>Information</option>
                  <option>Debug</option>
                </select></label></div>
            <SettingToggle v-model="settings.auditLogging" title="Audit Logging"
              description="Record user activity and administrative changes." />
          </section>
          <section class="settings-card">
            <h2>System Health</h2>
            <div class="health-row"><span><i class="health-dot green"></i>Application</span><strong>Operational</strong>
            </div>
            <div class="health-row"><span><i class="health-dot green"></i>Database</span><strong>Connected</strong>
            </div>
            <div class="health-row"><span><i class="health-dot green"></i>File Storage</span><strong>68%
                available</strong></div>
            <div class="health-row"><span><i class="health-dot gold"></i>Last Backup</span><strong>Today, 2:00
                AM</strong></div>
          </section>
        </div>

        <section v-else class="danger-card">
          <h2>Danger Zone</h2>
          <p>These controls represent destructive administrative operations. They are intentionally demo-only until
            backend authorization and audit logging are implemented.</p>
          <div class="danger-row">
            <div><strong>Clear Referral Data</strong><span>Remove all referral records from the system.</span></div>
            <button type="button" @click="demoDangerAction('Clear all referral data')">Clear Data</button>
          </div>
          <div class="danger-row">
            <div><strong>Remove All Users</strong><span>Remove every account except the current administrator.</span>
            </div><button type="button" @click="demoDangerAction('Remove all users')">Remove Users</button>
          </div>
          <div class="danger-row">
            <div><strong>Reset Settings</strong><span>Restore all settings to their factory defaults.</span></div>
            <button type="button" @click="resetSettings">Reset</button>
          </div>
        </section>

        <p v-if="feedback" class="feedback" role="status">{{ feedback }}</p>
      </main>
    </div>
  </div>
</template>

<script>
const SettingToggle = {
  props: { modelValue: Boolean, title: String, description: String },
  emits: ['update:modelValue'],
  template: `<label class="toggle-row"><span><strong>{{ title }}</strong><small>{{ description }}</small></span><input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)"><i></i></label>`,
}
export default { components: { SettingToggle } }
</script>

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

.tabs {
  display: flex;
  gap: .35rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  border-radius: 1rem;
  background: white;
  padding: .4rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.tab {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: .4rem;
  border-radius: .7rem;
  padding: .6rem .9rem;
  color: #64748b;
  font-size: .8rem;
  font-weight: 500
}

.tab:hover {
  background: #f8fafc
}

.tab.active {
  background: #003366;
  color: white
}

.tab.danger {
  color: #dc2626
}

.tab.danger.active {
  background: #dc2626;
  color: white
}

.section-grid {
  display: grid;
  gap: 1.25rem
}

.library-stack {
  display: grid;
  gap: 1.25rem
}

.library-section {
  display: grid;
  gap: 1.25rem
}

.settings-card {
  border: 1px solid rgb(255 255 255/60%);
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.settings-card h2 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600
}

.form-grid {
  display: grid;
  gap: 1rem
}

.form-grid label,
.block-label {
  display: flex;
  flex-direction: column;
  gap: .35rem;
  color: #374151;
  font-size: .8rem;
  font-weight: 500
}

.form-grid input,
.form-grid select,
.form-grid textarea,
.block-label input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: .75rem;
  padding: .625rem .75rem;
  background: white;
  font-weight: 400;
  outline: none
}

.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus,
.block-label input:focus {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%)
}

.form-grid textarea {
  min-height: 5.5rem;
  resize: vertical
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem
}

.secondary-button {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .625rem 1rem;
  color: #4b5563;
  font-size: .875rem
}

.secondary-button:hover {
  background: #f8fafc
}

.primary-button:disabled {
  cursor: wait;
  opacity: .7
}

.field-title {
  margin-bottom: .5rem;
  font-size: .8rem;
  font-weight: 500
}

.library-list {
  display: grid;
  gap: .75rem
}

.library-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #eef2f7;
  border-radius: .85rem;
  background: #f8fafc;
  padding: .85rem
}

.library-item strong,
.library-item span,
.library-item p {
  display: block
}

.library-item strong {
  color: #1f2937;
  font-size: .875rem
}

.library-item span {
  margin-top: .2rem;
  color: #64748b;
  font-size: .75rem
}

.library-item p {
  margin-top: .35rem;
  color: #6b7280;
  font-size: .78rem;
  line-height: 1.45
}

.row-actions {
  display: flex;
  flex-shrink: 0;
  gap: .55rem
}

.row-actions button {
  color: #1e40af;
  font-size: .78rem;
  font-weight: 600
}

.row-actions .danger-link {
  color: #b91c1c
}

.subcategory-row {
  display: flex;
  gap: .5rem;
  margin-bottom: .5rem
}

.subcategory-row input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: .75rem;
  padding: .625rem .75rem;
  outline: none
}

.toggle-grid {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem
}

.toggle-grid label {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  color: #475569;
  font-size: .8rem;
  font-weight: 600
}

.signatory-item {
  align-items: center
}

.esign-preview {
  width: 5rem;
  height: 3rem;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: .5rem;
  background: white;
  object-fit: contain
}

.empty-text {
  color: #94a3b8;
  font-size: .8rem
}

.error-box {
  border: 1px solid #fecaca;
  border-radius: .75rem;
  background: #fef2f2;
  padding: .75rem;
  color: #b91c1c;
  font-size: .8rem
}

.theme-button {
  border: 2px solid #e5e7eb;
  border-radius: .75rem;
  padding: .65rem;
  font-size: .8rem
}

.theme-button.active {
  border-color: #003366;
  background: #eff6ff;
  color: #003366;
  font-weight: 600
}

.info-box {
  margin-top: 1rem;
  border: 1px solid #bfdbfe;
  border-radius: .75rem;
  background: #eff6ff;
  padding: .75rem;
  color: #1e40af;
  font-size: .75rem;
  line-height: 1.4
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f3f4f6;
  padding: .75rem 0;
  font-size: .8rem
}

.health-row span {
  display: flex;
  align-items: center;
  gap: .5rem
}

.health-row strong {
  color: #64748b;
  font-size: .75rem
}

.health-dot {
  display: inline-block;
  width: .5rem;
  height: .5rem;
  border-radius: 999px
}

.health-dot.green {
  background: #4ade80
}

.health-dot.gold {
  background: #c9a83e
}

.danger-card {
  border: 1px solid #fecaca;
  border-radius: 1rem;
  background: white;
  padding: 1.25rem
}

.danger-card>h2 {
  color: #b91c1c;
  font-size: 1rem;
  font-weight: 600
}

.danger-card>p {
  margin: .35rem 0 1rem;
  color: #6b7280;
  font-size: .8rem
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid #fee2e2;
  padding: 1rem 0
}

.danger-row strong,
.danger-row span {
  display: block
}

.danger-row strong {
  font-size: .85rem;
  color: #374151
}

.danger-row span {
  margin-top: .2rem;
  color: #9ca3af;
  font-size: .75rem
}

.danger-row button {
  flex-shrink: 0;
  border-radius: .65rem;
  background: #dc2626;
  padding: .5rem .75rem;
  color: white;
  font-size: .75rem
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

:deep(.toggle-row) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
  padding-top: 1rem;
  cursor: pointer
}

:deep(.toggle-row strong),
:deep(.toggle-row small) {
  display: block
}

:deep(.toggle-row strong) {
  color: #374151;
  font-size: .8rem
}

:deep(.toggle-row small) {
  margin-top: .2rem;
  color: #9ca3af;
  font-size: .72rem
}

:deep(.toggle-row input) {
  position: absolute;
  opacity: 0
}

:deep(.toggle-row i) {
  position: relative;
  width: 2.5rem;
  height: 1.35rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: #d1d5db;
  transition: .2s
}

:deep(.toggle-row i::after) {
  position: absolute;
  top: .175rem;
  left: .175rem;
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  background: white;
  content: '';
  transition: .2s
}

:deep(.toggle-row input:checked+i) {
  background: #c9a83e
}

:deep(.toggle-row input:checked+i::after) {
  transform: translateX(1.15rem)
}

@media(min-width:640px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr))
  }
}

@media(min-width:1024px) {
  .section-grid,
  .library-section {
    grid-template-columns: repeat(2, minmax(0, 1fr))
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

@media(prefers-reduced-motion:reduce) {

  .sidebar,
  :deep(.toggle-row i),
  :deep(.toggle-row i::after) {
    transition: none
  }
}
</style>
