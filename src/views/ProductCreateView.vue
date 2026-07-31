<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

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

const toast = useToast();

const products = ref([]);
const categories = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const isEditMode = ref(false);
const selectedDeleteProduct = ref(null);

const errorMessage = ref('');

const search = ref('');
const filterCategoryId = ref(null);
const filterStatus = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

const statusOptions = [
  {
    label: 'All',
    value: null
  },
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
  categoryId: null,
  name: '',
  winMultiplier: 1,
  description: '',
  status: true
});

const categoryOptions = computed(() => {
  return categories.value.map((category) => ({
    label: category.name,
    value: category.id || category._id
  }));
});

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value.id || value._id || null;
  }

  return value;
};

const getCategoryName = (product) => {
  if (product.category && typeof product.category === 'object') {
    return product.category.name || '-';
  }

  if (product.categoryId && typeof product.categoryId === 'object') {
    return product.categoryId.name || '-';
  }

  return '-';
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
};

const resetForm = () => {
  form.value = {
    id: null,
    categoryId: null,
    name: '',
    winMultiplier: 1,
    description: '',
    status: true
  };
};

const fetchCategories = async () => {
  const response = await api.get('/categories', {
    params: {
      page: 1,
      limit: 100,
      status: true
    }
  });

  categories.value = response.data.data || [];
};

const fetchProducts = async () => {
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

    if (filterCategoryId.value) {
      params.categoryId = filterCategoryId.value;
    }

    if (filterStatus.value !== null) {
      params.status = filterStatus.value;
    }

    const response = await api.get('/products', {
      params
    });

    products.value = response.data.data || [];
    totalRecords.value = response.data.pagination?.total || 0;
  } catch (error) {
    console.error('Fetch products error:', error);
    errorMessage.value =
      error.response?.data?.message || 'Could not fetch products';
  } finally {
    loading.value = false;
  }
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;
  fetchProducts();
};

const applyFilter = () => {
  page.value = 1;
  fetchProducts();
};

const clearFilter = () => {
  search.value = '';
  filterCategoryId.value = null;
  filterStatus.value = null;
  page.value = 1;
  fetchProducts();
};

const openCreateDialog = () => {
  errorMessage.value = '';
  resetForm();
  isEditMode.value = false;
  dialogVisible.value = true;
};

const openEditDialog = (product) => {
  errorMessage.value = '';

  form.value = {
    id: product.id || product._id,
    categoryId: getId(product.category || product.categoryId),
    name: product.name || '',
    winMultiplier: product.winMultiplier || 1,
    description: product.description || '',
    status: product.status !== false
  };

  isEditMode.value = true;
  dialogVisible.value = true;
};

const validateForm = () => {
  if (!form.value.categoryId) {
    return 'Category is required';
  }

  if (!form.value.name || !form.value.name.trim()) {
    return 'Product name is required';
  }

  if (form.value.winMultiplier === null || form.value.winMultiplier === undefined) {
    return 'Win multiplier is required';
  }

  if (Number(form.value.winMultiplier) < 0) {
    return 'Win multiplier cannot be negative';
  }

  return '';
};

const buildPayload = () => {
  return {
    categoryId: form.value.categoryId,
    name: form.value.name.trim(),
    winMultiplier: Number(form.value.winMultiplier),
    description: form.value.description.trim(),
    status: Boolean(form.value.status)
  };
};

const saveProduct = async () => {
  try {
    errorMessage.value = '';

    const validationError = validateForm();

    if (validationError) {
      errorMessage.value = validationError;
      return;
    }

    saving.value = true;

    const payload = buildPayload();

    if (isEditMode.value) {
      await api.put(`/products/${form.value.id}`, payload);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product updated successfully',
        life: 2500
      });
    } else {
      await api.post('/products', payload);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product created successfully',
        life: 2500
      });
    }

    dialogVisible.value = false;
    await fetchProducts();
  } catch (error) {
    console.error('Save product error:', error);

    errorMessage.value =
      error.response?.data?.message || 'Could not save product';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage.value,
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (product) => {
  errorMessage.value = '';
  selectedDeleteProduct.value = product;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
  selectedDeleteProduct.value = null;
};

const confirmDeleteProduct = async () => {
  if (!selectedDeleteProduct.value) {
    return;
  }

  try {
    deleting.value = true;
    errorMessage.value = '';

    await api.delete(
      `/products/${selectedDeleteProduct.value.id || selectedDeleteProduct.value._id}`
    );

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Product deleted successfully',
      life: 2500
    });

    deleteDialogVisible.value = false;
    selectedDeleteProduct.value = null;

    await fetchProducts();
  } catch (error) {
    console.error('Delete product error:', error);

    errorMessage.value =
      error.response?.data?.message || 'Could not delete product';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage.value,
      life: 3000
    });
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  try {
    await fetchCategories();
    await fetchProducts();
  } catch (error) {
    console.error('Initial load error:', error);
    errorMessage.value =
      error.response?.data?.message || 'Could not load product page';
  }
});
</script>

<template>
  <div class="p-3 sm:p-4 lg:p-6">
    <Card>
      <template #title>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-box text-xl"></i>
            <span>Product List</span>
          </div>

          <Button
            label="Add Product"
            icon="pi pi-plus"
            class="w-full sm:w-auto"
            @click="openCreateDialog"
          />
        </div>
      </template>

      <template #content>
        <Message
          v-if="errorMessage"
          severity="error"
          class="mb-4"
        >
          {{ errorMessage }}
        </Message>

        <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InputText
            v-model="search"
            placeholder="Search product..."
            class="w-full"
            @keyup.enter="applyFilter"
          />

          <Select
            v-model="filterCategoryId"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Category"
            class="w-full"
            showClear
          />

          <Select
            v-model="filterStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            class="w-full"
          />

          <div class="flex gap-2">
            <Button
              label="Search"
              icon="pi pi-search"
              class="w-full"
              @click="applyFilter"
            />

            <Button
              icon="pi pi-times"
              severity="secondary"
              @click="clearFilter"
            />
          </div>
        </div>

        <DataTable
          :value="products"
          :loading="loading"
          lazy
          paginator
          dataKey="id"
          :rows="limit"
          :totalRecords="totalRecords"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 760px"
          class="rounded-lg shadow-sm"
          @page="onPageChange"
        >
          <Column
            field="name"
            header="Product Name"
            style="min-width: 180px"
          />

          <Column
            header="Category"
            style="min-width: 160px"
          >
            <template #body="{ data }">
              {{ getCategoryName(data) }}
            </template>
          </Column>

          <Column
            field="winMultiplier"
            header="Win Multiplier"
            style="min-width: 140px"
          />

          <Column
            header="Status"
            style="min-width: 120px"
          >
            <template #body="{ data }">
              <Tag
                :value="data.status ? 'Active' : 'Inactive'"
                :severity="data.status ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column
            header="Created At"
            style="min-width: 180px"
          >
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column
            header="Action"
            style="min-width: 140px"
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
        </DataTable>
      </template>
    </Card>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="isEditMode ? 'Edit Product' : 'Create Product'"
      :style="{ width: '95vw', maxWidth: '600px' }"
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
            Category
          </label>

          <Select
            v-model="form.categoryId"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select category"
            class="w-full"
            showClear
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Product Name
          </label>

          <InputText
            v-model="form.name"
            class="w-full"
            placeholder="Product name"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Win Multiplier
          </label>

          <InputNumber
            v-model="form.winMultiplier"
            class="w-full"
            input-class="w-full"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="2"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Description
          </label>

          <Textarea
            v-model="form.description"
            rows="4"
            class="w-full"
            placeholder="Product description"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Status
          </label>

          <div class="flex items-center gap-3">
            <ToggleSwitch v-model="form.status" />

            <span>
              {{ form.status ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            label="Cancel"
            severity="secondary"
            class="w-full sm:w-auto"
            @click="dialogVisible = false"
          />

          <Button
            :label="isEditMode ? 'Update Product' : 'Create Product'"
            icon="pi pi-save"
            :loading="saving"
            class="w-full sm:w-auto"
            @click="saveProduct"
          />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Delete Product"
      :style="{ width: '95vw', maxWidth: '420px' }"
      :closable="!deleting"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
          <i class="pi pi-trash"></i>
        </div>

        <div>
          <div class="font-semibold text-gray-900">
            Delete this product?
          </div>

          <div class="mt-1 text-sm text-gray-500">
            {{ selectedDeleteProduct?.name }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            label="Cancel"
            severity="secondary"
            class="w-full sm:w-auto"
            :disabled="deleting"
            @click="closeDeleteDialog"
          />

          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            class="w-full sm:w-auto"
            :loading="deleting"
            @click="confirmDeleteProduct"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>