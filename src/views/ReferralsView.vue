<script setup>
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import AppIcon from '../components/AppIcon.vue'
import { request } from '../lib/api'

const route = useRoute()
const router = useRouter()
const isSidebarOpen = ref(false)
const isModalOpen = ref(false)
const isDetailsModalOpen = ref(false)
const isMemoPreviewOpen = ref(false)
const isExistingMemoDialogOpen = ref(false)
const editingReferralId = ref(null)
const isServiceModalOpen = ref(false)
const editingServiceId = ref(null)
const currentStep = ref(1)
const searchQuery = ref('')
const statusFilter = ref('All Status')
const sortOrder = ref('newest')
const formError = ref('')
const pageError = ref('')
const loading = ref(false)
const submitting = ref(false)
const detailsLoading = ref(false)
const detailsError = ref('')
const isGeneratingPDF = ref(false)
const isFinalizing = ref(false)
const savingService = ref(false)
const serviceError = ref('')

const referrals = ref([])
const selectedReferral = ref(null)
const memoDocument = ref(null)
const programs = ref([])
const caseCategories = ref([])
const partyRoles = ref([
  { id: 1, name: 'Client' },
  { id: 2, name: 'Requester' },
  { id: 3, name: 'Representative' },
  { id: 4, name: 'Beneficiary' },
])
const educationalAttainments = ref([
  { id: 1, name: 'Elementary' },
  { id: 2, name: 'High School' },
  { id: 3, name: 'Senior High School' },
  { id: 4, name: 'Vocational' },
  { id: 5, name: 'College' },
  { id: 6, name: 'Post Graduate' },
])
const ipMemberships = ref([
  { id: 1, name: 'Not Applicable' },
  { id: 2, name: 'Indigenous Cultural Community' },
  { id: 3, name: 'Indigenous Peoples Group' },
])
const signatories = ref([])
const selectedFiles = ref([])

const emptyClient = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  ext_name: '',
  sex: '',
  birth_date: '',
  civil_status: '',
  email: '',
  phone_number: '',
  educational_attainment: '',
  religion: '',
  country: 'PHILIPPINES',
  solo_parent: '',
  pwd: '',
  ip_membership: '',
})
const emptyAddress = () => ({
  region: '',
  province: '',
  city: '',
  barangay: '',
  street: '',
})
const emptyParty = () => ({
  role_id: '',
  client: emptyClient(),
  address: emptyAddress(),
})
const emptyReferral = () => ({
  drn: '',
  program_id: '',
  case_category: '',
  case_sub_category: '',
  mode: '',
  received_date: '',
  acted_date: '',
  referred_to: '',
  memo_to_id: '',
  memo_from_id: '',
  memo_subject: '',
  memo_case_concern: '',
  memo_remarks: '',
})
const form = reactive({
  parties: [emptyParty()],
  referral: emptyReferral(),
})
const serviceForm = reactive({
  service_name: '',
  program_id: '',
  amount: '',
  notes: '',
})

const steps = ['Profiles', 'Referral Details', 'Memorandum', 'Attachments']
const isEditingReferral = computed(() => Boolean(editingReferralId.value))
const isFinalizedReferral = computed(() => selectedReferral.value?.status === 'APPROVED')
const extensionOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']
const sexOptions = ['Female', 'Male']
const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated']
const modeOptions = ['Walk-in', 'Email', 'Mail', 'Others']
const editor = ClassicEditor
const editorConfig = {
  licenseKey: 'GPL',
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'link',
    'bulletedList',
    'numberedList',
    '|',
    'outdent',
    'indent',
    '|',
    'blockQuote',
    'undo',
    'redo',
  ],
}

const recipientSignatories = computed(() => signatories.value.filter((signatory) => signatory.is_recipient))
const originatorSignatories = computed(() => signatories.value.filter((signatory) => signatory.is_originator))
const subcategories = computed(() => {
  const category = caseCategories.value.find((item) => item.name === form.referral.case_category)
  return category?.subcategories || []
})
const memoAttachments = computed(() => selectedReferral.value?.attachments?.filter((file) => file.file_name?.startsWith('MEMO_')) || [])
const otherAttachments = computed(() => selectedReferral.value?.attachments?.filter((file) => !file.file_name?.startsWith('MEMO_')) || [])
const referringParties = computed(() => selectedReferral.value?.parties?.filter((party) => party.role?.name?.toLowerCase().includes('referring')) || [])
const referredClients = computed(() => {
  const parties = selectedReferral.value?.parties || []
  const referred = parties.filter((party) => party.role?.name?.toLowerCase().includes('referred') || party.role?.name?.toLowerCase().includes('client'))
  return referred.length ? referred : parties
})
const filteredReferrals = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const filtered = referrals.value.filter((referral) => {
    const clientName = firstClientName(referral)
    const type = referral.program?.name || referral.case_category || ''
    const matchesQuery = !query || [referral.drn, clientName, type].some((value) => String(value || '').toLowerCase().includes(query))
    const matchesStatus = statusFilter.value === 'All Status' || referral.status === statusFilter.value
    return matchesQuery && matchesStatus
  })

  return [...filtered].sort((a, b) => {
    const aDate = a.received_date || a.created_at || ''
    const bDate = b.received_date || b.created_at || ''
    return sortOrder.value === 'oldest' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate)
  })
})

const statusClass = (status) => `status-${String(status || '').toLowerCase().replaceAll(' ', '-')}`
const firstClientName = (referral) => {
  const client = referral.parties?.[0]?.client
  return client ? [client.first_name, client.middle_name, client.last_name, client.ext_name].filter(Boolean).join(' ') : 'No client'
}
const fullName = (client) => client ? [client.first_name, client.middle_name, client.last_name, client.ext_name].filter(Boolean).join(' ') : 'N/A'
const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
const inputDate = (value) => value ? String(value).slice(0, 10) : ''
const firstAddress = (party) => party?.client?.addresses?.[0] || null
const formatAddress = (address) => {
  if (!address) return 'No address information recorded.'
  return [address.street, address.barangay, address.city, address.province, address.region].filter(Boolean).join(', ') || 'No address information recorded.'
}
const addressForMemo = (party) => {
  const address = firstAddress(party)
  if (!address) return ''
  return [address.street, address.barangay, address.city, address.province].filter(Boolean).join(', ')
}
const sanitizeHtml = (html, fallback = 'N/A') => {
  if (!html) return fallback
  const document = new DOMParser().parseFromString(String(html), 'text/html')
  document.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((element) => element.remove())
  document.body.querySelectorAll('*').forEach((element) => {
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name)
      }
    }
  })
  return document.body.innerHTML || fallback
}
const parsePayload = async (response) => response.json().catch(() => ({}))
const nullable = (value) => value === '' ? null : value
const currency = (value) => Number(value || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
const encoderName = (encoder) => encoder ? [encoder.first_name, encoder.middle_name, encoder.last_name, encoder.extension_name].filter(Boolean).join(' ') : '---'
const syncReferral = (referral) => {
  selectedReferral.value = referral
  const index = referrals.value.findIndex((item) => item.id === referral.id)
  if (index >= 0) referrals.value.splice(index, 1, referral)
}

async function loadReferences() {
  try {
    const response = await request('/auth/referrals/references')
    const payload = await parsePayload(response)
    if (!response.ok) {
      pageError.value = payload.message || 'Unable to load referral references.'
    } else {
      programs.value = payload.programs || []
      caseCategories.value = payload.case_categories || []
      if (payload.party_roles?.length) partyRoles.value = payload.party_roles
      if (payload.educational_attainments?.length) educationalAttainments.value = payload.educational_attainments
      if (payload.ip_memberships?.length) ipMemberships.value = payload.ip_memberships
      signatories.value = payload.signatories || []
    }
  } catch {
    pageError.value = 'Unable to load referral references.'
  }

  if (!programs.value.length || !caseCategories.value.length || !signatories.value.length) {
    await loadLibraryFallbacks()
  }
}

async function loadLibraryFallbacks() {
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

    if (programResponse.ok && programPayload.programs?.length) {
      programs.value = programPayload.programs
    }
    if (categoryResponse.ok && categoryPayload.case_categories?.length) {
      caseCategories.value = categoryPayload.case_categories
    }
    if (signatoryResponse.ok && signatoryPayload.signatories?.length) {
      signatories.value = signatoryPayload.signatories
    }
  } catch {
    // The primary references endpoint already set the visible error.
  }
}

async function loadReferrals() {
  loading.value = true
  pageError.value = ''
  try {
    const response = await request('/auth/referrals')
    const payload = await parsePayload(response)
    if (!response.ok) {
      pageError.value = payload.message || 'Unable to load referrals.'
      return
    }
    referrals.value = payload.referrals || []
  } catch {
    pageError.value = 'Unable to load referrals right now.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  currentStep.value = 1
  formError.value = ''
  selectedFiles.value = []
  editingReferralId.value = null
  form.parties = [emptyParty()]
  Object.assign(form.referral, emptyReferral())
}
const openModal = () => {
  resetForm()
  isModalOpen.value = true
}
const populateFormFromReferral = (referral) => {
  form.parties = (referral.parties?.length ? referral.parties : []).map((party) => {
    const address = firstAddress(party) || party.address || {}
    return {
      id: party.id,
      role_id: party.role_id || party.role?.id || '',
      client: {
        first_name: party.client?.first_name || '',
        middle_name: party.client?.middle_name || '',
        last_name: party.client?.last_name || '',
        ext_name: party.client?.ext_name || '',
        sex: party.client?.sex || '',
        birth_date: inputDate(party.client?.birth_date),
        civil_status: party.client?.civil_status || '',
        email: party.client?.email || '',
        phone_number: party.client?.phone_number || '',
        educational_attainment: party.client?.educational_attainment || '',
        religion: party.client?.religion || '',
        country: party.client?.country || 'PHILIPPINES',
        solo_parent: party.client?.solo_parent || '',
        pwd: party.client?.pwd || '',
        ip_membership: party.client?.ip_membership || '',
      },
      address: {
        id: address.id,
        region: address.region || '',
        province: address.province || '',
        city: address.city || '',
        barangay: address.barangay || '',
        street: address.street || '',
      },
    }
  })
  if (!form.parties.length) form.parties = [emptyParty()]

  Object.assign(form.referral, {
    drn: referral.drn || '',
    program_id: referral.program_id || referral.program?.id || '',
    case_category: referral.case_category || '',
    case_sub_category: referral.case_sub_category || '',
    mode: referral.mode || '',
    received_date: inputDate(referral.received_date),
    acted_date: inputDate(referral.acted_date),
    referred_to: referral.referred_to || '',
    memo_to_id: referral.memo_to_id || referral.memo_to?.id || '',
    memo_from_id: referral.memo_from_id || referral.memo_from?.id || '',
    memo_subject: referral.memo_subject || '',
    memo_case_concern: referral.memo_case_concern || '',
    memo_remarks: referral.memo_remarks || '',
  })
}
const openEditModal = () => {
  if (!selectedReferral.value) return
  formError.value = ''
  selectedFiles.value = []
  currentStep.value = 1
  editingReferralId.value = selectedReferral.value.id
  populateFormFromReferral(selectedReferral.value)
  isMemoPreviewOpen.value = false
  isExistingMemoDialogOpen.value = false
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
  resetForm()
  router.replace({ query: {} })
}
const openDetailsModal = async (referral) => {
  isDetailsModalOpen.value = true
  selectedReferral.value = referral
  detailsLoading.value = true
  detailsError.value = ''

  try {
    const response = await request(`/auth/referrals/${referral.id}`)
    const payload = await parsePayload(response)
    if (!response.ok) {
      detailsError.value = payload.message || 'Unable to load referral details.'
      return
    }
    selectedReferral.value = payload.referral
  } catch {
    detailsError.value = 'Unable to load referral details right now.'
  } finally {
    detailsLoading.value = false
  }
}
const closeDetailsModal = () => {
  isDetailsModalOpen.value = false
  isMemoPreviewOpen.value = false
  isExistingMemoDialogOpen.value = false
  isServiceModalOpen.value = false
  selectedReferral.value = null
  detailsError.value = ''
  serviceError.value = ''
}
const finalizeReferral = async () => {
  if (!selectedReferral.value?.id || isFinalizing.value) return
  if (!window.confirm('Finalize this referral? This will update the status to APPROVED and enable Provided Services.')) return

  isFinalizing.value = true
  detailsError.value = ''
  try {
    const response = await request(`/auth/referrals/${selectedReferral.value.id}/finalize`, { method: 'POST' })
    const payload = await parsePayload(response)
    if (!response.ok) {
      detailsError.value = payload.message || 'Unable to finalize referral.'
      return
    }
    syncReferral(payload.referral)
  } catch {
    detailsError.value = 'Unable to finalize referral right now.'
  } finally {
    isFinalizing.value = false
  }
}
const resetServiceForm = () => {
  editingServiceId.value = null
  serviceError.value = ''
  Object.assign(serviceForm, {
    service_name: '',
    program_id: '',
    amount: '',
    notes: '',
  })
}
const openServiceModal = (service = null) => {
  if (!isFinalizedReferral.value) return
  resetServiceForm()
  if (service) {
    editingServiceId.value = service.id
    Object.assign(serviceForm, {
      service_name: service.service_name || '',
      program_id: service.program_id || '',
      amount: service.amount ?? '',
      notes: service.notes || '',
    })
  }
  isServiceModalOpen.value = true
}
const closeServiceModal = () => {
  isServiceModalOpen.value = false
  resetServiceForm()
}
const saveService = async () => {
  if (!selectedReferral.value?.id) return
  if (!serviceForm.service_name.trim() || !serviceForm.program_id) {
    serviceError.value = 'Service name and providing program are required.'
    return
  }

  savingService.value = true
  serviceError.value = ''
  try {
    const body = JSON.stringify({
      service_name: serviceForm.service_name.trim(),
      program_id: Number(serviceForm.program_id),
      amount: serviceForm.amount === '' ? null : Number(serviceForm.amount),
      notes: nullable(serviceForm.notes.trim()),
    })
    const endpoint = editingServiceId.value
      ? `/auth/referrals/services/${editingServiceId.value}`
      : `/auth/referrals/${selectedReferral.value.id}/services`
    const response = await request(endpoint, {
      method: editingServiceId.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const payload = await parsePayload(response)
    if (!response.ok) {
      serviceError.value = payload.message || 'Unable to save provided service.'
      return
    }
    syncReferral(payload.referral)
    closeServiceModal()
  } catch {
    serviceError.value = 'Unable to save provided service right now.'
  } finally {
    savingService.value = false
  }
}
const deleteService = async (service) => {
  if (!service?.id || !window.confirm('Delete this provided service?')) return

  serviceError.value = ''
  try {
    const response = await request(`/auth/referrals/services/${service.id}`, { method: 'DELETE' })
    const payload = await parsePayload(response)
    if (!response.ok) {
      serviceError.value = payload.message || 'Unable to delete provided service.'
      return
    }
    syncReferral(payload.referral)
  } catch {
    serviceError.value = 'Unable to delete provided service right now.'
  }
}
const openMemoPreview = () => {
  isMemoPreviewOpen.value = true
}
const openPdf = (file) => {
  if (!file?.file_url) return
  window.open(file.file_url, '_blank', 'noopener,noreferrer')
}
const generateMemoPdf = async () => {
  if (!selectedReferral.value?.id) return

  const existingMemo = memoAttachments.value[0]
  if (existingMemo) {
    isExistingMemoDialogOpen.value = true
    return
  }

  await generateNewMemoPdf()
}
const viewExistingMemoPdf = () => {
  const existingMemo = memoAttachments.value[0]
  if (existingMemo) openPdf(existingMemo)
  isExistingMemoDialogOpen.value = false
}
const generateNewMemoPdf = async () => {
  if (!selectedReferral.value?.id) return

  isExistingMemoDialogOpen.value = false
  isGeneratingPDF.value = true
  isMemoPreviewOpen.value = true

  try {
    await nextTick()
    const element = memoDocument.value
    if (!element) throw new Error('Memo template is not ready.')

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imageWidth = pageWidth
    const imageHeight = (canvas.height * imageWidth) / canvas.width
    const imageData = canvas.toDataURL('image/png')
    let heightLeft = imageHeight
    let position = 0

    pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight)
      heightLeft -= pageHeight
    }

    const blob = pdf.output('blob')
    const filename = `MEMO_${String(selectedReferral.value.drn || selectedReferral.value.id).replace(/[^\w-]+/g, '_')}_${Date.now()}.pdf`
    const file = new File([blob], filename, { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('memo', file, filename)

    const response = await request(`/auth/referrals/${selectedReferral.value.id}/memo`, {
      method: 'POST',
      body: formData,
    })
    const payload = await parsePayload(response)
    if (!response.ok) {
      throw new Error(payload.message || 'Unable to save generated memo.')
    }

    selectedReferral.value = payload.referral
    const latestMemo = selectedReferral.value.attachments?.find((attachment) => attachment.file_name?.startsWith('MEMO_'))
    if (latestMemo) openPdf(latestMemo)
  } catch (error) {
    detailsError.value = error.message || 'Unable to generate memorandum PDF.'
  } finally {
    isGeneratingPDF.value = false
  }
}
const addParty = () => {
  form.parties.push(emptyParty())
}
const removeParty = (index) => {
  if (form.parties.length > 1) form.parties.splice(index, 1)
}
const validateStep = (step) => {
  if (step === 1) {
    return form.parties.every((party) =>
      party.role_id &&
      party.client.first_name.trim() &&
      party.client.last_name.trim() &&
      party.client.sex &&
      party.client.birth_date &&
      party.address.region.trim() &&
      party.address.province.trim() &&
      party.address.city.trim() &&
      party.address.barangay.trim(),
    )
  }
  if (step === 2) return form.referral.drn.trim() && form.referral.program_id
  return true
}
const nextStep = () => {
  if (!validateStep(currentStep.value)) {
    formError.value = 'Please complete all fields marked with an asterisk (*).'
    return
  }
  formError.value = ''
  currentStep.value += 1
}
const handleFiles = (event) => {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    if (file.type !== 'application/pdf') {
      formError.value = `File "${file.name}" is not a PDF.`
      continue
    }
    if (file.size > 25 * 1024 * 1024) {
      formError.value = `File "${file.name}" exceeds the 25MB limit.`
      continue
    }
    if (selectedFiles.value.length >= 5) {
      formError.value = 'Maximum of 5 PDF attachments allowed.'
      break
    }
    selectedFiles.value.push(file)
  }
  event.target.value = ''
}
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}
const submitReferral = async () => {
  if (!validateStep(1) || !validateStep(2)) {
    formError.value = 'Please complete all fields marked with an asterisk (*).'
    currentStep.value = !validateStep(1) ? 1 : 2
    return
  }

  submitting.value = true
  formError.value = ''

  try {
    const formData = new FormData()
    const parties = form.parties.map((party) => ({
      id: party.id,
      role_id: Number(party.role_id),
      client: {
        ...party.client,
        ext_name: nullable(party.client.ext_name),
        middle_name: nullable(party.client.middle_name),
        civil_status: nullable(party.client.civil_status),
        email: nullable(party.client.email),
        phone_number: nullable(party.client.phone_number),
        educational_attainment: nullable(party.client.educational_attainment),
        religion: nullable(party.client.religion),
        solo_parent: nullable(party.client.solo_parent),
        pwd: nullable(party.client.pwd),
        ip_membership: nullable(party.client.ip_membership),
      },
      address: {
        ...party.address,
        id: party.address.id,
        street: nullable(party.address.street),
      },
    }))
    const referral = {
      ...form.referral,
      program_id: Number(form.referral.program_id),
      memo_to_id: form.referral.memo_to_id ? Number(form.referral.memo_to_id) : null,
      memo_from_id: form.referral.memo_from_id ? Number(form.referral.memo_from_id) : null,
      case_category: nullable(form.referral.case_category),
      case_sub_category: nullable(form.referral.case_sub_category),
      mode: nullable(form.referral.mode),
      received_date: nullable(form.referral.received_date),
      acted_date: nullable(form.referral.acted_date),
      referred_to: nullable(form.referral.referred_to),
      memo_subject: nullable(form.referral.memo_subject),
      memo_case_concern: nullable(form.referral.memo_case_concern),
      memo_remarks: nullable(form.referral.memo_remarks),
    }

    formData.append('parties', JSON.stringify(parties))
    formData.append('referral', JSON.stringify(referral))
    selectedFiles.value.forEach((file) => formData.append('attachments[]', file, file.name))

    const endpoint = isEditingReferral.value ? `/auth/referrals/${editingReferralId.value}/comprehensive` : '/auth/referrals/comprehensive'
    const response = await request(endpoint, {
      method: 'POST',
      body: formData,
    })
    const payload = await parsePayload(response)
    if (!response.ok) {
      formError.value = payload.message || `Unable to ${isEditingReferral.value ? 'update' : 'create'} referral.`
      return
    }
    if (isEditingReferral.value) {
      const index = referrals.value.findIndex((item) => item.id === payload.referral.id)
      if (index >= 0) referrals.value.splice(index, 1, payload.referral)
      selectedReferral.value = payload.referral
      isDetailsModalOpen.value = true
    } else {
      referrals.value.unshift(payload.referral)
    }
    closeModal()
  } catch {
    formError.value = `Unable to ${isEditingReferral.value ? 'update' : 'create'} referral right now.`
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadReferences(), loadReferrals()])
  if (route.query.create === '1') openModal()
})
</script>

<template>
  <div class="page-shell">
    <AppSidebar v-model:open="isSidebarOpen" active-route="referrals" />
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <div class="flex min-w-0 items-center gap-3">
          <button class="menu-button md:hidden" type="button" aria-label="Open menu" @click="isSidebarOpen = true">
            <AppIcon name="menu" class="h-5 w-5" />
          </button>
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-gray-800">Referrals</h1>
            <p class="text-sm text-gray-400">Manage and track all referral cases</p>
          </div>
        </div>
        <button class="primary-button" type="button" @click="openModal">
          <AppIcon name="plus" class="h-4 w-4" /><span class="hidden sm:inline">New Referral</span>
        </button>
      </header>

      <main class="scrollable flex-1 overflow-y-auto bg-[#f0f4f8] p-4 sm:p-5 lg:p-6">
        <p v-if="pageError" class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ pageError }}</p>
        <section class="filter-card" aria-label="Referral filters">
          <label class="search-input">
            <AppIcon name="search" class="h-4 w-4 text-gray-400" /><input v-model="searchQuery" type="search"
              placeholder="Search by name, DRN, or case...">
          </label>
          <div class="flex flex-wrap gap-2">
            <select v-model="statusFilter" class="control">
              <option>All Status</option>
              <option>PENDING</option>
              <option>APPROVED</option>
              <option>ARCHIVED</option>
            </select>
            <select v-model="sortOrder" class="control">
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </section>

        <section class="table-card">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[650px]">
              <thead>
                <tr>
                  <th>DRN</th>
                  <th>Client Name</th>
                  <th>Program</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="6" class="py-10 text-center text-gray-400">Loading referrals...</td>
                </tr>
                <tr v-for="referral in filteredReferrals" :key="referral.id">
                  <td class="font-medium text-[#003366]">{{ referral.drn }}</td>
                  <td>{{ firstClientName(referral) }}</td>
                  <td class="text-gray-500">{{ referral.program?.name || '—' }}</td>
                  <td class="text-gray-400">{{ referral.received_date || referral.created_at?.slice(0, 10) }}</td>
                  <td><span class="status" :class="statusClass(referral.status)">{{ referral.status }}</span></td>
                  <td class="text-right"><button class="font-medium text-blue-600 hover:text-blue-800" type="button" @click="openDetailsModal(referral)">View</button></td>
                </tr>
                <tr v-if="!loading && !filteredReferrals.length">
                  <td colspan="6" class="py-10 text-center text-gray-400">No referrals found.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><span>Showing {{ filteredReferrals.length }} of {{ referrals.length }} referrals</span></div>
        </section>
      </main>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" :class="{ 'edit-modal-overlay': isEditingReferral }" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="modal-title" class="text-lg font-semibold text-gray-800">{{ isEditingReferral ? 'Edit Referral' : 'Create New Referral' }}</h2>
            <p class="text-xs text-gray-400">Step {{ currentStep }} of 4 · {{ steps[currentStep - 1] }}</p>
          </div>
          <button type="button" class="text-2xl text-gray-400" aria-label="Close" @click="closeModal">&times;</button>
        </div>
        <div class="stepper">
          <template v-for="step in 4" :key="step">
            <span class="step" :class="{ active: step === currentStep, completed: step < currentStep }">{{ step < currentStep ? '✓' : step }}</span>
            <span v-if="step < 4" class="step-line" :class="{ completed: step < currentStep }"></span>
          </template>
        </div>

        <form class="px-5 pb-5 sm:px-6 sm:pb-6" @submit.prevent="submitReferral">
          <div v-if="currentStep === 1" class="space-y-4">
            <section v-for="(party, index) in form.parties" :key="index" class="party-card">
              <div class="party-header">
                <h3>Profile #{{ index + 1 }}</h3>
                <button v-if="form.parties.length > 1" type="button" class="danger-button" @click="removeParty(index)">Remove</button>
              </div>
              <div class="form-grid">
                <label class="sm:col-span-2">Role in Referral *<select v-model="party.role_id">
                    <option value="" disabled>Select role</option>
                    <option v-for="role in partyRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
                  </select></label>
                <label>First Name *<input v-model="party.client.first_name" type="text"></label>
                <label>Middle Name<input v-model="party.client.middle_name" type="text"></label>
                <label>Last Name *<input v-model="party.client.last_name" type="text"></label>
                <label>Extension Name<select v-model="party.client.ext_name">
                    <option v-for="option in extensionOptions" :key="option" :value="option">{{ option || 'None' }}
                    </option>
                  </select></label>
                <label>Biological Sex *<select v-model="party.client.sex">
                    <option value="" disabled>Select sex</option>
                    <option v-for="option in sexOptions" :key="option">{{ option }}</option>
                  </select></label>
                <label>Birth Date *<input v-model="party.client.birth_date" type="date"></label>
                <label>Civil Status<select v-model="party.client.civil_status">
                    <option value="">Select status</option>
                    <option v-for="option in civilStatusOptions" :key="option">{{ option }}</option>
                  </select></label>
                <label>Email<input v-model="party.client.email" type="email"></label>
                <label>Phone Number<input v-model="party.client.phone_number" type="tel"></label>
                <label>Educational Attainment<select v-model="party.client.educational_attainment">
                    <option value="">Select attainment</option>
                    <option v-for="item in educationalAttainments" :key="item.id" :value="item.name">{{ item.name }}
                    </option>
                  </select></label>
                <label>IP Membership<select v-model="party.client.ip_membership">
                    <option value="">Select membership</option>
                    <option v-for="item in ipMemberships" :key="item.id" :value="item.name">{{ item.name }}</option>
                  </select></label>
                <label>Religion<input v-model="party.client.religion" type="text"></label>
                <label>Solo Parent ID<input v-model="party.client.solo_parent" type="text"></label>
                <label>PWD ID<input v-model="party.client.pwd" type="text"></label>
                <label>Region *<input v-model="party.address.region" type="text"></label>
                <label>Province *<input v-model="party.address.province" type="text"></label>
                <label>City/Municipality *<input v-model="party.address.city" type="text"></label>
                <label>Barangay *<input v-model="party.address.barangay" type="text"></label>
                <label class="sm:col-span-2">Street / House No.<input v-model="party.address.street"
                    type="text"></label>
              </div>
            </section>
            <button type="button" class="secondary-button" @click="addParty">Add Another Profile</button>
          </div>

          <div v-else-if="currentStep === 2" class="form-grid">
            <label>DRN *<input v-model="form.referral.drn" type="text"></label>
            <label>Program *<select v-model="form.referral.program_id"><option value="" disabled>Select program</option><option v-for="program in programs" :key="program.id" :value="program.id">{{ program.name }}</option></select></label>
            <label>Case Category<select v-model="form.referral.case_category" @change="form.referral.case_sub_category = ''"><option value="">Select category</option><option v-for="category in caseCategories" :key="category.id" :value="category.name">{{ category.name }}</option></select></label>
            <label>Case Sub-Category<select v-model="form.referral.case_sub_category"><option value="">Select subcategory</option><option v-for="subcategory in subcategories" :key="subcategory.id" :value="subcategory.name">{{ subcategory.name }}</option></select></label>
            <label>Mode of Referral<select v-model="form.referral.mode"><option value="">Select mode</option><option v-for="option in modeOptions" :key="option">{{ option }}</option></select></label>
            <label>Received Date<input v-model="form.referral.received_date" type="date"></label>
            <label>Acted Date<input v-model="form.referral.acted_date" type="date"></label>
            <label>Referred To<input v-model="form.referral.referred_to" type="text"></label>
          </div>

          <div v-else-if="currentStep === 3" class="form-grid">
            <label>FOR / TO<select v-model="form.referral.memo_to_id"><option value="">Select recipient</option><option v-for="signatory in recipientSignatories" :key="signatory.id" :value="signatory.id">{{ signatory.name }} ({{ signatory.position }})</option></select></label>
            <label>FROM<select v-model="form.referral.memo_from_id"><option value="">Select originator</option><option v-for="signatory in originatorSignatories" :key="signatory.id" :value="signatory.id">{{ signatory.name }} ({{ signatory.position }})</option></select></label>
            <label class="sm:col-span-2">Subject<input v-model="form.referral.memo_subject" type="text"></label>
            <div class="sm:col-span-2 rich-editor-field">
              <span class="field-label">Case / Concern</span>
              <Ckeditor v-model="form.referral.memo_case_concern" :editor="editor" :config="editorConfig" />
            </div>
            <label class="sm:col-span-2">Remarks<textarea v-model="form.referral.memo_remarks" rows="3"></textarea></label>
          </div>

          <div v-else class="form-grid">
            <label class="sm:col-span-2">Upload PDF Attachments<input type="file" multiple accept="application/pdf" @change="handleFiles"></label>
            <div v-if="selectedFiles.length" class="file-list sm:col-span-2">
              <div v-for="(file, index) in selectedFiles" :key="`${file.name}-${index}`">
                <span>{{ file.name }} · {{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
                <button type="button" @click="removeFile(index)">Remove</button>
              </div>
            </div>
          </div>

          <p v-if="formError" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ formError }}</p>
          <div class="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <button v-if="currentStep > 1" type="button" class="secondary-button" @click="currentStep--; formError = ''">Previous</button><span v-else></span>
            <div class="flex gap-2">
              <button type="button" class="secondary-button" @click="closeModal">Cancel</button>
              <button v-if="currentStep < 4" type="button" class="primary-button" @click="nextStep">Next</button>
              <button v-else type="submit" class="primary-button" :disabled="submitting">{{ submitting ? (isEditingReferral ? 'Saving...' : 'Submitting...') : (isEditingReferral ? 'Save Changes' : 'Submit Referral') }}</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isDetailsModalOpen" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="details-title" @click.self="closeDetailsModal">
      <div class="modal details-modal">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="details-title" class="text-lg font-semibold text-gray-800">Referral Details</h2>
            <p class="text-xs text-gray-400">{{ selectedReferral?.drn || 'Loading referral...' }}</p>
          </div>
          <div class="details-header-actions">
            <button v-if="selectedReferral && !detailsLoading && !isFinalizedReferral" type="button" class="secondary-button " @click="openEditModal">
              Edit
            </button>
            <button v-if="selectedReferral && !detailsLoading && !isFinalizedReferral" type="button" class="finalize-button" :disabled="isFinalizing" @click="finalizeReferral">
              {{ isFinalizing ? 'Finalizing...' : 'Finalize Referral' }}
            </button>
            <span v-if="isFinalizedReferral" class="finalized-badge">Finalized / Approved</span>
            <button type="button" class="text-2xl text-gray-400" aria-label="Close" @click="closeDetailsModal">&times;</button>
          </div>
        </div>

        <div class="details-body">
          <p v-if="detailsError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ detailsError }}</p>
          <p v-if="detailsLoading" class="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">Loading complete referral details...</p>

          <template v-if="selectedReferral">
            <section class="details-header">
              <div>
                <span class="eyebrow">Document Reference Number</span>
                <strong>{{ selectedReferral.drn }}</strong>
              </div>
              <span class="status" :class="statusClass(selectedReferral.status)">{{ selectedReferral.status }}</span>
            </section>

            <div class="details-layout">
              <div class="details-main">
                <section v-for="(party, index) in selectedReferral.parties || []" :key="party.id || index" class="detail-section">
                  <div class="section-title">
                    <h3>Profile #{{ index + 1 }}</h3>
                    <span>{{ party.role?.name || 'N/A' }}</span>
                  </div>

                  <div class="detail-grid">
                    <div><span>Full Name</span><strong>{{ fullName(party.client) }}</strong></div>
                    <div><span>Biological Sex</span><strong>{{ party.client?.sex || 'N/A' }}</strong></div>
                    <div><span>Birth Date</span><strong>{{ formatDate(party.client?.birth_date) }}</strong></div>
                    <div><span>Civil Status</span><strong>{{ party.client?.civil_status || 'N/A' }}</strong></div>
                    <div><span>Email Address</span><strong>{{ party.client?.email || 'N/A' }}</strong></div>
                    <div><span>Phone Number</span><strong>{{ party.client?.phone_number || 'N/A' }}</strong></div>
                    <div><span>Educational Attainment</span><strong>{{ party.client?.educational_attainment || 'N/A' }}</strong></div>
                    <div><span>Religion</span><strong>{{ party.client?.religion || 'N/A' }}</strong></div>
                    <div><span>Solo Parent ID</span><strong>{{ party.client?.solo_parent || 'N/A' }}</strong></div>
                    <div><span>PWD ID</span><strong>{{ party.client?.pwd || 'N/A' }}</strong></div>
                    <div><span>IP Membership</span><strong>{{ party.client?.ip_membership || 'N/A' }}</strong></div>
                    <div class="wide"><span>Address</span><strong>{{ formatAddress(firstAddress(party)) }}</strong></div>
                  </div>
                </section>

                <section class="detail-section">
                  <div class="section-title">
                    <h3>Memorandum</h3>
                  </div>
                  <div class="detail-grid">
                    <div><span>FOR / TO</span><strong>{{ selectedReferral.memo_to?.name || 'N/A' }}</strong></div>
                    <div><span>FROM</span><strong>{{ selectedReferral.memo_from?.name || 'N/A' }}</strong></div>
                    <div class="wide"><span>Subject</span><strong>{{ selectedReferral.memo_subject || 'N/A' }}</strong></div>
                    <div class="wide"><span>Case / Concern</span><div class="rich-content" v-html="sanitizeHtml(selectedReferral.memo_case_concern, 'No specific concern indicated.')"></div></div>
                    <div class="wide"><span>Remarks</span><div class="rich-content" v-html="sanitizeHtml(selectedReferral.memo_remarks, 'N/A')"></div></div>
                  </div>
                </section>

                <section class="detail-section">
                  <div class="section-title">
                    <h3>Provided Services</h3>
                    <button v-if="isFinalizedReferral" type="button" class="section-action-button" @click="openServiceModal()">
                      Add Service
                    </button>
                  </div>

                  <p v-if="!isFinalizedReferral" class="info-message">Referral must be finalized (APPROVED) before adding or managing services.</p>
                  <p v-if="serviceError && !isServiceModalOpen" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ serviceError }}</p>

                  <div v-if="selectedReferral.services?.length" class="services-table-wrap">
                    <table class="services-table">
                      <thead>
                        <tr>
                          <th>Service Name</th>
                          <th>Program</th>
                          <th>Amount</th>
                          <th>Encoder</th>
                          <th>Notes</th>
                          <th v-if="isFinalizedReferral" class="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="service in selectedReferral.services" :key="service.id">
                          <td class="font-semibold text-gray-800">{{ service.service_name }}</td>
                          <td>{{ service.program?.name || '---' }}</td>
                          <td>{{ service.amount !== null && service.amount !== undefined ? currency(service.amount) : '---' }}</td>
                          <td>{{ encoderName(service.encoder) }}</td>
                          <td>{{ service.notes || '---' }}</td>
                          <td v-if="isFinalizedReferral" class="service-actions">
                            <button type="button" @click="openServiceModal(service)">Edit</button>
                            <button type="button" class="danger-link" @click="deleteService(service)">Delete</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p v-else class="empty-text">No services have been recorded for this referral yet.</p>
                </section>
              </div>

              <aside class="details-side">
                <section class="detail-section">
                  <div class="section-title">
                    <h3>Referral</h3>
                  </div>
                  <div class="side-list">
                    <div><span>Assigned Program</span><strong>{{ selectedReferral.program?.name || 'N/A' }}</strong></div>
                    <div><span>Case Category</span><strong>{{ selectedReferral.case_category || 'N/A' }}</strong></div>
                    <div><span>Case Sub-Category</span><strong>{{ selectedReferral.case_sub_category || 'N/A' }}</strong></div>
                    <div><span>Mode of Referral</span><strong>{{ selectedReferral.mode || 'N/A' }}</strong></div>
                    <div><span>Date Received</span><strong>{{ formatDate(selectedReferral.received_date) }}</strong></div>
                    <div><span>Acted Date</span><strong>{{ formatDate(selectedReferral.acted_date) }}</strong></div>
                    <div><span>Referred To</span><strong>{{ selectedReferral.referred_to || 'N/A' }}</strong></div>
                  </div>
                </section>

                <section class="detail-section">
                  <div class="section-title">
                    <h3>Attachments</h3>
                  </div>
                  <div v-if="otherAttachments.length" class="attachment-list">
                    <a v-for="file in otherAttachments" :key="file.id" :href="file.file_url" target="_blank" rel="noopener noreferrer">
                      <span>{{ file.file_name }}</span>
                      <small>{{ file.uploaded_at ? formatDate(file.uploaded_at) : 'Uploaded file' }}</small>
                    </a>
                  </div>
                  <p v-else class="empty-text">No files attached.</p>
                </section>

                <section class="detail-section">
                  <div class="section-title">
                    <h3>Memorandum</h3>
                  </div>
                  <button type="button" class="memo-action-button" @click="openMemoPreview">
                    View / Manage Memorandum
                  </button>
                  <div class="memo-pdf-block">
                    <span class="eyebrow">Latest Generated PDF</span>
                    <button v-if="memoAttachments[0]" type="button" class="memo-pdf-link" @click="openPdf(memoAttachments[0])">
                      <span>{{ memoAttachments[0].file_name }}</span>
                      <small>{{ memoAttachments[0].uploaded_at ? formatDate(memoAttachments[0].uploaded_at) : 'Generated automatically' }}</small>
                    </button>
                    <p v-else class="empty-text">No PDF has been generated yet.</p>
                  </div>
                </section>
              </aside>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="isMemoPreviewOpen && selectedReferral" class="modal-overlay nested-overlay" role="dialog" aria-modal="true" aria-labelledby="memo-preview-title" @click.self="isMemoPreviewOpen = false">
      <div class="modal memo-preview-modal">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="memo-preview-title" class="text-lg font-semibold text-gray-800">Memorandum Preview</h2>
            <p class="text-xs text-gray-400">{{ selectedReferral.drn }}</p>
          </div>
          <div class="memo-preview-actions">
            <button type="button" class="primary-button" :disabled="isGeneratingPDF" @click="generateMemoPdf">
              {{ isGeneratingPDF ? 'Generating PDF...' : 'View / Generate PDF' }}
            </button>
            <button type="button" class="secondary-button" @click="isMemoPreviewOpen = false">Close</button>
          </div>
        </div>

        <div class="memo-modal-content">
          <div ref="memoDocument" class="memo-content">
            <div class="memo-agency-header">
              <div class="memo-agency-row">
                <div class="memo-logo-wrap">
                  <img class="memo-logo" src="/assets/dswd-with-bp-logo.png" alt="">
                </div>
                <div class="memo-office-title">
                  <h2>Protective Services Bureau</h2>
                  <h3>Operations Group</h3>
                </div>
              </div>
              <div class="memo-drn">DRN: {{ selectedReferral.drn }}</div>
            </div>

            <h1 class="memo-heading">Memorandum</h1>

            <div class="memo-meta">
              <div class="memo-meta-row">
                <span>FOR</span>
                <span>:</span>
                <div>
                  <strong>{{ selectedReferral.memo_to?.name || '---' }}</strong>
                  <em>{{ selectedReferral.memo_to?.position || '---' }}</em>
                  <small>{{ selectedReferral.memo_to?.office || '---' }}</small>
                </div>
              </div>
              <div class="memo-meta-row">
                <span>FROM</span>
                <span>:</span>
                <div>
                  <strong>The {{ selectedReferral.memo_from?.position || '---' }}</strong>
                  <small>{{ selectedReferral.memo_from?.office || '---' }}</small>
                </div>
              </div>
              <div class="memo-meta-row">
                <span>SUBJECT</span>
                <span>:</span>
                <strong>{{ selectedReferral.memo_subject || 'REFERRAL CASE' }}</strong>
              </div>
              <div class="memo-meta-row">
                <span>DATE</span>
                <span>:</span>
                <span>{{ formatDate(new Date().toISOString()) }}</span>
              </div>
            </div>

            <div class="memo-body">
              <p class="memo-intro">This is to respectfully refer to the Field Office (FO) the above-mentioned subject for assessment, validation and provision of necessary assistance, in accordance with applicable guidelines of the Department.</p>

              <table class="memo-table">
                <tbody>
                  <tr>
                    <td class="memo-label-cell">Program</td>
                    <td>{{ selectedReferral.program?.name || '---' }}</td>
                  </tr>
                  <tr>
                    <td class="memo-label-cell">Referring Office / Individual</td>
                    <td>
                      <ul v-if="referringParties.length" class="memo-list">
                        <li v-for="(party, index) in referringParties" :key="party.id || index">
                          <div class="memo-party-name">{{ fullName(party.client) }}</div>
                          <div v-if="firstAddress(party)" class="memo-party-detail"><strong>Address:</strong> {{ addressForMemo(party) }}</div>
                          <div class="memo-party-detail"><strong>Email:</strong> {{ party.client?.email || 'Not Provided' }}</div>
                          <div class="memo-party-detail"><strong>Phone Number:</strong> {{ party.client?.phone_number || 'Not Provided' }}</div>
                        </li>
                      </ul>
                      <span v-else>{{ selectedReferral.referred_to || '---' }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="memo-label-cell">Details of Referred Client</td>
                    <td>
                      <ul class="memo-list">
                        <li v-for="(party, index) in referredClients" :key="party.id || index">
                          <div class="memo-party-name">{{ fullName(party.client) }}</div>
                          <div v-if="firstAddress(party)" class="memo-party-detail"><strong>Address:</strong> {{ addressForMemo(party) }}</div>
                          <div class="memo-party-detail"><strong>Email:</strong> {{ party.client?.email || 'Not Provided' }}</div>
                          <div class="memo-party-detail"><strong>Phone Number:</strong> {{ party.client?.phone_number || 'Not Provided' }}</div>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td class="memo-label-cell">Case / Concern</td>
                    <td><div class="memo-rich-text" v-html="sanitizeHtml(selectedReferral.memo_case_concern, '')"></div></td>
                  </tr>
                  <tr v-if="selectedReferral.memo_remarks">
                    <td class="memo-label-cell">Additional Notes / Remarks</td>
                    <td><div class="memo-rich-text" v-html="sanitizeHtml(selectedReferral.memo_remarks, '')"></div></td>
                  </tr>
                </tbody>
              </table>

              <p class="memo-feedback">Please provide feedback to the referring party, copy furnish the PSB through psb@dswd.gov.ph within <strong>{{ selectedReferral.program?.memo_feedback_timeline || 'three (3) days' }}</strong> from the receipt of this endorsement.</p>

              <p class="memo-thanks">Thank you.</p>
            </div>

            <div class="memo-signature">
              <p>{{ selectedReferral.memo_from?.name || '---' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isServiceModalOpen && selectedReferral" class="modal-overlay service-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
      <form class="service-modal" @submit.prevent="saveService">
        <div class="service-modal-header">
          <div>
            <h2 id="service-modal-title">{{ editingServiceId ? 'Edit' : 'Add' }} Provided Service</h2>
            <p>{{ selectedReferral.drn }}</p>
          </div>
          <button type="button" aria-label="Close provided service modal" @click="closeServiceModal">&times;</button>
        </div>

        <div class="form-grid">
          <label class="sm:col-span-2">Service Name *<input v-model="serviceForm.service_name" type="text" placeholder="e.g., Financial Assistance"></label>
          <label>Providing Program *<select v-model="serviceForm.program_id"><option value="" disabled>Select program</option><option v-for="program in programs" :key="program.id" :value="program.id">{{ program.name }}</option></select></label>
          <label>Amount (PHP)<input v-model="serviceForm.amount" type="number" min="0" step="0.01" placeholder="0.00"></label>
          <label class="sm:col-span-2">Notes / Details<textarea v-model="serviceForm.notes" rows="4" placeholder="Additional details about the service provided..."></textarea></label>
        </div>

        <p v-if="serviceError" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{{ serviceError }}</p>

        <div class="service-modal-actions">
          <button type="button" class="secondary-button" :disabled="savingService" @click="closeServiceModal">Cancel</button>
          <button type="submit" class="primary-button" :disabled="savingService">{{ savingService ? 'Saving...' : `${editingServiceId ? 'Update' : 'Save'} Service` }}</button>
        </div>
      </form>
    </div>

    <div v-if="isExistingMemoDialogOpen && selectedReferral" class="modal-overlay memo-decision-overlay" role="dialog" aria-modal="true" aria-labelledby="memo-decision-title">
      <section class="memo-decision-dialog">
        <button type="button" class="memo-decision-close" aria-label="Close memo option dialog" @click="isExistingMemoDialogOpen = false">
          <AppIcon name="close" class="h-4 w-4" />
        </button>

        <div class="memo-decision-icon">
          <AppIcon name="reports" class="h-6 w-6" />
        </div>

        <div class="memo-decision-copy">
          <span class="eyebrow">Generated memorandum found</span>
          <h2 id="memo-decision-title">Use existing memo or create a new one?</h2>
          <p>
            A PDF has already been generated for {{ selectedReferral.drn }}. You can open the latest file now, or generate a new version from the current memorandum preview.
          </p>
        </div>

        <div v-if="memoAttachments[0]" class="memo-decision-file">
          <AppIcon name="folder" class="h-4 w-4" />
          <div>
            <strong>{{ memoAttachments[0].file_name }}</strong>
            <span>{{ memoAttachments[0].uploaded_at ? formatDate(memoAttachments[0].uploaded_at) : 'Generated automatically' }}</span>
          </div>
        </div>

        <div class="memo-decision-actions">
          <button type="button" class="memo-decision-secondary" @click="generateNewMemoPdf">
            Generate new version
          </button>
          <button type="button" class="memo-decision-primary" @click="viewExistingMemoPdf">
            <AppIcon name="eye" class="h-4 w-4" />
            View existing PDF
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f0f4f8;
  color: #334155
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

.primary-button:disabled {
  cursor: wait;
  opacity: .7
}

.filter-card {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: 1.5rem;
  border-radius: 1rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

.search-input {
  display: flex;
  flex: 1;
  align-items: center;
  gap: .5rem;
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .625rem .75rem
}

.search-input input {
  width: 100%;
  background: transparent;
  font-size: .875rem;
  outline: none
}

.control {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  background: #f9fafb;
  padding: .625rem .75rem;
  font-size: .875rem;
  outline: none
}

.table-card {
  overflow: hidden;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgb(0 0 0/4%)
}

th {
  background: #f9fafb;
  padding: .75rem 1rem;
  text-align: left;
  font-size: .7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #64748b
}

td {
  padding: .875rem 1rem;
  font-size: .875rem
}

tbody tr {
  border-top: 1px solid #f3f4f6
}

tbody tr:hover {
  background: #f8fafc
}

.status {
  display: inline-block;
  border-radius: 999px;
  padding: .25rem .75rem;
  font-size: .7rem;
  font-weight: 500
}

.status-pending {
  background: #fef3c7;
  color: #b45309
}

.status-approved {
  background: #dcfce7;
  color: #15803d
}

.status-archived {
  background: #f3e8ff;
  color: #7e22ce
}

.table-footer {
  border-top: 1px solid #f3f4f6;
  padding: .75rem 1rem;
  color: #94a3b8;
  font-size: .75rem
}

.modal-overlay {
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

.edit-modal-overlay {
  z-index: 120
}

.modal {
  width: 100%;
  max-width: 960px;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 25px 50px -12px rgb(0 0 0/25%)
}

.details-modal {
  max-width: 1180px
}

.details-header-actions {
  display: flex;
  align-items: center;
  gap: .5rem
}

.finalize-button {
  border-radius: .75rem;
  background: #15803d;
  padding: .625rem 1rem;
  color: white;
  font-size: .8rem;
  font-weight: 700;
  transition: background .2s ease
}

.finalize-button:hover {
  background: #166534
}

.finalize-button:disabled {
  cursor: wait;
  opacity: .75
}

.finalized-badge {
  border-radius: 999px;
  background: #dcfce7;
  padding: .45rem .8rem;
  color: #15803d;
  font-size: .72rem;
  font-weight: 800;
  text-transform: uppercase
}

.memo-preview-modal {
  max-width: 1000px;
  overflow: hidden;
  border-radius: .25rem;
  background: #d1d1d1
}

.memo-preview-actions {
  display: flex;
  align-items: center;
  gap: .5rem
}

.nested-overlay {
  z-index: 130;
  background: rgb(0 0 0/50%)
}

.memo-decision-overlay {
  z-index: 150;
  background: rgb(15 23 42/58%)
}

.memo-decision-dialog {
  position: relative;
  width: min(100%, 520px);
  overflow: hidden;
  border: 1px solid rgb(226 232 240/90%);
  border-radius: 1.25rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgb(15 23 42/28%)
}

.memo-decision-dialog::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: .35rem;
  background: linear-gradient(90deg, #003366, #c9a83e)
}

.memo-decision-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #64748b;
  transition: background .2s ease, color .2s ease
}

.memo-decision-close:hover {
  background: #e2e8f0;
  color: #0f172a
}

.memo-decision-icon {
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #e0f2fe;
  color: #0369a1
}

.memo-decision-copy {
  margin-top: 1rem;
  padding-right: 1.75rem
}

.memo-decision-copy h2 {
  margin-top: .35rem;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35
}

.memo-decision-copy p {
  margin-top: .65rem;
  color: #475569;
  font-size: .92rem;
  line-height: 1.6
}

.memo-decision-file {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: .9rem;
  background: white;
  padding: .85rem;
  color: #003366
}

.memo-decision-file div {
  display: grid;
  min-width: 0;
  gap: .2rem
}

.memo-decision-file strong {
  overflow: hidden;
  color: #1e293b;
  font-size: .85rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap
}

.memo-decision-file span {
  color: #64748b;
  font-size: .75rem
}

.memo-decision-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  margin-top: 1.25rem
}

.memo-decision-primary,
.memo-decision-secondary {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  border-radius: .85rem;
  padding: .7rem 1rem;
  font-size: .85rem;
  font-weight: 700;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease
}

.memo-decision-primary {
  background: #003366;
  color: white;
  box-shadow: 0 12px 22px rgb(0 51 102/20%)
}

.memo-decision-primary:hover,
.memo-decision-secondary:hover {
  transform: translateY(-1px)
}

.memo-decision-primary:hover {
  background: #062a50
}

.memo-decision-secondary {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155
}

.memo-decision-secondary:hover {
  background: #f1f5f9
}

.details-body {
  display: grid;
  gap: 1rem;
  padding: 1.25rem
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 1rem
}

.details-header div {
  display: grid;
  gap: .25rem
}

.details-header strong {
  color: #003366;
  font-size: 1.125rem
}

.eyebrow {
  color: #64748b;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase
}

.details-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1rem
}

.details-main,
.details-side {
  display: grid;
  align-content: start;
  gap: 1rem
}

.detail-section {
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  background: white;
  padding: 1rem
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: .75rem
}

.section-title h3 {
  color: #003366;
  font-weight: 700
}

.section-title span {
  border-radius: 999px;
  background: #eef6ff;
  padding: .25rem .6rem;
  color: #1d4ed8;
  font-size: .7rem;
  font-weight: 700
}

.section-action-button {
  border-radius: .65rem;
  background: #003366;
  padding: .45rem .75rem;
  color: white;
  font-size: .75rem;
  font-weight: 700
}

.section-action-button:hover {
  background: #002244
}

.info-message {
  border-radius: .75rem;
  background: #eff6ff;
  padding: .75rem;
  color: #1d4ed8;
  font-size: .85rem
}

.services-table-wrap {
  overflow-x: auto
}

.services-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse
}

.services-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .04em;
  text-align: left;
  text-transform: uppercase
}

.services-table th,
.services-table td {
  border-bottom: 1px solid #eef2f7;
  padding: .75rem;
  vertical-align: top
}

.services-table td {
  color: #475569;
  font-size: .85rem
}

.service-actions {
  display: flex;
  justify-content: flex-end;
  gap: .6rem;
  white-space: nowrap
}

.service-actions button {
  color: #2563eb;
  font-size: .8rem;
  font-weight: 700
}

.service-actions .danger-link {
  color: #dc2626
}

.service-modal-overlay {
  z-index: 160
}

.service-modal {
  width: min(100%, 560px);
  border-radius: 1.25rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0/25%)
}

.service-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 1rem
}

.service-modal-header h2 {
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 700
}

.service-modal-header p {
  margin-top: .2rem;
  color: #94a3b8;
  font-size: .8rem
}

.service-modal-header button {
  color: #94a3b8;
  font-size: 1.75rem;
  line-height: 1
}

.service-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  margin-top: 1.25rem;
  border-top: 1px solid #eef2f7;
  padding-top: 1rem
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .875rem
}

.detail-grid div,
.side-list div {
  display: grid;
  gap: .2rem;
  min-width: 0
}

.detail-grid .wide {
  grid-column: 1 / -1
}

.detail-grid span,
.side-list span {
  color: #64748b;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase
}

.detail-grid strong,
.side-list strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #1f2937;
  font-size: .9rem;
  font-weight: 600
}

.side-list {
  display: grid;
  gap: .875rem
}

.rich-content {
  overflow-wrap: anywhere;
  color: #1f2937;
  font-size: .9rem;
  line-height: 1.6
}

.rich-content :deep(p) {
  margin: 0 0 .5rem
}

.rich-content :deep(p:last-child) {
  margin-bottom: 0
}

.rich-content :deep(ul),
.rich-content :deep(ol) {
  margin: .5rem 0 .5rem 1.25rem
}

.attachment-list {
  display: grid;
  gap: .5rem
}

.attachment-list a {
  display: grid;
  gap: .15rem;
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .65rem .75rem;
  color: #003366;
  font-size: .85rem;
  font-weight: 700
}

.attachment-list a:hover {
  border-color: #c9a83e;
  background: #fffbeb
}

.attachment-list small {
  color: #94a3b8;
  font-size: .7rem;
  font-weight: 500
}

.memo-action-button {
  width: 100%;
  border-radius: .75rem;
  background: #003366;
  padding: .75rem 1rem;
  color: white;
  font-size: .875rem;
  font-weight: 700
}

.memo-action-button:hover {
  background: #002244
}

.memo-pdf-block {
  display: grid;
  gap: .5rem;
  margin-top: 1rem
}

.memo-pdf-link {
  display: grid;
  width: 100%;
  gap: .15rem;
  border: 1px solid #bfdbfe;
  border-radius: .75rem;
  background: #eff6ff;
  padding: .75rem;
  color: #1d4ed8;
  font-size: .85rem;
  font-weight: 700;
  text-align: left
}

.memo-pdf-link:hover {
  border-color: #c9a83e;
  background: #fffbeb;
  color: #003366
}

.memo-pdf-link small {
  color: #64748b;
  font-size: .7rem;
  font-weight: 500
}

.memo-modal-content {
  max-height: calc(92vh - 66px);
  overflow: auto;
  padding: 2rem 0;
  background: #d1d1d1
}

.memo-content {
  width: 8.5in;
  min-height: 11in;
  box-sizing: border-box;
  margin: 0 auto;
  background: white;
  padding: .5in;
  color: #000;
  font-family: Inter, Arial, sans-serif;
  font-size: 16px
}

.memo-agency-header {
  margin-bottom: 2rem
}

.memo-agency-row {
  display: flex;
  flex-direction: row;
  border-bottom: 2px solid #000;
  padding-bottom: .5rem
}

.memo-logo-wrap {
  display: flex;
  flex: 1;
  align-items: center
}

.memo-logo {
  height: 4rem
}

.memo-office-title {
  display: flex;
  flex-direction: column;
  font-family: 'Times New Roman', Times, serif;
  font-weight: 700;
  text-align: right;
  text-transform: uppercase
}

.memo-office-title h2 {
  font-size: 1.125rem;
  line-height: 1.75rem
}

.memo-office-title h3 {
  text-align: center;
  font-size: 1rem;
  line-height: 1.5rem
}

.memo-drn {
  margin-top: .25rem;
  text-align: right;
  font-size: .75rem;
  font-weight: 700;
  line-height: 1rem
}

.memo-heading {
  margin-bottom: .25rem;
  text-align: left;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.75rem;
  text-transform: uppercase
}

.memo-meta {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
  font-size: 1rem
}

.memo-meta-row {
  display: grid;
  grid-template-columns: 100px 50px 1fr;
  align-items: start
}

.memo-meta-row > span:first-child,
.memo-meta-row > span:nth-child(2) {
  font-weight: 700;
  text-transform: uppercase
}

.memo-meta-row > span:nth-child(2) {
  text-align: center
}

.memo-meta-row div {
  display: flex;
  flex-direction: column
}

.memo-meta-row strong {
  font-weight: 700;
  text-transform: uppercase
}

.memo-meta-row em {
  font-size: .875rem;
  font-style: italic;
  line-height: 1.25rem
}

.memo-meta-row small {
  font-size: .875rem;
  line-height: 1.25rem
}

.memo-body {
  margin-bottom: 3rem;
  font-size: 1rem
}

.memo-intro {
  margin-bottom: 1rem;
  text-align: justify
}

.memo-table {
  width: 100%;
  border-collapse: collapse
}

.memo-table td {
  border: 1px solid #000;
  padding: 8px;
  text-align: left;
  vertical-align: top
}

.memo-label-cell {
  width: 25%;
  font-weight: 700
}

.memo-list {
  margin-left: 1rem;
  list-style-type: disc
}

.memo-list li {
  margin-bottom: .5rem
}

.memo-party-name {
  font-weight: 700;
  text-transform: uppercase
}

.memo-party-detail {
  margin-top: .25rem;
  font-size: .875rem;
  line-height: 1.25rem
}

.memo-rich-text {
  font-size: 14px;
  line-height: 1.6
}

.memo-rich-text :deep(p) {
  margin-bottom: .5rem
}

.memo-rich-text :deep(ul) {
  margin-bottom: 1rem;
  margin-left: 1.5rem;
  list-style-type: disc
}

.memo-rich-text :deep(ol) {
  margin-bottom: 1rem;
  margin-left: 1.5rem;
  list-style-type: decimal
}

.memo-rich-text :deep(li) {
  margin-bottom: .25rem
}

.memo-rich-text :deep(strong),
.memo-rich-text :deep(b) {
  font-weight: 700
}

.memo-rich-text :deep(em),
.memo-rich-text :deep(i) {
  font-style: italic
}

.memo-rich-text :deep(u) {
  text-decoration: underline
}

.memo-feedback {
  margin-top: 2rem
}

.memo-thanks {
  margin-top: 1rem
}

.memo-signature {
  margin-top: 5rem
}

.memo-signature p {
  font-weight: 700;
  text-transform: uppercase
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem
}

.step {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 999px;
  background: #e5e7eb;
  color: #9ca3af;
  font-size: .75rem;
  font-weight: 600
}

.step.active {
  background: #c9a83e;
  color: white
}

.step.completed {
  background: #003366;
  color: white
}

.step-line {
  width: 2rem;
  height: 2px;
  background: #e5e7eb
}

.step-line.completed {
  background: #003366
}

.party-card {
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 1rem
}

.party-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: .75rem
}

.party-header h3 {
  color: #003366;
  font-weight: 700
}

.form-grid {
  display: grid;
  gap: 1rem
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: .35rem;
  color: #374151;
  font-size: .875rem;
  font-weight: 500
}

.field-label {
  display: block;
  margin-bottom: .35rem;
  color: #374151;
  font-size: .875rem;
  font-weight: 500
}

.form-grid input,
.form-grid select,
.form-grid textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: .75rem;
  background: white;
  padding: .625rem .75rem;
  font-weight: 400;
  outline: none
}

.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%)
}

.rich-editor-field :deep(.ck-editor) {
  color: #111827;
  font-weight: 400
}

.rich-editor-field :deep(.ck-toolbar) {
  border-color: #d1d5db;
  border-radius: .75rem .75rem 0 0
}

.rich-editor-field :deep(.ck-content) {
  min-height: 160px;
  border-color: #d1d5db;
  border-radius: 0 0 .75rem .75rem;
  font-size: .875rem;
  line-height: 1.5
}

.rich-editor-field :deep(.ck.ck-editor__editable_inline:focus) {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%)
}

.secondary-button {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .625rem 1rem;
  color: #4b5563;
  font-size: .875rem
}


.danger-button {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .625rem 1rem;
  color: #4b5563;
  font-size: .875rem
}

.danger-button {
  border-color: #fecaca;
  color: #b91c1c
}

.file-list {
  display: grid;
  gap: .5rem
}

.file-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .65rem .75rem;
  color: #475569;
  font-size: .8rem
}

.file-list button {
  color: #b91c1c;
  font-weight: 600
}

.scrollable {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent
}

@media(min-width:640px) {
  .filter-card {
    flex-direction: row
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr))
  }
}

@media(max-width:767px) {
  .topbar {
    padding: .75rem 1rem
  }

  .details-layout,
  .detail-grid {
    grid-template-columns: 1fr
  }

  .memo-modal-content {
    padding: 1rem;
  }

  .memo-content {
    transform: scale(.72);
    transform-origin: top left;
  }

  .memo-decision-dialog {
    padding: 1.25rem
  }

  .memo-decision-copy {
    padding-right: 0
  }

  .memo-decision-actions {
    flex-direction: column-reverse
  }

  .memo-decision-primary,
  .memo-decision-secondary {
    width: 100%
  }

  .details-header {
    align-items: flex-start;
    flex-direction: column
  }
}
</style>
