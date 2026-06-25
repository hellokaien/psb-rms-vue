<script setup>
import { computed, reactive, ref } from "vue";
import AdminShell from "../components/AdminShell.vue";
import AppIcon from "../components/AppIcon.vue";

const activeType = ref("programs");
const searchQuery = ref("");
const isModalOpen = ref(false);
const editingId = ref(null);
const feedback = ref("");
const form = reactive({ name: "", detail: "" });

const tabs = [
  { id: "programs", label: "Programs" },
  { id: "categories", label: "Case Categories" },
  { id: "signatories", label: "Signatories" },
];
const collections = reactive({
  programs: [
    { id: 1, name: "Child Welfare Program", detail: "CW-001" },
    { id: 2, name: "Senior Citizen Program", detail: "SC-001" },
    { id: 3, name: "Disability Program", detail: "DIS-001" },
    { id: 4, name: "Women's Welfare Program", detail: "WW-001" },
    { id: 5, name: "Mental Health Program", detail: "MH-001" },
  ],
  categories: [
    { id: 1, name: "Child Abuse", detail: "Cases involving child abuse or neglect" },
    { id: 2, name: "Elderly Assistance", detail: "Support and assistance for senior citizens" },
    { id: 3, name: "Disability Support", detail: "Cases involving persons with disabilities" },
    { id: 4, name: "Women's Crisis", detail: "Crisis intervention for women in need" },
    { id: 5, name: "Mental Health", detail: "Psychological and mental health cases" },
  ],
  signatories: [
    { id: 1, name: "Atty. Maria Santos", detail: "Director · PSB" },
    { id: 2, name: "Dr. Jose Rizal", detail: "Assistant Director · PSB" },
    { id: 3, name: "Ms. Corazon Aquino", detail: "Chief Social Worker · PSB" },
    { id: 4, name: "Mr. Benigno Ramos", detail: "Legal Officer · PSB" },
  ],
});

const activeTab = computed(() => tabs.find((tab) => tab.id === activeType.value));
const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return collections[activeType.value].filter(
    (item) => !query || `${item.name} ${item.detail}`.toLowerCase().includes(query),
  );
});
const detailLabel = computed(() =>
  activeType.value === "programs"
    ? "Program Code"
    : activeType.value === "categories"
      ? "Description"
      : "Position and Office",
);

const notify = (message) => {
  feedback.value = message;
  window.setTimeout(() => {
    feedback.value = "";
  }, 2200);
};
const openAdd = () => {
  editingId.value = null;
  Object.assign(form, { name: "", detail: "" });
  isModalOpen.value = true;
};
const openEdit = (item) => {
  editingId.value = item.id;
  Object.assign(form, item);
  isModalOpen.value = true;
};
const saveItem = () => {
  if (!form.name.trim() || !form.detail.trim()) return;
  const items = collections[activeType.value];
  if (editingId.value) {
    const index = items.findIndex((item) => item.id === editingId.value);
    items[index] = { ...items[index], name: form.name, detail: form.detail };
  } else {
    items.push({ id: Date.now(), name: form.name, detail: form.detail });
  }
  isModalOpen.value = false;
  notify(`${activeTab.value.label} updated.`);
};
const removeItem = (item) => {
  if (!window.confirm(`Delete “${item.name}”?`)) return;
  const items = collections[activeType.value];
  items.splice(
    items.findIndex((entry) => entry.id === item.id),
    1,
  );
  notify("Reference item deleted.");
};
</script>

<template>
  <AdminShell
    active-route="reference"
    title="Reference Data"
    subtitle="Manage programs, case categories, and authorized signatories"
  >
    <template #actions
      ><button class="primary" type="button" @click="openAdd">
        <AppIcon name="plus" class="h-4 w-4" /><span class="hidden sm:inline"
          >Add {{ activeTab.label.replace(/s$/, "") }}</span
        >
      </button></template
    >

    <div class="mb-5 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab"
        :class="{ active: activeType === tab.id }"
        @click="
          activeType = tab.id;
          searchQuery = '';
        "
      >
        {{ tab.label }}
      </button>
    </div>
    <section class="card">
      <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 class="font-semibold text-gray-800">{{ activeTab.label }}</h2>
          <p class="mt-1 text-sm text-gray-400">
            {{ filteredItems.length }} configured {{ activeTab.label.toLowerCase() }}
          </p>
        </div>
        <label class="search"
          ><AppIcon name="search" class="h-4 w-4 text-gray-400" />
          <input v-model="searchQuery" type="search" placeholder="Search reference data..." />
        </label>
      </div>
      <div class="space-y-2">
        <article v-for="item in filteredItems" :key="item.id" class="item">
          <div class="min-w-0">
            <h3 class="truncate text-sm font-medium text-gray-700">{{ item.name }}</h3>
            <p class="truncate text-xs text-gray-400">
              {{ activeType === "programs" ? "Code: " : "" }}{{ item.detail }}
            </p>
          </div>
          <div class="flex shrink-0 gap-3">
            <button type="button" class="text-sm font-medium text-blue-600" @click="openEdit(item)">
              Edit</button
            ><button
              type="button"
              class="text-sm font-medium text-red-500"
              @click="removeItem(item)"
            >
              Delete
            </button>
          </div>
        </article>
        <p v-if="!filteredItems.length" class="py-10 text-center text-sm text-gray-400">
          No reference items found.
        </p>
      </div>
    </section>

    <div v-if="isModalOpen" class="overlay" @click.self="isModalOpen = false">
      <form class="modal" @submit.prevent="saveItem">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-800">
              {{ editingId ? "Edit" : "Add" }} {{ activeTab.label.replace(/s$/, "") }}
            </h2>
            <p class="text-xs text-gray-400">Changes are stored locally for this demo.</p>
          </div>
          <button type="button" class="text-2xl text-gray-400" @click="isModalOpen = false">
            ×
          </button>
        </div>
        <label>Name *<input v-model="form.name" type="text" required /></label
        ><label
          >{{ detailLabel }} *<textarea v-model="form.detail" rows="3" required></textarea>
        </label>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="secondary" @click="isModalOpen = false">Cancel</button
          ><button type="submit" class="primary">Save Item</button>
        </div>
      </form>
    </div>
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
.card {
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgb(0 0 0/4%);
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
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0/50%);
  padding: 1rem;
  backdrop-filter: blur(4px);
}
.modal {
  width: 100%;
  max-width: 520px;
  border-radius: 1.25rem;
  background: white;
  padding: 1.5rem;
  box-shadow: 0 25px 50px rgb(0 0 0/20%);
}
.modal label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1rem;
  color: #374151;
  font-size: 0.8rem;
  font-weight: 500;
}
.modal input,
.modal textarea {
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
  font-weight: 400;
  outline: none;
}
.modal input:focus,
.modal textarea:focus {
  border-color: #c9a83e;
  box-shadow: 0 0 0 3px rgb(201 168 62/15%);
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
@media (max-width: 480px) {
  .search input {
    width: 100%;
  }
}
</style>
