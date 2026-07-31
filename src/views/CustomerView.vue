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

const customers = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedCustomer = ref(null);

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
  username: '',
  branchId: '',
  phoneNumber: '',
  address: '',
  description: '',
  percentages: [],
  balance: 0,
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

const getCustomerId = (customer) => {
  return customer?.id || customer?._id || null;
};

const formatBalance = (value) => {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const resetForm = () => {
  form.value = {
    id: null,
    username: '',
    branchId: '',
    phoneNumber: '',
    address: '',
    description: '',
    percentages: [],
    balance: 0,
    status: true
  };
};

const fetchCustomers = async () => {
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

    const response = await api.get('/customers', {
      params
    });

    customers.value = extractArrayData(response, [
      'customers',
      'items',
      'results'
    ]);

    totalRecords.value = extractTotalRecords(
      response,
      customers.value.length
    );
  } catch (error) {
    console.error('Fetch customers error:', error);

    customers.value = [];

    errorMessage.value =
      error.response?.data?.message ||
      'Could not fetch customers';
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  page.value = 1;
  fetchCustomers();
};

const clearFilter = () => {
  search.value = '';
  filterStatus.value = null;
  page.value = 1;

  fetchCustomers();
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;

  fetchCustomers();
};

const goToPreviousPage = () => {
  if (loading.value || page.value <= 1) {
    return;
  }

  page.value -= 1;
  fetchCustomers();
};

const goToNextPage = () => {
  if (
    loading.value ||
    page.value >= totalPages.value
  ) {
    return;
  }

  page.value += 1;
  fetchCustomers();
};

const openCreateDialog = () => {
  clearMessages();
  resetForm();

  isEditMode.value = false;
  formDialogVisible.value = true;
};

const openEditDialog = (customer) => {
  clearMessages();

  form.value = {
    id: getCustomerId(customer),
    username: customer.username || '',
    branchId: customer.branchId || '',
    phoneNumber: customer.phoneNumber || '',
    address: customer.address || '',
    description: customer.description || '',
    percentages: Array.isArray(customer.percentages)
      ? customer.percentages
      : [],
    balance: Number(customer.balance || 0),
    status: customer.status !== false
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
  if (!form.value.username.trim()) {
    return 'Username is required';
  }

  if (!form.value.branchId.trim()) {
    return 'Branch ID is required';
  }

  if (Number(form.value.balance || 0) < 0) {
    return 'Balance cannot be negative';
  }

  return '';
};

const buildPayload = () => {
  return {
    username: form.value.username.trim(),
    branchId: form.value.branchId.trim(),
    phoneNumber: form.value.phoneNumber.trim(),
    address: form.value.address.trim(),
    description: form.value.description.trim(),
    percentages: form.value.percentages,
    balance: Number(form.value.balance || 0),
    status: Boolean(form.value.status)
  };
};

const saveCustomer = async () => {
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
        `/customers/${form.value.id}`,
        payload
      );

      successMessage.value =
        'Customer updated successfully';
    } else {
      await api.post('/customers', payload);

      successMessage.value =
        'Customer created successfully';
    }

    formDialogVisible.value = false;
    resetForm();

    await fetchCustomers();
  } catch (error) {
    console.error('Save customer error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      'Could not save customer';
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (customer) => {
  clearMessages();

  selectedCustomer.value = customer;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
  selectedCustomer.value = null;
};

const confirmDeleteCustomer = async () => {
  if (!selectedCustomer.value) {
    return;
  }

  try {
    deleting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const customerId = getCustomerId(
      selectedCustomer.value
    );

    if (!customerId) {
      throw new Error('Customer ID was not found');
    }

    await api.delete(`/customers/${customerId}`);

    successMessage.value =
      'Customer deleted successfully';

    deleteDialogVisible.value = false;
    selectedCustomer.value = null;

    if (
      customers.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1;
    }

    await fetchCustomers();
  } catch (error) {
    console.error('Delete customer error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      'Could not delete customer';
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6">
    <Card>
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
            >
              <i class="pi pi-users"></i>
            </div>

            <h1 class="text-xl font-bold sm:text-2xl">
              Customers
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
            placeholder="Search customer..."
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
              aria-label="Reset"
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
            v-for="customer in customers"
            v-else
            :key="getCustomerId(customer)"
            class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold">
                  {{ customer.username || '-' }}
                </h2>

                <div class="mt-1 text-sm text-gray-500">
                  {{ customer.branchId || '-' }}
                </div>
              </div>

              <Tag
                :value="customer.status ? 'Active' : 'Inactive'"
                :severity="customer.status ? 'success' : 'danger'"
              />
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-gray-50 p-3">
                <div class="text-xs text-gray-500">
                  Phone
                </div>

                <div class="mt-1 truncate font-medium">
                  {{ customer.phoneNumber || '-' }}
                </div>
              </div>

              <div class="rounded-lg bg-gray-50 p-3">
                <div class="text-xs text-gray-500">
                  Balance
                </div>

                <div class="mt-1 font-semibold">
                  {{ formatBalance(customer.balance) }}
                </div>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="info"
                outlined
                @click="openEditDialog(customer)"
              />

              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="openDeleteDialog(customer)"
              />
            </div>
          </article>

          <div
            v-if="!loading && !customers.length"
            class="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500"
          >
            No customers found.
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
            :value="customers"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="id"
            :rows="limit"
            :first="(page - 1) * limit"
            :totalRecords="totalRecords"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 850px"
            @page="onPageChange"
          >
            <Column
              field="username"
              header="Username"
              style="min-width: 160px"
            />

            <Column
              field="branchId"
              header="Branch"
              style="min-width: 130px"
            />

            <Column
              field="phoneNumber"
              header="Phone"
              style="min-width: 150px"
            >
              <template #body="{ data }">
                {{ data.phoneNumber || '-' }}
              </template>
            </Column>

            <Column
              field="balance"
              header="Balance"
              style="min-width: 120px"
            >
              <template #body="{ data }">
                {{ formatBalance(data.balance) }}
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
              frozen
              alignFrozen="right"
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
                No customers found.
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="formDialogVisible"
      modal
      :header="isEditMode ? 'Edit Customer' : 'Add Customer'"
      :style="{
        width: '95vw',
        maxWidth: '650px'
      }"
      :closable="!saving"
      :draggable="false"
      class="customer-form-dialog"
    >
      <div class="space-y-4">
        <Message
          v-if="errorMessage"
          severity="error"
        >
          {{ errorMessage }}
        </Message>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium">
              Username
            </label>

            <InputText
              v-model="form.username"
              class="w-full"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">
              Branch ID
            </label>

            <InputText
              v-model="form.branchId"
              class="w-full"
              placeholder="Enter branch ID"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">
              Phone Number
            </label>

            <InputText
              v-model="form.phoneNumber"
              class="w-full"
              placeholder="Enter phone number"
              inputmode="tel"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">
              Balance
            </label>

            <InputNumber
              v-model="form.balance"
              class="w-full"
              input-class="w-full"
              :min="0"
              :maxFractionDigits="2"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium">
              Address
            </label>

            <Textarea
              v-model="form.address"
              class="w-full"
              rows="2"
              autoResize
            />
          </div>

          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium">
              Description
            </label>

            <Textarea
              v-model="form.description"
              class="w-full"
              rows="2"
              autoResize
            />
          </div>

          <div class="sm:col-span-2">
            <div
              class="flex items-center justify-between rounded-xl border border-gray-200 p-3"
            >
              <span class="font-medium">
                Active
              </span>

              <ToggleSwitch v-model="form.status" />
            </div>
          </div>
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
            @click="saveCustomer"
          />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Delete Customer"
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
          {{ selectedCustomer?.username }}
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
            @click="confirmDeleteCustomer"
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
  .customer-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .customer-form-dialog .p-dialog-content {
    overflow-y: auto;
  }
}
</style>