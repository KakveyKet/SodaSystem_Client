<script setup>
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

import api from '../services/api';

const users = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedUser = ref(null);

const errorMessage = ref('');
const successMessage = ref('');

const search = ref('');
const filterRole = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

const roleOptions = [
  {
    label: 'User',
    value: 'user'
  },
  {
    label: 'Administrator',
    value: 'admin'
  }
];

const form = ref({
  id: null,
  name: '',
  email: '',
  password: '',
  role: 'user'
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

const extractArrayData = (
  response,
  keys = []
) => {
  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  for (const key of keys) {
    if (
      Array.isArray(
        response.data?.data?.[key]
      )
    ) {
      return response.data.data[key];
    }

    if (
      Array.isArray(
        response.data?.[key]
      )
    ) {
      return response.data[key];
    }
  }

  return [];
};

const extractTotalRecords = (
  response,
  fallback = 0
) => {
  return (
    response.data?.pagination?.total ??
    response.data?.data?.pagination?.total ??
    response.data?.data?.total ??
    response.data?.total ??
    fallback
  );
};

const getUserId = (user) => {
  return user?.id || user?._id || null;
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

const getRoleLabel = (role) => {
  return role === 'admin'
    ? 'Administrator'
    : 'User';
};

const getRoleSeverity = (role) => {
  return role === 'admin'
    ? 'danger'
    : 'info';
};

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    email: '',
    password: '',
    role: 'user'
  };
};

const fetchUsers = async () => {
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

    if (filterRole.value) {
      params.role = filterRole.value;
    }

    const response = await api.get(
      '/users',
      {
        params
      }
    );

    users.value = extractArrayData(
      response,
      [
        'users',
        'items',
        'results'
      ]
    );

    totalRecords.value =
      extractTotalRecords(
        response,
        users.value.length
      );
  } catch (error) {
    console.error(
      'Fetch users error:',
      error
    );

    users.value = [];

    errorMessage.value =
      error.response?.data?.message ||
      'Could not fetch users';
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  page.value = 1;
  fetchUsers();
};

const clearFilter = () => {
  search.value = '';
  filterRole.value = null;
  page.value = 1;

  fetchUsers();
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;

  fetchUsers();
};

const goToPreviousPage = () => {
  if (
    loading.value ||
    page.value <= 1
  ) {
    return;
  }

  page.value -= 1;
  fetchUsers();
};

const goToNextPage = () => {
  if (
    loading.value ||
    page.value >= totalPages.value
  ) {
    return;
  }

  page.value += 1;
  fetchUsers();
};

const openCreateDialog = () => {
  clearMessages();
  resetForm();

  isEditMode.value = false;
  formDialogVisible.value = true;
};

const openEditDialog = (user) => {
  clearMessages();

  form.value = {
    id: getUserId(user),
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'user'
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
    return 'Name is required';
  }

  if (!form.value.email.trim()) {
    return 'Email is required';
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      form.value.email.trim()
    )
  ) {
    return 'Please enter a valid email';
  }

  if (
    !isEditMode.value &&
    !form.value.password
  ) {
    return 'Password is required';
  }

  if (
    form.value.password &&
    form.value.password.length < 6
  ) {
    return 'Password must be at least 6 characters';
  }

  if (
    !['user', 'admin'].includes(
      form.value.role
    )
  ) {
    return 'Please select a valid role';
  }

  return '';
};

const buildPayload = () => {
  const payload = {
    name: form.value.name.trim(),
    email: form.value.email
      .trim()
      .toLowerCase(),
    role: form.value.role
  };

  if (form.value.password) {
    payload.password =
      form.value.password;
  }

  return payload;
};

const saveUser = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';

    const validationError =
      validateForm();

    if (validationError) {
      errorMessage.value =
        validationError;

      return;
    }

    saving.value = true;

    const payload = buildPayload();

    if (isEditMode.value) {
      await api.put(
        `/users/${form.value.id}`,
        payload
      );

      successMessage.value =
        'User updated successfully';
    } else {
      await api.post(
        '/users',
        payload
      );

      successMessage.value =
        'User created successfully';
    }

    formDialogVisible.value = false;
    resetForm();

    await fetchUsers();
  } catch (error) {
    console.error(
      'Save user error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      'Could not save user';
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (user) => {
  clearMessages();

  selectedUser.value = user;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
  selectedUser.value = null;
};

const confirmDeleteUser = async () => {
  if (!selectedUser.value) {
    return;
  }

  try {
    deleting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const userId = getUserId(
      selectedUser.value
    );

    if (!userId) {
      throw new Error(
        'User ID was not found'
      );
    }

    await api.delete(
      `/users/${userId}`
    );

    successMessage.value =
      'User deleted successfully';

    deleteDialogVisible.value = false;
    selectedUser.value = null;

    if (
      users.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1;
    }

    await fetchUsers();
  } catch (error) {
    console.error(
      'Delete user error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      'Could not delete user';

    deleteDialogVisible.value = false;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div
    class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6"
  >
    <Card>
      <template #title>
        <div
          class="flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700"
            >
              <i class="pi pi-user-edit"></i>
            </div>

            <h1
              class="text-xl font-bold sm:text-2xl"
            >
              Users
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
          class="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_190px_auto]"
        >
          <InputText
            v-model="search"
            class="w-full"
            placeholder="Search name or email..."
            @keyup.enter="applyFilter"
          />

          <Select
            v-model="filterRole"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All roles"
            class="w-full"
            showClear
          />

          <div
            class="grid grid-cols-2 gap-2 sm:flex"
          >
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
            <i
              class="pi pi-spin pi-spinner text-2xl text-primary"
            ></i>
          </div>

          <article
            v-for="user in users"
            v-else
            :key="getUserId(user)"
            class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div
              class="flex items-start justify-between gap-3"
            >
              <div class="min-w-0">
                <h2
                  class="truncate text-lg font-bold"
                >
                  {{ user.name || '-' }}
                </h2>

                <div
                  class="mt-1 break-all text-sm text-gray-500"
                >
                  {{ user.email || '-' }}
                </div>
              </div>

              <Tag
                :value="getRoleLabel(user.role)"
                :severity="getRoleSeverity(user.role)"
              />
            </div>

            <div
              class="mt-3 rounded-lg bg-gray-50 p-3"
            >
              <div class="text-xs text-gray-500">
                Created
              </div>

              <div class="mt-1 text-sm font-medium">
                {{ formatDate(user.createdAt) }}
              </div>
            </div>

            <div
              class="mt-3 grid grid-cols-2 gap-2"
            >
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="info"
                outlined
                @click="openEditDialog(user)"
              />

              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="openDeleteDialog(user)"
              />
            </div>
          </article>

          <div
            v-if="!loading && !users.length"
            class="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500"
          >
            No users found.
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
              :disabled="
                page <= 1 ||
                loading
              "
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
              :disabled="
                page >= totalPages ||
                loading
              "
              @click="goToNextPage"
            />
          </div>
        </div>

        <!-- Desktop table -->
        <div class="hidden md:block">
          <DataTable
            :value="users"
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
              field="name"
              header="Name"
              style="min-width: 170px"
            >
              <template #body="{ data }">
                <span class="font-semibold">
                  {{ data.name }}
                </span>
              </template>
            </Column>

            <Column
              field="email"
              header="Email"
              style="min-width: 220px"
            />

            <Column
              field="role"
              header="Role"
              style="min-width: 140px"
            >
              <template #body="{ data }">
                <Tag
                  :value="getRoleLabel(data.role)"
                  :severity="getRoleSeverity(data.role)"
                />
              </template>
            </Column>

            <Column
              field="createdAt"
              header="Created"
              style="min-width: 180px"
            >
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
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
              <div
                class="py-8 text-center text-gray-500"
              >
                No users found.
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add/Edit user -->
    <Dialog
      v-model:visible="formDialogVisible"
      modal
      :header="
        isEditMode
          ? 'Edit User'
          : 'Add User'
      "
      :style="{
        width: '95vw',
        maxWidth: '580px'
      }"
      :closable="!saving"
      :draggable="false"
      class="user-form-dialog"
    >
      <div class="space-y-4">
        <Message
          v-if="errorMessage"
          severity="error"
        >
          {{ errorMessage }}
        </Message>

        <div>
          <label
            class="mb-1 block text-sm font-medium"
          >
            Name
          </label>

          <InputText
            v-model="form.name"
            class="w-full"
            placeholder="Enter name"
            autocomplete="name"
          />
        </div>

        <div>
          <label
            class="mb-1 block text-sm font-medium"
          >
            Email
          </label>

          <InputText
            v-model="form.email"
            type="email"
            class="w-full"
            placeholder="Enter email"
            autocomplete="email"
          />
        </div>

        <div>
          <label
            class="mb-1 block text-sm font-medium"
          >
            Password
          </label>

          <Password
            v-model="form.password"
            class="w-full"
            input-class="w-full"
            :placeholder="
              isEditMode
                ? 'Leave blank to keep current password'
                : 'Enter password'
            "
            :feedback="!isEditMode"
            toggleMask
            autocomplete="new-password"
          />

          <div
            v-if="isEditMode"
            class="mt-1 text-xs text-gray-500"
          >
            Leave password empty when it should not be changed.
          </div>
        </div>

        <div>
          <label
            class="mb-1 block text-sm font-medium"
          >
            Role
          </label>

          <Select
            v-model="form.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select role"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div
          class="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end"
        >
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            :disabled="saving"
            @click="closeFormDialog"
          />

          <Button
            :label="
              isEditMode
                ? 'Update'
                : 'Create'
            "
            icon="pi pi-save"
            :loading="saving"
            @click="saveUser"
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete confirmation -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Delete User"
      :style="{
        width: '94vw',
        maxWidth: '420px'
      }"
      :closable="!deleting"
      :draggable="false"
    >
      <div>
        <p>
          Delete
          <strong>
            {{ selectedUser?.name }}
          </strong>
          ?
        </p>

        <p class="mt-2 text-sm text-gray-500">
          This user will no longer be able to sign in.
        </p>
      </div>

      <template #footer>
        <div
          class="grid w-full grid-cols-2 gap-2"
        >
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
            @click="confirmDeleteUser"
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
:deep(.p-password),
:deep(.p-password-input),
:deep(.p-button) {
  min-height: 44px;
}

:deep(.p-password) {
  width: 100%;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 1.5rem;
  }
}
</style>

<style>
@media (max-width: 639px) {
  .user-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .user-form-dialog .p-dialog-content {
    overflow-y: auto;
  }
}
</style>