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

const products = ref([]);
const categories = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedProduct = ref(null);

const errorMessage = ref('');
const successMessage = ref('');

const search = ref('');
const filterCategoryId = ref(null);
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
  categoryId: null,
  name: '',
  winMultiplier: 1,
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

const categoryOptions = computed(() => {
  return categories.value.map((category) => ({
    label: category.name,
    value: category.id || category._id
  }));
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

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value.id || value._id || null;
  }

  return value;
};

const getProductId = (product) => {
  return product?.id || product?._id || null;
};

const getCategoryName = (product) => {
  if (
    product?.category &&
    typeof product.category === 'object'
  ) {
    return product.category.name || '-';
  }

  if (
    product?.categoryId &&
    typeof product.categoryId === 'object'
  ) {
    return product.categoryId.name || '-';
  }

  const categoryId = getId(
    product?.categoryId ||
    product?.category
  );

  const category = categories.value.find((item) => {
    return String(item.id || item._id) === String(categoryId);
  });

  return category?.name || '-';
};

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
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
      limit: 500,
      status: true
    }
  });

  categories.value = extractArrayData(response, [
    'categories',
    'items',
    'results'
  ]);
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

    products.value = extractArrayData(response, [
      'products',
      'items',
      'results'
    ]);

    totalRecords.value = extractTotalRecords(
      response,
      products.value.length
    );
  } catch (error) {
    console.error('Fetch products error:', error);

    products.value = [];

    errorMessage.value =
      error.response?.data?.message ||
      'Could not fetch products';
  } finally {
    loading.value = false;
  }
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

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;

  fetchProducts();
};

const goToPreviousPage = () => {
  if (loading.value || page.value <= 1) {
    return;
  }

  page.value -= 1;
  fetchProducts();
};

const goToNextPage = () => {
  if (
    loading.value ||
    page.value >= totalPages.value
  ) {
    return;
  }

  page.value += 1;
  fetchProducts();
};

const openCreateDialog = () => {
  clearMessages();
  resetForm();

  isEditMode.value = false;
  formDialogVisible.value = true;
};

const openEditDialog = (product) => {
  clearMessages();

  form.value = {
    id: getProductId(product),
    categoryId: getId(
      product.categoryId ||
      product.category
    ),
    name: product.name || '',
    winMultiplier: Number(
      product.winMultiplier ?? 1
    ),
    description: product.description || '',
    status: product.status !== false
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
  if (!form.value.categoryId) {
    return 'Category is required';
  }

  if (!form.value.name.trim()) {
    return 'Product name is required';
  }

  if (
    form.value.winMultiplier === null ||
    form.value.winMultiplier === undefined
  ) {
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
        `/products/${form.value.id}`,
        payload
      );

      successMessage.value =
        'Product updated successfully';
    } else {
      await api.post('/products', payload);

      successMessage.value =
        'Product created successfully';
    }

    formDialogVisible.value = false;
    resetForm();

    await fetchProducts();
  } catch (error) {
    console.error('Save product error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      'Could not save product';
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (product) => {
  clearMessages();

  selectedProduct.value = product;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
  selectedProduct.value = null;
};

const confirmDeleteProduct = async () => {
  if (!selectedProduct.value) {
    return;
  }

  try {
    deleting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const productId = getProductId(
      selectedProduct.value
    );

    await api.delete(`/products/${productId}`);

    successMessage.value =
      'Product deleted successfully';

    deleteDialogVisible.value = false;
    selectedProduct.value = null;

    if (
      products.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1;
    }

    await fetchProducts();
  } catch (error) {
    console.error('Delete product error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      'Could not delete product';

    deleteDialogVisible.value = false;
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  try {
    await fetchCategories();
    await fetchProducts();
  } catch (error) {
    console.error('Product page load error:', error);

    errorMessage.value =
      error.response?.data?.message ||
      'Could not load product page';
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6">
    <Card>
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600"
            >
              <i class="pi pi-box"></i>
            </div>

            <h1 class="text-xl font-bold sm:text-2xl">
              Products
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
          class="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_200px_170px_auto]"
        >
          <InputText
            v-model="search"
            class="w-full"
            placeholder="Search product..."
            @keyup.enter="applyFilter"
          />

          <Select
            v-model="filterCategoryId"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All categories"
            class="w-full"
            showClear
            filter
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
            v-for="product in products"
            v-else
            :key="getProductId(product)"
            class="rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold">
                  {{ product.name }}
                </h2>

                <div class="mt-1 text-sm text-gray-500">
                  {{ getCategoryName(product) }}
                </div>
              </div>

              <Tag
                :value="product.status ? 'Active' : 'Inactive'"
                :severity="product.status ? 'success' : 'danger'"
              />
            </div>

            <div class="mt-3 rounded-lg bg-gray-50 p-3">
              <div class="text-xs text-gray-500">
                Win Multiplier
              </div>

              <div class="mt-1 text-lg font-bold text-orange-600">
                {{ product.winMultiplier ?? 0 }}
              </div>
            </div>

            <p
              v-if="product.description"
              class="mt-3 line-clamp-2 text-sm text-gray-500"
            >
              {{ product.description }}
            </p>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="info"
                outlined
                @click="openEditDialog(product)"
              />

              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="openDeleteDialog(product)"
              />
            </div>
          </article>

          <div
            v-if="!loading && !products.length"
            class="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500"
          >
            No products found.
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
            :value="products"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="id"
            :rows="limit"
            :first="(page - 1) * limit"
            :totalRecords="totalRecords"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 900px"
            @page="onPageChange"
          >
            <Column
              field="name"
              header="Product"
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
              header="Multiplier"
              style="min-width: 120px"
            />

            <Column
              field="description"
              header="Description"
              style="min-width: 220px"
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
                No products found.
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="formDialogVisible"
      modal
      :header="isEditMode ? 'Edit Product' : 'Add Product'"
      :style="{
        width: '95vw',
        maxWidth: '620px'
      }"
      :closable="!saving"
      :draggable="false"
      class="product-form-dialog"
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
            filter
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">
            Product Name
          </label>

          <InputText
            v-model="form.name"
            class="w-full"
            placeholder="Enter product name"
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
            @click="saveProduct"
          />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Delete Product"
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
            {{ selectedProduct?.name }}
          </strong>
          ?
        </p>

        <p class="mt-2 text-sm text-gray-500">
          A product assigned to a play cannot be deleted.
        </p>
      </div>

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
            @click="confirmDeleteProduct"
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
  .product-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
}
</style>