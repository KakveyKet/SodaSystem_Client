<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue';

import { useI18n } from 'vue-i18n';

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

const { t } = useI18n();

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

const statusOptions = computed(() => {
  return [
    {
      label: t(
        'customer.status.active'
      ),
      value: true
    },
    {
      label: t(
        'customer.status.inactive'
      ),
      value: false
    }
  ];
});

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

const getCustomerId = (
  customer
) => {
  return (
    customer?.id ||
    customer?._id ||
    null
  );
};

const formatBalance = (
  value
) => {
  return Number(
    value || 0
  ).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );
};

const getStatusLabel = (
  status
) => {
  return status
    ? t(
        'customer.status.active'
      )
    : t(
        'customer.status.inactive'
      );
};

const getStatusSeverity = (
  status
) => {
  return status
    ? 'success'
    : 'danger';
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

const fetchCustomers =
  async () => {
    try {
      loading.value = true;
      errorMessage.value = '';

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
          '/customers',
          {
            params
          }
        );

      customers.value =
        extractArrayData(
          response,
          [
            'customers',
            'items',
            'results'
          ]
        );

      totalRecords.value =
        extractTotalRecords(
          response,
          customers.value.length
        );
    } catch (error) {
      console.error(
        'Fetch customers error:',
        error
      );

      customers.value = [];

      errorMessage.value =
        getApiErrorMessage(
          error,
          'customer.errors.fetch'
        );
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

const onPageChange = (
  event
) => {
  page.value =
    event.page + 1;

  limit.value =
    event.rows;

  fetchCustomers();
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

    fetchCustomers();
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

  fetchCustomers();
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
  customer
) => {
  clearMessages();

  form.value = {
    id:
      getCustomerId(
        customer
      ),

    username:
      customer.username || '',

    branchId:
      customer.branchId || '',

    phoneNumber:
      customer.phoneNumber || '',

    address:
      customer.address || '',

    description:
      customer.description || '',

    percentages:
      Array.isArray(
        customer.percentages
      )
        ? customer.percentages
        : [],

    balance:
      Number(
        customer.balance || 0
      ),

    status:
      customer.status !== false
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
    !form.value.username.trim()
  ) {
    return t(
      'customer.errors.usernameRequired'
    );
  }

  if (
    !form.value.branchId.trim()
  ) {
    return t(
      'customer.errors.branchRequired'
    );
  }

  if (
    Number(
      form.value.balance || 0
    ) < 0
  ) {
    return t(
      'customer.errors.balanceNegative'
    );
  }

  return '';
};

const buildPayload = () => {
  return {
    username:
      form.value.username.trim(),

    branchId:
      form.value.branchId.trim(),

    phoneNumber:
      form.value.phoneNumber.trim(),

    address:
      form.value.address.trim(),

    description:
      form.value.description.trim(),

    percentages:
      form.value.percentages,

    balance:
      Number(
        form.value.balance || 0
      ),

    status:
      Boolean(
        form.value.status
      )
  };
};

const saveCustomer =
  async () => {
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

      const payload =
        buildPayload();

      if (isEditMode.value) {
        await api.put(
          `/customers/${form.value.id}`,
          payload
        );

        successMessage.value =
          t(
            'customer.messages.updated'
          );
      } else {
        await api.post(
          '/customers',
          payload
        );

        successMessage.value =
          t(
            'customer.messages.created'
          );
      }

      formDialogVisible.value =
        false;

      resetForm();

      await fetchCustomers();
    } catch (error) {
      console.error(
        'Save customer error:',
        error
      );

      errorMessage.value =
        getApiErrorMessage(
          error,
          'customer.errors.save'
        );
    } finally {
      saving.value = false;
    }
  };

const openDeleteDialog = (
  customer
) => {
  clearMessages();

  selectedCustomer.value =
    customer;

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

    selectedCustomer.value =
      null;
  };

const confirmDeleteCustomer =
  async () => {
    if (
      !selectedCustomer.value
    ) {
      return;
    }

    try {
      deleting.value = true;
      errorMessage.value = '';
      successMessage.value = '';

      const customerId =
        getCustomerId(
          selectedCustomer.value
        );

      if (!customerId) {
        errorMessage.value =
          t(
            'customer.errors.idMissing'
          );

        return;
      }

      await api.delete(
        `/customers/${customerId}`
      );

      successMessage.value =
        t(
          'customer.messages.deleted'
        );

      deleteDialogVisible.value =
        false;

      selectedCustomer.value =
        null;

      if (
        customers.value.length ===
          1 &&
        page.value > 1
      ) {
        page.value -= 1;
      }

      await fetchCustomers();
    } catch (error) {
      console.error(
        'Delete customer error:',
        error
      );

      errorMessage.value =
        getApiErrorMessage(
          error,
          'customer.errors.delete'
        );

      deleteDialogVisible.value =
        false;
           getApiErrorMessage(
          error,
          'customer.errors.delete'
        );

      deleteDialogVisible.value =
        false;
    } finally {
      deleting.value = false;
    }
  };

onMounted(() => {
  fetchCustomers();
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
                bg-emerald-100
                text-emerald-600
              "
            >
              <i
                class="
                  pi
                  pi-users
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
                  'customer.title'
                )
              }}
            </h1>
          </div>

          <Button
            :label="
              t(
                'customer.add'
              )
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
                'customer.searchPlaceholder'
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
                'customer.allStatuses'
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
                  'customer.search'
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
                  'customer.reset'
                )
              "
              :title="
                t(
                  'customer.reset'
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
                customer in customers
              "
              :key="
                getCustomerId(
                  customer
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
                <div
                  class="min-w-0"
                >
                  <h2
                    class="
                      truncate
                      text-lg
                      font-bold
                    "
                  >
                    {{
                      customer.username ||
                      '-'
                    }}
                  </h2>

                  <div
                    class="
                      mt-1
                      text-sm
                      text-gray-500
                    "
                  >
                    {{
                      customer.branchId ||
                      '-'
                    }}
                  </div>
                </div>

                <Tag
                  :value="
                    getStatusLabel(
                      customer.status
                    )
                  "
                  :severity="
                    getStatusSeverity(
                      customer.status
                    )
                  "
                />
              </div>

              <div
                class="
                  mt-3
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                <div
                  class="
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
                        'customer.fields.phone'
                      )
                    }}
                  </div>

                  <div
                    class="
                      mt-1
                      truncate
                      font-medium
                    "
                  >
                    {{
                      customer.phoneNumber ||
                      '-'
                    }}
                  </div>
                </div>

                <div
                  class="
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
                        'customer.fields.balance'
                      )
                    }}
                  </div>

                  <div
                    class="
                      mt-1
                      font-semibold
                    "
                  >
                    {{
                      formatBalance(
                        customer.balance
                      )
                    }}
                  </div>
                </div>
              </div>

              <div
                class="
                  mt-3
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                <Button
                  :label="
                    t(
                      'customer.edit'
                    )
                  "
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  @click="
                    openEditDialog(
                      customer
                    )
                  "
                />

                <Button
                  :label="
                    t(
                      'customer.delete'
                    )
                  "
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="
                    openDeleteDialog(
                      customer
                    )
                  "
                />
              </div>
            </article>

            <div
              v-if="
                !customers.length
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
                  'customer.noCustomers'
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
                  'customer.pageOf',
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
            :value="customers"
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
              min-width: 850px
            "
            @page="
              onPageChange
            "
          >
            <Column
              field="username"
              :header="
                t(
                  'customer.columns.username'
                )
              "
              style="
                min-width: 160px
              "
            />

            <Column
              field="branchId"
              :header="
                t(
                  'customer.columns.branch'
                )
              "
              style="
                min-width: 130px
              "
            />

            <Column
              field="phoneNumber"
              :header="
                t(
                  'customer.columns.phone'
                )
              "
              style="
                min-width: 150px
              "
            >
              <template
                #body="{ data }"
              >
                {{
                  data.phoneNumber ||
                  '-'
                }}
              </template>
            </Column>

            <Column
              field="balance"
              :header="
                t(
                  'customer.columns.balance'
                )
              "
              style="
                min-width: 120px
              "
            >
              <template
                #body="{ data }"
              >
                {{
                  formatBalance(
                    data.balance
                  )
                }}
              </template>
            </Column>

            <Column
              :header="
                t(
                  'customer.columns.status'
                )
              "
              style="
                min-width: 110px
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
              :header="
                t(
                  'customer.columns.action'
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
                        'customer.edit'
                      )
                    "
                    :title="
                      t(
                        'customer.edit'
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
                        'customer.delete'
                      )
                    "
                    :title="
                      t(
                        'customer.delete'
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
                    'customer.noCustomers'
                  )
                }}
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add/Edit customer -->

    <Dialog
      v-model:visible="
        formDialogVisible
      "
      modal
      :header="
        isEditMode
          ? t(
              'customer.dialogs.editTitle'
            )
          : t(
              'customer.dialogs.addTitle'
            )
      "
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

        <div
          class="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          "
        >
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
                  'customer.fields.username'
                )
              }}
            </label>

            <InputText
              v-model="
                form.username
              "
              class="w-full"
              :placeholder="
                t(
                  'customer.placeholders.username'
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
                  'customer.fields.branch'
                )
              }}
            </label>

            <InputText
              v-model="
                form.branchId
              "
              class="w-full"
              :placeholder="
                t(
                  'customer.placeholders.branch'
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
                  'customer.fields.phone'
                )
              }}
            </label>

            <InputText
              v-model="
                form.phoneNumber
              "
              class="w-full"
              :placeholder="
                t(
                  'customer.placeholders.phone'
                )
              "
              inputmode="tel"
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
                  'customer.fields.balance'
                )
              }}
            </label>

            <InputNumber
              v-model="
                form.balance
              "
              class="w-full"
              input-class="w-full"
              :min="0"
              :maxFractionDigits="2"
            />
          </div>

          <div
            class="sm:col-span-2"
          >
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
                  'customer.fields.address'
                )
              }}
            </label>

            <Textarea
              v-model="
                form.address
              "
              class="w-full"
              rows="2"
              :placeholder="
                t(
                  'customer.placeholders.address'
                )
              "
              autoResize
            />
          </div>

          <div
            class="sm:col-span-2"
          >
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
                  'customer.fields.description'
                )
              }}
            </label>

            <Textarea
              v-model="
                form.description
              "
              class="w-full"
              rows="2"
              :placeholder="
                t(
                  'customer.placeholders.description'
                )
              "
              autoResize
            />
          </div>

          <div
            class="sm:col-span-2"
          >
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
                      'customer.fields.status'
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
                'customer.cancel'
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
                    'customer.update'
                  )
                : t(
                    'customer.create'
                  )
            "
            icon="pi pi-save"
            :loading="saving"
            @click="
              saveCustomer
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
          'customer.dialogs.deleteTitle'
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
              'customer.deleteQuestion',
              {
                name:
                  selectedCustomer
                    ?.username ||
                  '-'
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
              'customer.deleteWarning'
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
                'customer.cancel'
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
                'customer.delete'
              )
            "
            icon="pi pi-trash"
            severity="danger"
            :loading="deleting"
            @click="
              confirmDeleteCustomer
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
  .customer-form-dialog {
    width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .customer-form-dialog
    .p-dialog-content {
    overflow-y: auto;
  }
}
</style>