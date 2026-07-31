<script setup>
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import ToggleSwitch from 'primevue/toggleswitch';

import api from '../services/api';

const rates = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedRate = ref(null);

const errorMessage = ref('');
const successMessage = ref('');

const search = ref('');
const filterStatus = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

const statusOptions = [
  {
    label: 'Active',
    value: true
  },
  {
    label: 'Inactive',
    value: false
  }
];

const form = ref({
  id: null,
  name: '',
  number: null,
  description: '',
  status: true
});

const totalPages = computed(() => {
  return Math.max(
    Math.ceil(
      Number(totalRecords.value || 0) /
      Number(limit.value || 10)
    ),
    1
  );
});

const extractArrayData = (response, keys = []) => {
  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  for (const key of keys) {
    if (Array.isArray(response.data?.data?.[key])) {
      return response.data.data[key];
    }

    if (Array.isArray(response.data?.[key])) {
      return response.data[key];
    }
  }

  return [];
};

const extractTotalRecords = (response, fallback = 0) => {
  return (
    response.data?.pagination?.total ??
    response.data?.data?.pagination?.total ??
    response.data?.data?.total ??
    response.data?.total ??
    fallback
  );
};

const getRateId = (rate) => {
  return rate?.id || rate?._id || null;
};

const formatRateNumber = (value) => {
  const number = Number(value || 0);

  return `${number.toLocaleString('en-US', {
    maximumFractionDigits: 2
  })}%`;
};

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    number: null,
    description: '',
    status: true
  };
};

const fetchRates = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const params = {
      page: page.value,
      limit: limit.value
    };

    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    if (filterStatus.value !== null) {
      params.status = filterStatus.value;
    }

    const response = await api.get('/rates', {
      params
    });

    rates.value = extractArrayData(response, [
      'rates',
      'items',
      'results'
    ]);

    totalRecords.value = extractTotalRecords(
      response,
      rates.value.length
    );
  } catch (error) {
    console.error('Fetch rates error:', error);

    rates.value = [];

    errorMessage.value =
      error.response?.data?.message ||
      'Could not fetch rates';
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  page.value = 1;
  fetchRates();
};

const clearFilter = () => {
  search.value = '';
  filterStatus.value = null;
  page.value = 1;

  fetchRates();
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;

  fetchRates();
};

const goToPreviousPage = () => {
  if (loading.value || page.value <= 1) {
    return;
  }

  page.value -= 1;
  fetchRates();
};

const goToNextPage = () => {
  if (
    loading.value ||
    page.value >= totalPages.value
  ) {
    return;
  }

  page.value += 1;
  fetchRates();
};

const openCreateDialog = () => {
  clearMessages();
  resetForm();

  isEditMode.value = false;
  formDialogVisible.value = true;
};

const openEditDialog = (rate) => {
  clearMessages();

  form.value = {
    id: getRateId(rate),
    name: rate.name || '',
    number: Number(rate.number || 0),
    description: rate.description || '',
    status: rate.status !== false
  };

  isEditMode.value = true;
  formDialogVisible.value = true;
};

const closeFormDialog = () => {
  if (saving.value) {
    return;
  }

  formDialogVisible.value = false;
  resetForm();
};

const validateForm = () => {
  if (!form.value.name.trim()) {
    return 'Rate name is required';
  }

  if (
    form.value.number === null ||
    form.value.number === undefined
  ) {
    return 'Rate number is required';
  }

  if (Number(form.value.number) < 0) {
    return 'Rate number cannot be negative';
  }

  return '';
};

const buildPayload = () => {
  return {
    name: form.value.name.trim(),
    number: Number(form.value.number),
    description: form.value.description.trim(),
    status: Boolean(form.value.status)
  };
};

const saveRate = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';

    const validationError = validateForm();

    if (validationError) {
      errorMessage.value = validationError;
      return;
    }

    saving.value = true;

    const payload = buildPayload();

    if (isEditMode.value) {
      await api.put(
        `/rates/${form.value.id}`,
        payload
      );

      successMessage.value =
        'Rate updated successfully';
    } else {
      await api.post('/rates', payload);

      successMessage.value =
        'Rate created successfully';
    }

    formDialogVisible.value = false;
    resetForm();

    await fetchRates();
  } catch (error) {
    console.error('Save rate error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      'Could not save rate';
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (rate) => {
  clearMessages();

  selectedRate.value = rate;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
  selectedRate.value = null;
};

const confirmDeleteRate = async () => {
  if (!selectedRate.value) {
    return;
  }

  try {
    deleting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const rateId = getRateId(selectedRate.value);

    await api.delete(`/rates/${rateId}`);

    successMessage.value =
      'Rate deleted successfully';

    deleteDialogVisible.value = false;
    selectedRate.value = null;

    if (
      rates.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1;
    }

    await fetchRates();
  } catch (error) {
    console.error('Delete rate error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      'Could not delete rate';

    deleteDialogVisible.value = false;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchRates();
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6">
    <Card>
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600"
            >
              <i class="pi pi-percentage"></i>
            </div>

            <h1 class="text-xl font-bold sm:text-2xl">
              Rates
            </h1>
          </div>

          <Button
            label="Add"
            icon="pi pi-plus"
            size="small"
            @click="openCreateDialog"
          />
        </div>
      </template>

      <template #content>
        <Message
          v-if="errorMessage"
          severity="error"
          class="mb-3"
          closable
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </Message>

        <Message
          v-if="successMessage"
          severity="success"
          class="mb-3"
          closable
          @close="successMessage = ''"
        >
          {{ successMessage }}
        </Message>

        <div
          class="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_auto]"
        >
          <InputText
            v-model="search"
            class="w-full"
            placeholder="Search rate..."
            @keyup.enter="applyFilter"
          />

          <Select
            v-model="filterStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All statuses"
            class="w-full"
            showClear
          />

          <div class="grid grid-cols-2 gap-2 sm:flex">
            <Button
              label="Search"
              icon="pi pi-search"
              @click="applyFilter"
            />

            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              @click="clearFilter"
            />
          </div>
        </div>

        <!-- Smartphone cards -->
        <div class="space-y-3 md:hidden">
          <div
            v-if="loading"
            class="py-10 text-center"
          >
            <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
          </div>

          <article
            v-for="rate in rates"
            v-else
            :key="getRateId(rate)"
            class="rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold">
                  {{ rate.name }}
                </h2>

                <div class="mt-2 text-3xl font-extrabold text-rose-600">
                  {{ formatRateNumber(rate.number) }}
                </div>
              </div>

              <Tag
                :value="rate.status ? 'Active' : 'Inactive'"
                :severity="rate.status ? 'success' : 'danger'"
              />
            </div>

            <p
              v-if="rate.description"
              class="mt-3 line-clamp-2 text-sm text-gray-500"
            >
              {{ rate.description }}
            </p>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="info"
                outlined
                @click="openEditDialog(rate)"
              />

              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="openDeleteDialog(rate)"
              />
            </div>
          </article>

          <div
            v-if="!loading && !rates.length"
            class="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500"
          >
            No rates found.
          </div>

          <div
            v-if="totalRecords > 0"
            class="flex items-center justify-between rounded-xl border border-gray-200 p-2"
          >
            <Button
              icon="pi pi-chevron-left"
              severity="secondary"
              text
              rounded
              :disabled="page <= 1 || loading"
              @click="goToPreviousPage"
            />

            <span class="text-sm font-medium">
              Page {{ page }} of {{ totalPages }}
            </span>

            <Button
              icon="pi pi-chevron-right"
              severity="secondary"
              text
              rounded
              :disabled="page >= totalPages || loading"
              @click="goToNextPage"
            />
          </div>
        </div>

        <!-- Desktop table -->
        <div class="hidden md:block">
          <DataTable
            :value="rates"
            :loading="loading"
            lazy
            paginator
            dataKey="id"
            :rows="limit"
            :first="(page - 1) * limit"
            :totalRecords="totalRecords"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            @page="onPageChange"
          >
            <Column
              field="name"
              header="Rate Name"
              style="min-width: 180px"
            />

            <Column
              field="number"
              header="Rate"
              style="min-width: 120px"
            >
              <template #body="{ data }">
                <span class="font-bold text-rose-600">
                  {{ formatRateNumber(data.number) }}
                </span>
              </template>
            </Column>

            <Column
              field="description"
              header="Description"
              style="min-width: 240px"
            >
              <template #body="{ data }">
                {{ data.description || '-' }}
              </template>
            </Column>

            <Column
              header="Status"
              style="min-width: 110px"
            >
              <template #body="{ data }">
                <Tag
                  :value="data.status ? 'Active' : 'Inactive'"
                  :severity="data.status ? 'success' : 'danger'"
                />
              </template>
            </Column>

            <Column
              header="Action"
              style="min-width: 120px"
            >
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button
                    icon="pi pi-pencil"
                    size="small"
                    severity="info"
                    @click="openEditDialog(data)"
                  />

                  <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    @click="openDeleteDialog(data)"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="py-8 text-center text-gray-500">
                No rates found.
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="formDialogVisible"
      modal
      :header="isEditMode ? 'Edit Rate' : 'Add Rate'"
      :style="{
        width: '95vw',
        maxWidth: '560px'
      }"
      :closable="!saving"
      :draggable="false"
      class="rate-form-dialog"
    >
      <div class="space-y-4">
        <Message
          v-if="errorMessage"
          severity="error"
        >
          {{ errorMessage }}
        </Message>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Rate Name
          </label>

          <InputText
            v-model="form.name"
            class="w-full"
            placeholder="Example: 2D 100%"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Percentage Number
          </label>

          <InputNumber
            v-model="form.number"
            class="w-full"
            input-class="w-full"
            suffix="%"
            :min="0"
            :maxFractionDigits="2"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Description
          </label>

          <Textarea
            v-model="form.description"
            class="w-full"
            rows="3"
            autoResize
          />
        </div>

        <div
          class="flex items-center justify-between rounded-xl border border-gray-200 p-3"
        >
          <span class="font-medium">
            Active
          </span>

          <ToggleSwitch v-model="form.status" />
        </div>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            :disabled="saving"
            @click="closeFormDialog"
          />

          <Button
            :label="isEditMode ? 'Update' : 'Create'"
            icon="pi pi-save"
            :loading="saving"
            @click="saveRate"
          />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Delete Rate"
      :style="{
        width: '94vw',
        maxWidth: '420px'
      }"
      :closable="!deleting"
      :draggable="false"
    >
      <p>
        Delete
        <strong>
          {{ selectedRate?.name }}
        </strong>
        ?
      </p>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            :disabled="deleting"
            @click="closeDeleteDialog"
          />

          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            :loading="deleting"
            @click="confirmDeleteRate"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 0.875rem;
}

:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-inputnumber),
:deep(.p-button) {
  min-height: 44px;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 1.5rem;
  }
}
</style>

<style>
@media (max-width: 639px) {
  .rate-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
}
</style>