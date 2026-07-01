<script setup>
import { computed, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import AppIcon from '../components/AppIcon.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const activeTab = ref('personal')
const showPasswordModal = ref(false)
const feedback = ref('')

const preferences = reactive({
  twoFactor: true,
  securityEmails: true,
  loginAlerts: false,
  compactMode: false,
  referralBadges: true,
  newReferralAlerts: true,
  referralUpdates: true,
  systemAnnouncements: false,
  theme: 'Light',
})

const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})

const tabs = [
  { id: 'personal', label: 'Personal', icon: 'users' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'preferences', label: 'Preferences', icon: 'settings' },
  { id: 'activity', label: 'Recent Activity', icon: 'clock' },
]

const stats = [
  { label: 'Referrals Created', value: '42' },
  { label: 'Cases Handled', value: '38' },
  { label: 'Resolution Rate', value: '89%' },
  { label: 'Total Activities', value: '156' },
]

const activities = [
  { icon: 'users', tone: 'blue', text: 'You created a new user account for A. Aguilar', time: '2 minutes ago' },
  { icon: 'referrals', tone: 'green', text: 'You updated referral R-2026-0421 status to In Progress', time: '15 minutes ago' },
  { icon: 'logout', tone: 'indigo', text: 'You logged in from Chrome browser', time: '2 hours ago' },
  { icon: 'settings', tone: 'amber', text: 'You updated system notification preferences', time: '3 hours ago' },
  { icon: 'check', tone: 'emerald', text: 'You resolved referral R-2026-0398', time: '5 hours ago' },
  { icon: 'reports', tone: 'rose', text: 'You exported monthly referral report', time: '6 hours ago' },
]

const user = computed(() => authStore.user || {})
const displayName = computed(() => user.value.name || user.value.email || 'Signed in user')
const email = computed(() => user.value.email || 'No email available')
const avatarUrl = computed(() => user.value.avatar || '')
const firstName = computed(() => displayName.value.split(/\s+/)[0] || '')
const lastName = computed(() => {
  const parts = displayName.value.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : ''
})
const initials = computed(() => {
  const parts = displayName.value.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || 'P'
  const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] || 'S')
  return `${first}${last}`.toUpperCase()
})
const createdAt = computed(() => formatDate(user.value.created_at, 'Joined date unavailable'))
const updatedAt = computed(() => formatDate(user.value.updated_at, 'No recent update available'))

function formatDate(value, fallback = 'Not available') {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function showFeedback(message) {
  feedback.value = message
  window.setTimeout(() => {
    feedback.value = ''
  }, 2600)
}

function saveProfile() {
  showFeedback('Profile preferences saved for this browser session.')
}

function openChangePassword() {
  showPasswordModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  Object.assign(passwordForm, { current: '', next: '', confirm: '' })
}

function updatePassword() {
  closePasswordModal()
  showFeedback('Password change is ready for backend integration.')
}
</script>

<template>
  <AdminShell active-route="profile" title="My Profile" subtitle="Manage your personal information and preferences">
    <template #actions>
      <button type="button" class="btn-gold" @click="saveProfile">
        <AppIcon name="save" class="h-4 w-4" />
        <span class="hidden sm:inline">Save Changes</span>
      </button>
    </template>

    <section class="profile-card profile-header">
      <div class="profile-identity">
        <div class="avatar-large">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName">
          <span v-else>{{ initials }}</span>
        </div>

        <div class="min-w-0 text-center md:text-left">
          <h2>{{ displayName }}</h2>
          <div class="meta-row">
            <span>{{ email }}</span>
            <span class="dot"></span>
            <span class="role-pill">Admin</span>
            <span class="active-pill">Active</span>
          </div>
          <div class="supporting-row">
            <span>
              <AppIcon name="folder" class="h-4 w-4" /> PSB Admin Department
            </span>
            <span>
              <AppIcon name="clock" class="h-4 w-4" /> Joined: {{ createdAt }}
            </span>
            <span>
              <AppIcon name="audit" class="h-4 w-4" /> Updated: {{ updatedAt }}
            </span>
          </div>
        </div>
      </div>

      <!-- <div class="profile-actions">
        <button type="button" class="icon-button" aria-label="Change password" @click="openChangePassword">
          <AppIcon name="key" class="h-4 w-4" />
        </button>
        <button type="button" class="edit-button" @click="activeTab = 'personal'">
          <AppIcon name="edit" class="h-4 w-4" />
          Edit Profile
        </button>
      </div>
      -->
    </section>

    <section class="stats-grid" aria-label="Profile statistics">
      <article v-for="stat in stats" :key="stat.label" class="stat-item">
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </article>
    </section>

    <nav class="profile-tabs" aria-label="Profile sections">
      <button v-for="tab in tabs" :key="tab.id" type="button" class="nav-tab" :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id">
        <AppIcon :name="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'personal'" class="profile-card">
      <h3>Personal Information</h3>
      <div class="form-grid">
        <label>First Name *<input :value="firstName" type="text"></label>
        <label>Last Name *<input :value="lastName" type="text"></label>
        <label>Middle Name<input type="text" placeholder="Not provided"></label>
        <label>Date of Birth<input type="date"></label>
        <label>Gender<select>
            <option>Prefer not to say</option>
            <option>Female</option>
            <option>Male</option>
          </select></label>
        <label>Email Address *<input :value="email" type="email"></label>
        <label>Department<input value="PSB Admin Department" type="text"></label>
        <label>Role<select>
            <option>Admin</option>
            <option>Social Worker</option>
            <option>Case Worker</option>
            <option>Viewer</option>
          </select></label>
      </div>
    </section>

    <section v-else-if="activeTab === 'security'" class="section-stack">
      <div class="profile-card">
        <h3>Security Settings</h3>
        <div class="setting-list">
          <ToggleRow v-model="preferences.twoFactor" title="Two-Factor Authentication"
            description="Add an extra layer of security to your account" />
          <ToggleRow v-model="preferences.securityEmails" title="Email Notifications"
            description="Receive security alerts via email" />
          <ToggleRow v-model="preferences.loginAlerts" title="Login Alerts"
            description="Get notified of new login attempts" />
        </div>
        <button type="button" class="btn-gold mt-4" @click="openChangePassword">
          <AppIcon name="key" class="h-4 w-4" />
          Change Password
        </button>
      </div>

      <div class="profile-card">
        <h3>Recent Login History</h3>
        <div class="login-list">
          <div><span><strong>Chrome - Windows</strong><small>192.168.1.100 - Manila, PH</small></span><em>Current
              Session</em></div>
          <div><span><strong>Firefox - Windows</strong><small>192.168.1.105 - Manila, PH</small></span><time>2 hours
              ago</time></div>
          <div><span><strong>Safari - iOS</strong><small>192.168.1.110 - Manila, PH</small></span><time>1 day ago</time>
          </div>
        </div>
      </div>
    </section>

    <section v-else-if="activeTab === 'preferences'" class="section-stack">
      <div class="profile-card">
        <h3>Display Preferences</h3>
        <div class="theme-group" aria-label="Theme preference">
          <button v-for="theme in ['Light', 'Dark', 'System Default']" :key="theme" type="button"
            :class="{ active: preferences.theme === theme }" @click="preferences.theme = theme">
            {{ theme }}
          </button>
        </div>
        <div class="setting-list mt-4">
          <ToggleRow v-model="preferences.compactMode" title="Compact Mode"
            description="Reduce spacing for more content density" />
          <ToggleRow v-model="preferences.referralBadges" title="Show Referral Badges"
            description="Display status badges on referral list" />
        </div>
      </div>

      <div class="profile-card">
        <h3>Notification Preferences</h3>
        <div class="setting-list">
          <ToggleRow v-model="preferences.newReferralAlerts" title="New Referral Alerts"
            description="Get notified when new referrals are created" />
          <ToggleRow v-model="preferences.referralUpdates" title="Referral Updates"
            description="Status changes and action updates" />
          <ToggleRow v-model="preferences.systemAnnouncements" title="System Announcements"
            description="Important system updates and news" />
        </div>
      </div>
    </section>

    <section v-else class="profile-card">
      <div class="section-heading">
        <h3>Recent Activity</h3>
        <button type="button">View All</button>
      </div>
      <div class="activity-list">
        <article v-for="activity in activities" :key="`${activity.text}-${activity.time}`" class="activity-item">
          <span class="activity-icon" :class="`tone-${activity.tone}`">
            <AppIcon :name="activity.icon" class="h-4 w-4" />
          </span>
          <div>
            <p>{{ activity.text }}</p>
            <time>{{ activity.time }}</time>
          </div>
        </article>
      </div>
    </section>

    <footer class="profile-footer">
      <span>PSB Referral Management - v2.0</span>
      <span>
        <AppIcon name="lock" class="h-3.5 w-3.5" /> Secured by Google OAuth
      </span>
    </footer>

    <p v-if="feedback" class="feedback" role="status">{{ feedback }}</p>

    <div v-if="showPasswordModal" class="modal-overlay" role="dialog" aria-modal="true"
      aria-labelledby="password-modal-title" @click.self="closePasswordModal">
      <form class="modal-content" @submit.prevent="updatePassword">
        <div class="modal-header">
          <h3 id="password-modal-title">Change Password</h3>
          <button type="button" aria-label="Close password modal" @click="closePasswordModal">x</button>
        </div>
        <label>Current Password *<input v-model="passwordForm.current" type="password" required
            placeholder="Enter current password"></label>
        <label>New Password *<input v-model="passwordForm.next" type="password" required minlength="8"
            placeholder="Min 8 characters"></label>
        <label>Confirm New Password *<input v-model="passwordForm.confirm" type="password" required minlength="8"
            placeholder="Confirm new password"></label>
        <p class="password-note">Password must be at least 8 characters and include uppercase, lowercase, number, and
          special character.</p>
        <div class="modal-actions">
          <button type="button" class="cancel-button" @click="closePasswordModal">Cancel</button>
          <button type="submit" class="btn-gold">
            <AppIcon name="save" class="h-4 w-4" />
            Update Password
          </button>
        </div>
      </form>
    </div>
  </AdminShell>
</template>

<script>
const ToggleRow = {
  props: {
    modelValue: Boolean,
    title: String,
    description: String,
  },
  emits: ['update:modelValue'],
  template: `
    <label class="toggle-row">
      <span>
        <strong>{{ title }}</strong>
        <small>{{ description }}</small>
      </span>
      <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)">
      <i></i>
    </label>
  `,
}

export default { components: { ToggleRow } }
</script>

<style scoped>
.profile-card {
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 1rem;
  background: white;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgb(15 23 42 / 4%);
  transition: border-color 0.2s ease;
}

.profile-card:hover {
  border-color: rgb(201 168 62 / 30%);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.profile-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 1.5rem;
}

.avatar-large {
  display: grid;
  width: 6.25rem;
  height: 6.25rem;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  border: 4px solid white;
  border-radius: 999px;
  background: linear-gradient(135deg, #003366, #c9a83e);
  color: white;
  box-shadow: 0 4px 20px rgb(15 23 42 / 12%);
  font-size: 2.25rem;
  font-weight: 700;
}

.avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h2 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

h3 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 700;
}

.meta-row,
.supporting-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.875rem;
}

.supporting-row {
  gap: 0.85rem;
  margin-top: 0.75rem;
}

.supporting-row span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.supporting-row svg {
  color: #c9a83e;
}

.dot {
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 999px;
  background: #d1d5db;
}

.role-pill,
.active-pill {
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.role-pill {
  background: rgb(0 51 102 / 10%);
  color: #003366;
}

.active-pill {
  background: #dcfce7;
  color: #15803d;
}

.profile-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
}

.btn-gold,
.edit-button,
.icon-button,
.cancel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: 0.2s ease;
}

.btn-gold {
  background: #c9a83e;
  color: white;
}

.btn-gold:hover {
  background: #b8942e;
  box-shadow: 0 4px 12px rgb(201 168 62 / 30%);
  transform: translateY(-1px);
}

.edit-button {
  background: #003366;
  color: white;
}

.edit-button:hover {
  background: #002244;
}

.icon-button,
.cancel-button {
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.icon-button {
  width: 2.6rem;
  padding-inline: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  border: 1px solid #f1f5f9;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 1rem;
  text-align: center;
}

.stat-item strong {
  display: block;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-item span {
  color: #64748b;
  font-size: 0.75rem;
}

.profile-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1.5px solid transparent;
  border-radius: 0.75rem;
  padding: 0.55rem 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 700;
}

.nav-tab:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.nav-tab.active {
  border-color: #c9a83e;
  background: rgb(201 168 62 / 10%);
  color: #c9a83e;
}

.section-stack {
  display: grid;
  gap: 1rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.form-grid label,
.modal-content label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 700;
}

.form-grid input,
.form-grid select,
.modal-content input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.7rem 0.9rem;
  color: #334155;
  font-weight: 500;
  outline: none;
}

.form-grid input:focus,
.form-grid select:focus,
.modal-content input:focus {
  border-color: transparent;
  box-shadow: 0 0 0 3px rgb(201 168 62 / 35%);
}

.setting-list {
  display: grid;
  gap: 0.75rem;
}

:deep(.toggle-row) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
}

:deep(.toggle-row strong),
:deep(.toggle-row small) {
  display: block;
}

:deep(.toggle-row strong) {
  color: #374151;
  font-size: 0.875rem;
}

:deep(.toggle-row small) {
  margin-top: 0.2rem;
  color: #94a3b8;
  font-size: 0.75rem;
}

:deep(.toggle-row input) {
  position: absolute;
  opacity: 0;
}

:deep(.toggle-row i) {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #cbd5e1;
  transition: 0.2s ease;
}

:deep(.toggle-row i::before) {
  position: absolute;
  bottom: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 1px 3px rgb(15 23 42 / 18%);
  content: '';
  transition: 0.2s ease;
}

:deep(.toggle-row input:checked + i) {
  background: #c9a83e;
}

:deep(.toggle-row input:checked + i::before) {
  transform: translateX(22px);
}

.theme-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.theme-group button {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
  padding: 0.65rem 1rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 700;
}

.theme-group button.active {
  border-color: #003366;
  background: #003366;
  color: white;
}

.login-list {
  display: grid;
  gap: 0.5rem;
}

.login-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #f1f5f9;
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.login-list strong,
.login-list small {
  display: block;
}

.login-list strong {
  color: #374151;
  font-size: 0.875rem;
}

.login-list small,
.login-list time {
  color: #94a3b8;
  font-size: 0.75rem;
}

.login-list em {
  flex-shrink: 0;
  color: #16a34a;
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 700;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-heading button {
  color: #003366;
  font-size: 0.875rem;
  font-weight: 700;
}

.activity-list {
  display: grid;
}

.activity-item {
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  padding: 0.75rem 0;
}

.activity-item:last-child {
  border-bottom: 0;
}

.activity-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
}

.activity-item p {
  color: #374151;
  font-size: 0.875rem;
}

.activity-item time {
  color: #94a3b8;
  font-size: 0.75rem;
}

.tone-blue {
  background: #dbeafe;
  color: #2563eb;
}

.tone-green {
  background: #dcfce7;
  color: #16a34a;
}

.tone-indigo {
  background: #e0e7ff;
  color: #4f46e5;
}

.tone-amber {
  background: #fef3c7;
  color: #d97706;
}

.tone-emerald {
  background: #d1fae5;
  color: #059669;
}

.tone-rose {
  background: #ffe4e6;
  color: #e11d48;
}

.profile-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  border-top: 1px solid rgb(226 232 240 / 70%);
  padding-top: 1rem;
  color: #cbd5e1;
  font-size: 0.7rem;
}

.profile-footer span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.feedback {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 60;
  border-radius: 0.75rem;
  background: #003366;
  padding: 0.75rem 1rem;
  color: white;
  box-shadow: 0 10px 25px rgb(15 23 42 / 18%);
  font-size: 0.8rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 55%);
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  display: grid;
  width: min(100%, 500px);
  gap: 1rem;
  border-radius: 1.25rem;
  background: white;
  padding: 1.5rem;
  box-shadow: 0 25px 50px -12px rgb(15 23 42 / 30%);
}

.modal-header,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.modal-header h3 {
  margin: 0;
}

.modal-header button {
  color: #94a3b8;
  font-size: 1.5rem;
}

.password-note {
  border: 1px solid #bfdbfe;
  border-radius: 0.75rem;
  background: #eff6ff;
  padding: 0.75rem;
  color: #475569;
  font-size: 0.75rem;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {

  .profile-header,
  .profile-identity {
    align-items: center;
    flex-direction: column;
  }

  .profile-actions,
  .profile-footer {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .avatar-large {
    width: 5rem;
    height: 5rem;
    font-size: 1.8rem;
  }
}
</style>
