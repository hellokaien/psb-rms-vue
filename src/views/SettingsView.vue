<script setup>
import { reactive, ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppIcon from '../components/AppIcon.vue'

const isSidebarOpen = ref(false)
const activeTab = ref('general')
const feedback = ref('')

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
.block-label input:focus {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%)
}

.field-title {
  margin-bottom: .5rem;
  font-size: .8rem;
  font-weight: 500
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
  .section-grid {
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

