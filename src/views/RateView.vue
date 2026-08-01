<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";

import api from "../services/api";

const { t, locale } = useI18n();

const rates = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedRate = ref(null);

const errorMessage = ref("");
const successMessage = ref("");

const search = ref("");
const filterStatus = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

/*
|--------------------------------------------------------------------------
| Translated status options
|--------------------------------------------------------------------------
*/

const statusOptions = computed(() => {
  return [
    {
      label: t("rate.status.active"),
      value: true,
    },
    {
      label: t("rate.status.inactive"),
      value: false,
    },
  ];
});

const form = ref({
  id: null,
  name: "",
  number: null,
  description: "",
  status: true,
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

/*
|--------------------------------------------------------------------------
| Response helpers
|--------------------------------------------------------------------------
*/

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

const getRateId = (rate) => {
  return (
    rate?.id ||
    rate?._id ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Display helpers
|--------------------------------------------------------------------------
*/

const formatRateNumber = (value) => {
  const number = Number(value || 0);

  const numberLocale =
    locale.value === "km"
      ? "km-KH"
      : "en-US";

  return `${number.toLocaleString(
    numberLocale,
    {
      maximumFractionDigits: 2,
    }
  )}%`;
};

const getStatusLabel = (status) => {
  return status
    ? t("rate.status.active")
    : t("rate.status.inactive");
};

const getStatusSeverity = (status) => {
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
    number: null,
    description: "",
    status: true,
  };
};

/*
|--------------------------------------------------------------------------
| Fetch rates
|--------------------------------------------------------------------------
*/

const fetchRates = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const params = {
      page: page.value,
      limit: limit.value,
    };

    if (search.value.trim()) {
      params.search =
        search.value.trim();
    }

    if (
      filterStatus.value !== null
    ) {
      params.status =
        filterStatus.value;
    }

    const response = await api.get(
      "/rates",
      {
        params,
      }
    );

    rates.value =
      extractArrayData(
        response,
        [
          "rates",
          "items",
          "results",
        ]
      );

    totalRecords.value =
      extractTotalRecords(
        response,
        rates.value.length
      );
  } catch (error) {
    console.error(
      "Fetch rates error:",
      error
    );

    rates.value = [];

    errorMessage.value =
      getApiErrorMessage(
        error,
        "rate.errors.fetch"
      );
  } finally {
    loading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Filters and pagination
|--------------------------------------------------------------------------
*/

const applyFilter = () => {
  page.value = 1;

  fetchRates();
};

const clearFilter = () => {
  search.value = "";
  filterStatus.value = null;
  page.value = 1;

  fetchRates();
};

const onPageChange = (event) => {
  page.value =
    event.page + 1;

  limit.value =
    event.rows;

  fetchRates();
};

const goToPreviousPage = () => {
  if (
    loading.value ||
    page.value <= 1
  ) {
    return;
  }

  page.value -= 1;

  fetchRates();
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

  fetchRates();
};

/*
|--------------------------------------------------------------------------
| Form dialog
|--------------------------------------------------------------------------
*/

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

    name:
      rate.name || "",

    number:
      Number(rate.number || 0),

    description:
      rate.description || "",

    status:
      rate.status !== false,
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
  if (
    !form.value.name.trim()
  ) {
    return t(
      "rate.errors.nameRequired"
    );
  }

  if (
    form.value.number === null ||
    form.value.number === undefined
  ) {
    return t(
      "rate.errors.numberRequired"
    );
  }

  if (
    Number(form.value.number) < 0
  ) {
    return t(
      "rate.errors.numberNegative"
    );
  }

  return "";
};

const buildPayload = () => {
  return {
    name:
      form.value.name.trim(),

    number:
      Number(form.value.number),

    description:
      form.value.description.trim(),

    status:
      Boolean(form.value.status),
  };
};

const saveRate = async () => {
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
        `/rates/${form.value.id}`,
        payload
      );

      successMessage.value =
        t(
          "rate.messages.updated"
        );
    } else {
      await api.post(
        "/rates",
        payload
      );

      successMessage.value =
        t(
          "rate.messages.created"
        );
    }

    formDialogVisible.value = false;

    resetForm();

    await fetchRates();
  } catch (error) {
    console.error(
      "Save rate error:",
      error
    );

    errorMessage.value =
      getApiErrorMessage(
        error,
        "rate.errors.save"
      );
  } finally {
    saving.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Delete rate
|--------------------------------------------------------------------------
*/

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
    errorMessage.value = "";
    successMessage.value = "";

    const rateId =
      getRateId(
        selectedRate.value
      );

    if (!rateId) {
      errorMessage.value =
        t(
          "rate.errors.idMissing"
        );

      return;
    }

    await api.delete(
      `/rates/${rateId}`
    );

    successMessage.value =
      t(
        "rate.messages.deleted"
      );

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
    console.error(
      "Delete rate error:",
      error
    );

    errorMessage.value =
      getApiErrorMessage(
        error,
        "rate.errors.delete"
      );

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
  <div class="
      mx-auto
      w-full
      max-w-7xl
      p-2
      sm:p-4
      lg:p-6
    ">
    <Card>
      <template #title>
        <div class="
            flex
            items-center
            justify-between
            gap-3
          ">
          <div class="
              flex
              min-w-0
              items-center
              gap-3
            ">
            <div class="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-rose-100
                text-rose-600
              ">
              <i class="
                  pi
                  pi-percentage
                "></i>
            </div>

            <h1 class="
                truncate
                text-xl
                font-bold
                sm:text-2xl
              ">
              {{ t("rate.title") }}
            </h1>
          </div>

          <Button :label="t('rate.add')" icon="pi pi-plus" size="small" @click="openCreateDialog" />
        </div>
      </template>

      <template #content>
        <Message v-if="errorMessage" severity="error" class="mb-3" closable @close="
          errorMessage = ''
          ">
          {{ errorMessage }}
        </Message>

        <Message v-if="successMessage" severity="success" class="mb-3" closable @close="
          successMessage = ''
          ">
          {{ successMessage }}
        </Message>

        <!-- Filters -->

        <div class="
            mb-4
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-[1fr_180px_auto]
          ">
          <InputText v-model="search" class="w-full" :placeholder="t(
            'rate.searchPlaceholder'
          )
            " @keyup.enter="
              applyFilter
            " />

          <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" :placeholder="t(
            'rate.allStatuses'
          )
            " class="w-full" showClear />

          <div class="
              grid
              grid-cols-2
              gap-2
              sm:flex
            ">
            <Button :label="t('rate.search')
              " icon="pi pi-search" @click="applyFilter" />

            <Button icon="pi pi-refresh" severity="secondary" outlined :aria-label="t('rate.reset')
              " :title="t('rate.reset')
                " @click="clearFilter" />
          </div>
        </div>

        <!-- Smartphone cards -->

        <div class="
            space-y-3
            md:hidden
          ">
          <div v-if="loading" class="
              py-10
              text-center
            ">
            <i class="
                pi
                pi-spin
                pi-spinner
                text-2xl
                text-primary
              "></i>
          </div>

          <template v-else>
            <article v-for="rate in rates" :key="getRateId(rate)
              " class="
                rounded-xl
                border
                border-gray-200
                bg-white
                p-4
                shadow-sm
              ">
              <div class="
                  flex
                  items-start
                  justify-between
                  gap-3
                ">
                <div class="min-w-0">
                  <h2 class="
                      truncate
                      text-lg
                      font-bold
                    ">
                    {{
                      rate.name ||
                      "-"
                    }}
                  </h2>

                  <div class="
                      mt-2
                      text-3xl
                      font-extrabold
                      text-rose-600
                    ">
                    {{
                      formatRateNumber(
                        rate.number
                      )
                    }}
                  </div>
                </div>

                <Tag :value="getStatusLabel(
                  rate.status
                )
                  " :severity="getStatusSeverity(
                    rate.status
                  )
                    " />
              </div>

              <p v-if="rate.description" class="
                  mt-3
                  line-clamp-2
                  text-sm
                  text-gray-500
                ">
                {{ rate.description }}
              </p>

              <div class="
                  mt-4
                  grid
                  grid-cols-2
                  gap-2
                ">
                <Button :label="t('rate.edit')
                  " icon="pi pi-pencil" severity="info" outlined @click="
                    openEditDialog(
                      rate
                    )
                    " />

                <Button :label="t('rate.delete')
                  " icon="pi pi-trash" severity="danger" outlined @click="
                    openDeleteDialog(
                      rate
                    )
                    " />
              </div>
            </article>

            <div v-if="!rates.length" class="
                rounded-xl
                border
                border-dashed
                border-gray-300
                py-10
                text-center
                text-gray-500
              ">
              {{
                t(
                  "rate.noRates"
                )
              }}
            </div>
          </template>

          <div v-if="totalRecords > 0" class="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-gray-200
              p-2
            ">
            <Button icon="pi pi-chevron-left" severity="secondary" text rounded :disabled="page <= 1 ||
              loading
              " @click="
                goToPreviousPage
              " />

            <span class="
                text-sm
                font-medium
              ">
              {{
                t(
                  "rate.pageOf",
                  {
                    page,
                    total:
                      totalPages
                  }
                )
              }}
            </span>

            <Button icon="pi pi-chevron-right" severity="secondary" text rounded :disabled="page >=
              totalPages ||
              loading
              " @click="
                goToNextPage
              " />
          </div>
        </div>

        <!-- Desktop table -->

        <div class="
            hidden
            md:block
          ">
          <DataTable :value="rates" :loading="loading" lazy paginator dataKey="id" :rows="limit" :first="(page - 1) * limit
            " :totalRecords="totalRecords
              " :rowsPerPageOptions="[5, 10, 20, 50]
              " @page="onPageChange">
            <Column field="name" :header="t(
              'rate.columns.name'
            )
              " style="
                min-width: 180px
              ">
              <template #body="{ data }">
                {{
                  data.name ||
                  "-"
                }}
              </template>
            </Column>

            <Column field="number" :header="t(
              'rate.columns.rate'
            )
              " style="
                min-width: 120px
              ">
              <template #body="{ data }">
                <span class="
                    font-bold
                    text-rose-600
                  ">
                  {{
                    formatRateNumber(
                      data.number
                    )
                  }}
                </span>
              </template>
            </Column>

            <Column field="description" :header="t(
              'rate.columns.description'
            )
              " style="
                min-width: 240px
              ">
              <template #body="{ data }">
                {{
                  data.description ||
                  "-"
                }}
              </template>
            </Column>

            <Column :header="t(
              'rate.columns.status'
            )
              " style="
                min-width: 110px
              ">
              <template #body="{ data }">
                <Tag :value="getStatusLabel(
                  data.status
                )
                  " :severity="getStatusSeverity(
                    data.status
                  )
                    " />
              </template>
            </Column>

            <Column :header="t(
              'rate.columns.action'
            )
              " style="
                min-width: 120px
              ">
              <template #body="{ data }">
                <div class="
                    flex
                    gap-2
                  ">
                  <Button icon="pi pi-pencil" size="small" severity="info" :aria-label="t('rate.edit')
                    " :title="t('rate.edit')
                      " @click="
                      openEditDialog(
                        data
                      )
                      " />

                  <Button icon="pi pi-trash" size="small" severity="danger" :aria-label="t(
                    'rate.delete'
                  )
                    " :title="t(
                      'rate.delete'
                    )
                      " @click="
                      openDeleteDialog(
                        data
                      )
                      " />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="
                  py-8
                  text-center
                  text-gray-500
                ">
                {{
                  t(
                    "rate.noRates"
                  )
                }}
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add/Edit rate -->

    <Dialog v-model:visible="formDialogVisible
      " modal :header="isEditMode
          ? t(
            'rate.dialogs.editTitle'
          )
          : t(
            'rate.dialogs.addTitle'
          )
        " :style="{
        width: '95vw',
        maxWidth: '560px'
      }" :closable="!saving" :draggable="false" class="rate-form-dialog">
      <div class="space-y-4">
        <Message v-if="errorMessage" severity="error">
          {{ errorMessage }}
        </Message>

        <div>
          <label class="
              mb-1
              block
              text-sm
              font-medium
            ">
            {{
              t(
                "rate.fields.name"
              )
            }}
          </label>

          <InputText v-model="form.name" class="w-full" :placeholder="t(
            'rate.placeholders.name'
          )
            " />
        </div>

        <div>
          <label class="
              mb-1
              block
              text-sm
              font-medium
            ">
            {{
              t(
                "rate.fields.percentage"
              )
            }}
          </label>

          <InputNumber v-model="form.number" class="w-full" input-class="w-full" suffix="%" :min="0"
            :maxFractionDigits="2" />
        </div>

        <div>
          <label class="
              mb-1
              block
              text-sm
              font-medium
            ">
            {{
              t(
                "rate.fields.description"
              )
            }}
          </label>

          <Textarea v-model="form.description
            " class="w-full" rows="3" :placeholder="t(
              'rate.placeholders.description'
            )
              " autoResize />
        </div>

        <div class="
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-gray-200
            p-3
          ">
          <div>
            <div class="font-medium">
              {{
                t(
                  "rate.fields.status"
                )
              }}
            </div>

            <div class="
                mt-1
                text-xs
                text-gray-500
              ">
              {{
                getStatusLabel(
                  form.status
                )
              }}
            </div>
          </div>

          <ToggleSwitch v-model="form.status" />
        </div>
      </div>

      <template #footer>
        <div class="
            grid
            w-full
            grid-cols-2
            gap-2
            sm:flex
            sm:justify-end
          ">
          <Button :label="t('rate.cancel')
            " severity="secondary" outlined :disabled="saving" @click="
              closeFormDialog
            " />

          <Button :label="isEditMode
              ? t(
                'rate.update'
              )
              : t(
                'rate.create'
              )
            " icon="pi pi-save" :loading="saving" @click="saveRate" />
        </div>
      </template>
    </Dialog>

    <!-- Delete confirmation -->

    <Dialog v-model:visible="deleteDialogVisible
      " modal :header="t(
        'rate.dialogs.deleteTitle'
      )
        " :style="{
        width: '94vw',
        maxWidth: '420px'
      }" :closable="!deleting" :draggable="false">
      <div>
        <p>
          {{
            t(
              "rate.deleteQuestion",
              {
                name:
                  selectedRate?.name ||
                  "-"
              }
            )
          }}
        </p>

        <p class="
            mt-2
            text-sm
            text-gray-500
          ">
          {{
            t(
              "rate.deleteWarning"
            )
          }}
        </p>
      </div>

      <template #footer>
        <div class="
            grid
            w-full
            grid-cols-2
            gap-2
          ">
          <Button :label="t('rate.cancel')
            " severity="secondary" outlined :disabled="deleting" @click="
              closeDeleteDialog
            " />

          <Button :label="t('rate.delete')
            " icon="pi pi-trash" severity="danger" :loading="deleting" @click="
              confirmDeleteRate
            " />
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
:deep(.p-inputnumber-input),
:deep(.p-textarea),
:deep(.p-button) {
  min-height: 44px;
}

:deep(.p-inputnumber) {
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
  .rate-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .rate-form-dialog .p-dialog-content {
    overflow-y: auto;
  }
}
</style>