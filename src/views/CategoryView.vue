<script setup>
import {
  computed,
  onMounted,
  ref
} from "vue";

import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";

import api from "../services/api";

const { t, locale } = useI18n();

const categories = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedCategory = ref(null);

const errorMessage = ref("");
const successMessage = ref("");

const search = ref("");
const filterStatus = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

const form = ref({
  id: null,
  name: "",
  description: "",
  status: true
});

const statusOptions = computed(() => {
  return [
    {
      label: t(
        "category.status.active"
      ),
      value: true
    },
    {
      label: t(
        "category.status.inactive"
      ),
      value: false
    }
  ];
});

const totalPages = computed(() => {
  return Math.max(
    Math.ceil(
      Number(
        totalRecords.value || 0
      ) /
        Number(
          limit.value || 10
        )
    ),
    1
  );
});

const extractArrayData = (
  response,
  keys = []
) => {
  if (
    Array.isArray(
      response.data?.data
    )
  ) {
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
    response.data?.data?.pagination
      ?.total ??
    response.data?.data?.total ??
    response.data?.total ??
    fallback
  );
};

const getCategoryId = (
  category
) => {
  return (
    category?.id ||
    category?._id ||
    null
  );
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const dateLocale =
    locale.value === "km"
      ? "km-KH"
      : "en-GB";

  return date.toLocaleString(
    dateLocale,
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
};

const getStatusLabel = (
  status
) => {
  return status
    ? t(
        "category.status.active"
      )
    : t(
        "category.status.inactive"
      );
};

const getStatusSeverity = (
  status
) => {
  return status
    ? "success"
    : "danger";
};

const getApiErrorMessage = (
  error,
  fallbackKey
) => {
  return (
    error.response?.data?.message ||
    t(fallbackKey)
  );
};

const clearMessages = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const resetForm = () => {
  form.value = {
    id: null,
    name: "",
    description: "",
    status: true
  };
};

const fetchCategories =
  async () => {
    try {
      loading.value = true;
      errorMessage.value = "";

      const params = {
        page: page.value,
        limit: limit.value
      };

      if (
        search.value.trim()
      ) {
        params.search =
          search.value.trim();
      }

      if (
        filterStatus.value !==
        null
      ) {
        params.status =
          filterStatus.value;
      }

      const response =
        await api.get(
          "/categories",
          {
            params
          }
        );

      categories.value =
        extractArrayData(
          response,
          [
            "categories",
            "items",
            "results"
          ]
        );

      totalRecords.value =
        extractTotalRecords(
          response,
          categories.value.length
        );
    } catch (error) {
      console.error(
        "Fetch categories error:",
        error
      );

      categories.value = [];

      errorMessage.value =
        getApiErrorMessage(
          error,
          "category.errors.fetch"
        );
    } finally {
      loading.value = false;
    }
  };

const applyFilter = () => {
  page.value = 1;

  fetchCategories();
};

const clearFilter = () => {
  search.value = "";
  filterStatus.value = null;
  page.value = 1;

  fetchCategories();
};

const onPageChange = (
  event
) => {
  page.value =
    event.page + 1;

  limit.value =
    event.rows;

  fetchCategories();
};

const goToPreviousPage =
  () => {
    if (
      loading.value ||
      page.value <= 1
    ) {
      return;
    }

    page.value -= 1;

    fetchCategories();
  };

const goToNextPage = () => {
  if (
    loading.value ||
    page.value >=
      totalPages.value
  ) {
    return;
  }

  page.value += 1;

  fetchCategories();
};

const openCreateDialog =
  () => {
    clearMessages();
    resetForm();

    isEditMode.value = false;
    formDialogVisible.value =
      true;
  };

const openEditDialog = (
  category
) => {
  clearMessages();

  form.value = {
    id: getCategoryId(
      category
    ),

    name:
      category.name || "",

    description:
      category.description ||
      "",

    status:
      category.status !== false
  };

  isEditMode.value = true;
  formDialogVisible.value =
    true;
};

const closeFormDialog =
  () => {
    if (saving.value) {
      return;
    }

    formDialogVisible.value =
      false;

    resetForm();
  };

const validateForm = () => {
  if (
    !form.value.name.trim()
  ) {
    return t(
      "category.errors.nameRequired"
    );
  }

  return "";
};

const buildPayload = () => {
  return {
    name:
      form.value.name.trim(),

    description:
      form.value.description.trim(),

    status:
      Boolean(
        form.value.status
      )
  };
};

const saveCategory =
  async () => {
    try {
      errorMessage.value = "";
      successMessage.value = "";

      const validationError =
        validateForm();

      if (validationError) {
        errorMessage.value =
          validationError;

        return;
      }

      saving.value = true;

      const payload =
        buildPayload();

      if (isEditMode.value) {
        await api.put(
          `/categories/${form.value.id}`,
          payload
        );

        successMessage.value =
          t(
            "category.messages.updated"
          );
      } else {
        await api.post(
          "/categories",
          payload
        );

        successMessage.value =
          t(
            "category.messages.created"
          );
      }

      formDialogVisible.value =
        false;

      resetForm();

      await fetchCategories();
    } catch (error) {
      console.error(
        "Save category error:",
        error
      );

      errorMessage.value =
        getApiErrorMessage(
          error,
          "category.errors.save"
        );
    } finally {
      saving.value = false;
    }
  };

const openDeleteDialog = (
  category
) => {
  clearMessages();

  selectedCategory.value =
    category;

  deleteDialogVisible.value =
    true;
};

const closeDeleteDialog =
  () => {
    if (deleting.value) {
      return;
    }

    deleteDialogVisible.value =
      false;

    selectedCategory.value =
      null;
  };

const confirmDeleteCategory =
  async () => {
    if (
      !selectedCategory.value
    ) {
      return;
    }

    try {
      deleting.value = true;
      errorMessage.value = "";
      successMessage.value = "";

      const categoryId =
        getCategoryId(
          selectedCategory.value
        );

      if (!categoryId) {
        errorMessage.value =
          t(
            "category.errors.idMissing"
          );

        return;
      }

      await api.delete(
        `/categories/${categoryId}`
      );

      successMessage.value =
        t(
          "category.messages.deleted"
        );

      deleteDialogVisible.value =
        false;

      selectedCategory.value =
        null;

      if (
        categories.value.length ===
          1 &&
        page.value > 1
      ) {
        page.value -= 1;
      }

      await fetchCategories();
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      errorMessage.value =
        getApiErrorMessage(
          error,
          "category.errors.delete"
        );

      deleteDialogVisible.value =
        false;
    } finally {
      deleting.value = false;
    }
  };

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div
    class="
      mx-auto
      w-full
      max-w-7xl
      p-2
      sm:p-4
      lg:p-6
    "
  >
    <Card>
      <template #title>
        <div
          class="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div
            class="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              class="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-violet-100
                text-violet-600
              "
            >
              <i
                class="
                  pi
                  pi-tags
                "
              ></i>
            </div>

            <h1
              class="
                truncate
                text-xl
                font-bold
                sm:text-2xl
              "
            >
              {{
                t(
                  "category.title"
                )
              }}
            </h1>
          </div>

          <Button
            :label="
              t('category.add')
            "
            icon="pi pi-plus"
            size="small"
            @click="
              openCreateDialog
            "
          />
        </div>
      </template>

      <template #content>
        <Message
          v-if="errorMessage"
          severity="error"
          class="mb-3"
          closable
          @close="
            errorMessage = ''
          "
        >
          {{ errorMessage }}
        </Message>

        <Message
          v-if="successMessage"
          severity="success"
          class="mb-3"
          closable
          @close="
            successMessage = ''
          "
        >
          {{ successMessage }}
        </Message>

        <!-- Filters -->

        <div
          class="
            mb-4
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-[1fr_180px_auto]
          "
        >
          <InputText
            v-model="search"
            class="w-full"
            :placeholder="
              t(
                'category.searchPlaceholder'
              )
            "
            @keyup.enter="
              applyFilter
            "
          />

          <Select
            v-model="
              filterStatus
            "
            :options="
              statusOptions
            "
            optionLabel="label"
            optionValue="value"
            :placeholder="
              t(
                'category.allStatuses'
              )
            "
            class="w-full"
            showClear
          />

          <div
            class="
              grid
              grid-cols-2
              gap-2
              sm:flex
            "
          >
            <Button
              :label="
                t(
                  'category.search'
                )
              "
              icon="pi pi-search"
              @click="
                applyFilter
              "
            />

            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :aria-label="
                t(
                  'category.reset'
                )
              "
              :title="
                t(
                  'category.reset'
                )
              "
              @click="
                clearFilter
              "
            />
          </div>
        </div>

        <!-- Smartphone cards -->

        <div
          class="
            space-y-3
            md:hidden
          "
        >
          <div
            v-if="loading"
            class="
              py-10
              text-center
            "
          >
            <i
              class="
                pi
                pi-spin
                pi-spinner
                text-2xl
                text-primary
              "
            ></i>
          </div>

          <template v-else>
            <article
              v-for="
                category in categories
              "
              :key="
                getCategoryId(
                  category
                )
              "
              class="
                rounded-xl
                border
                border-gray-200
                bg-white
                p-4
                shadow-sm
              "
            >
              <div
                class="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >
                <div class="min-w-0">
                  <h2
                    class="
                      truncate
                      text-lg
                      font-bold
                    "
                  >
                    {{
                      category.name ||
                      "-"
                    }}
                  </h2>
                </div>

                <Tag
                  :value="
                    getStatusLabel(
                      category.status
                    )
                  "
                  :severity="
                    getStatusSeverity(
                      category.status
                    )
                  "
                />
              </div>

              <p
                v-if="
                  category.description
                "
                class="
                  mt-3
                  line-clamp-3
                  text-sm
                  text-gray-500
                "
              >
                {{
                  category.description
                }}
              </p>

              <div
                class="
                  mt-3
                  rounded-lg
                  bg-gray-50
                  p-3
                "
              >
                <div
                  class="
                    text-xs
                    text-gray-500
                  "
                >
                  {{
                    t(
                      "category.created"
                    )
                  }}
                </div>

                <div
                  class="
                    mt-1
                    text-sm
                    font-medium
                  "
                >
                  {{
                    formatDate(
                      category.createdAt
                    )
                  }}
                </div>
              </div>

              <div
                class="
                  mt-4
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                <Button
                  :label="
                    t(
                      'category.edit'
                    )
                  "
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  @click="
                    openEditDialog(
                      category
                    )
                  "
                />

                <Button
                  :label="
                    t(
                      'category.delete'
                    )
                  "
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="
                    openDeleteDialog(
                      category
                    )
                  "
                />
              </div>
            </article>

            <div
              v-if="
                !categories.length
              "
              class="
                rounded-xl
                border
                border-dashed
                border-gray-300
                py-10
                text-center
                text-gray-500
              "
            >
              {{
                t(
                  "category.noCategories"
                )
              }}
            </div>
          </template>

          <div
            v-if="
              totalRecords > 0
            "
            class="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-gray-200
              p-2
            "
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
              @click="
                goToPreviousPage
              "
            />

            <span
              class="
                text-sm
                font-medium
              "
            >
              {{
                t(
                  "category.pageOf",
                  {
                    page,
                    total:
                      totalPages
                  }
                )
              }}
            </span>

            <Button
              icon="pi pi-chevron-right"
              severity="secondary"
              text
              rounded
              :disabled="
                page >=
                  totalPages ||
                loading
              "
              @click="
                goToNextPage
              "
            />
          </div>
        </div>

        <!-- Desktop table -->

        <div
          class="
            hidden
            md:block
          "
        >
          <DataTable
            :value="categories"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="id"
            :rows="limit"
            :first="
              (page - 1) *
              limit
            "
            :totalRecords="
              totalRecords
            "
            :rowsPerPageOptions="
              [5, 10, 20, 50]
            "
            tableStyle="
              min-width: 780px
            "
            @page="
              onPageChange
            "
          >
            <Column
              field="name"
              :header="
                t(
                  'category.columns.name'
                )
              "
              style="
                min-width: 180px
              "
            >
              <template
                #body="{ data }"
              >
                <span
                  class="font-semibold"
                >
                  {{
                    data.name ||
                    "-"
                  }}
                </span>
              </template>
            </Column>

            <Column
              field="description"
              :header="
                t(
                  'category.columns.description'
                )
              "
              style="
                min-width: 260px
              "
            >
              <template
                #body="{ data }"
              >
                {{
                  data.description ||
                  "-"
                }}
              </template>
            </Column>

            <Column
              :header="
                t(
                  'category.columns.status'
                )
              "
              style="
                min-width: 120px
              "
            >
              <template
                #body="{ data }"
              >
                <Tag
                  :value="
                    getStatusLabel(
                      data.status
                    )
                  "
                  :severity="
                    getStatusSeverity(
                      data.status
                    )
                  "
                />
              </template>
            </Column>

            <Column
              field="createdAt"
              :header="
                t(
                  'category.columns.created'
                )
              "
              style="
                min-width: 180px
              "
            >
              <template
                #body="{ data }"
              >
                {{
                  formatDate(
                    data.createdAt
                  )
                }}
              </template>
            </Column>

            <Column
              :header="
                t(
                  'category.columns.action'
                )
              "
              frozen
              alignFrozen="right"
              style="
                min-width: 120px
              "
            >
              <template
                #body="{ data }"
              >
                <div
                  class="
                    flex
                    gap-2
                  "
                >
                  <Button
                    icon="pi pi-pencil"
                    size="small"
                    severity="info"
                    :aria-label="
                      t(
                        'category.edit'
                      )
                    "
                    :title="
                      t(
                        'category.edit'
                      )
                    "
                    @click="
                      openEditDialog(
                        data
                      )
                    "
                  />

                  <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    :aria-label="
                      t(
                        'category.delete'
                      )
                    "
                    :title="
                      t(
                        'category.delete'
                      )
                    "
                    @click="
                      openDeleteDialog(
                        data
                      )
                    "
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div
                class="
                  py-8
                  text-center
                  text-gray-500
                "
              >
                {{
                  t(
                    "category.noCategories"
                  )
                }}
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add/Edit Category -->

    <Dialog
      v-model:visible="
        formDialogVisible
      "
      modal
      :header="
        isEditMode
          ? t(
              'category.dialogs.editTitle'
            )
          : t(
              'category.dialogs.addTitle'
            )
      "
      :style="{
        width: '95vw',
        maxWidth: '580px'
      }"
      :closable="!saving"
      :draggable="false"
      class="category-form-dialog"
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
            class="
              mb-1
              block
              text-sm
              font-medium
            "
          >
            {{
              t(
                "category.fields.name"
              )
            }}
          </label>

          <InputText
            v-model="form.name"
            class="w-full"
            :placeholder="
              t(
                'category.placeholders.name'
              )
            "
          />
        </div>

        <div>
          <label
            class="
              mb-1
              block
              text-sm
              font-medium
            "
          >
            {{
              t(
                "category.fields.description"
              )
            }}
          </label>

          <Textarea
            v-model="
              form.description
            "
            class="w-full"
            rows="4"
            :placeholder="
              t(
                'category.placeholders.description'
              )
            "
            autoResize
          />
        </div>

        <div
          class="
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-gray-200
            p-3
          "
        >
          <div>
            <div
              class="font-medium"
            >
              {{
                t(
                  "category.fields.status"
                )
              }}
            </div>

            <div
              class="
                mt-1
                text-xs
                text-gray-500
              "
            >
              {{
                getStatusLabel(
                  form.status
                )
              }}
            </div>
          </div>

          <ToggleSwitch
            v-model="
              form.status
            "
          />
        </div>
      </div>

      <template #footer>
        <div
          class="
            grid
            w-full
            grid-cols-2
            gap-2
            sm:flex
            sm:justify-end
          "
        >
          <Button
            :label="
              t(
                'category.cancel'
              )
            "
            severity="secondary"
            outlined
            :disabled="saving"
            @click="
              closeFormDialog
            "
          />

          <Button
            :label="
              isEditMode
                ? t(
                    'category.update'
                  )
                : t(
                    'category.create'
                  )
            "
            icon="pi pi-save"
            :loading="saving"
            @click="
              saveCategory
            "
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete confirmation -->

    <Dialog
      v-model:visible="
        deleteDialogVisible
      "
      modal
      :header="
        t(
          'category.dialogs.deleteTitle'
        )
      "
      :style="{
        width: '94vw',
        maxWidth: '420px'
      }"
      :closable="!deleting"
      :draggable="false"
    >
      <div>
        <p>
          {{
            t(
              "category.deleteQuestion",
              {
                name:
                  selectedCategory
                    ?.name ||
                  "-"
              }
            )
          }}
        </p>

        <p
          class="
            mt-2
            text-sm
            text-gray-500
          "
        >
          {{
            t(
              "category.deleteWarning"
            )
          }}
        </p>
      </div>

      <template #footer>
        <div
          class="
            grid
            w-full
            grid-cols-2
            gap-2
          "
        >
          <Button
            :label="
              t(
                'category.cancel'
              )
            "
            severity="secondary"
            outlined
            :disabled="deleting"
            @click="
              closeDeleteDialog
            "
          />

          <Button
            :label="
              t(
                'category.delete'
              )
            "
            icon="pi pi-trash"
            severity="danger"
            :loading="deleting"
            @click="
              confirmDeleteCategory
            "
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
:deep(.p-textarea),
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
  .category-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .category-form-dialog
    .p-dialog-content {
    overflow-y: auto;
  }
}
</style>