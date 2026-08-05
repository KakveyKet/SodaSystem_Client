<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import {
  useI18n,
} from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Password from "primevue/password";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";

import api from "../services/api";

const { t } = useI18n();

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
|
| Keep the email example outside Vue i18n because Vue i18n treats @ as
| linked-message syntax.
|
*/

const customerEmailPlaceholder =
  "customer@example.com";

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const customers = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const isEditMode = ref(false);
const selectedCustomer = ref(null);

const errorMessage = ref("");
const successMessage = ref("");

const search = ref("");
const filterStatus = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

/*
|--------------------------------------------------------------------------
| Customer form
|--------------------------------------------------------------------------
*/

const createEmptyForm = () => ({
  id: null,
  userId: null,
  hasLoginAccount: false,

  username: "",
  email: "",
  password: "",
  confirmPassword: "",

  branchId: "",
  phoneNumber: "",
  address: "",
  description: "",

  balance: 0,
  status: true,
});

const form = ref(
  createEmptyForm(),
);

/*
|--------------------------------------------------------------------------
| Computed values
|--------------------------------------------------------------------------
*/

const statusOptions = computed(() => [
  {
    label: t(
      "customer.status.active",
    ),
    value: true,
  },
  {
    label: t(
      "customer.status.inactive",
    ),
    value: false,
  },
]);

const totalPages = computed(() => {
  const total = Number(
    totalRecords.value || 0,
  );

  const pageSize = Number(
    limit.value || 10,
  );

  return Math.max(
    Math.ceil(
      total / pageSize,
    ),
    1,
  );
});

const passwordRequired = computed(() => {
  if (!isEditMode.value) {
    return true;
  }

  return !form.value.hasLoginAccount;
});

const passwordHelpText = computed(() => {
  if (!isEditMode.value) {
    return t(
      "customer.login.createPasswordHelp",
    );
  }

  if (!form.value.hasLoginAccount) {
    return t(
      "customer.login.legacyPasswordHelp",
    );
  }

  return t(
    "customer.login.existingPasswordHelp",
  );
});

/*
|--------------------------------------------------------------------------
| API response helpers
|--------------------------------------------------------------------------
*/

const extractArrayData = (
  response,
  keys = [],
) => {
  if (
    Array.isArray(
      response.data?.data,
    )
  ) {
    return response.data.data;
  }

  for (const key of keys) {
    if (
      Array.isArray(
        response.data?.data?.[key],
      )
    ) {
      return response.data.data[key];
    }

    if (
      Array.isArray(
        response.data?.[key],
      )
    ) {
      return response.data[key];
    }
  }

  return [];
};

const extractTotalRecords = (
  response,
  fallback = 0,
) => {
  return (
    response.data?.pagination?.total ??
    response.data?.data?.pagination?.total ??
    response.data?.data?.total ??
    response.data?.total ??
    fallback
  );
};

const getApiErrorMessage = (
  error,
  fallbackKey,
) => {
  return (
    error.response?.data?.message ||
    t(fallbackKey)
  );
};

/*
|--------------------------------------------------------------------------
| Customer helpers
|--------------------------------------------------------------------------
*/

const getCustomerId = (
  customer,
) => {
  return (
    customer?.id ||
    customer?._id ||
    null
  );
};

const getLinkedUser = (
  customer,
) => {
  if (
    customer?.userId &&
    typeof customer.userId ===
      "object"
  ) {
    return customer.userId;
  }

  return null;
};

const getLinkedUserId = (
  customer,
) => {
  const linkedUser =
    getLinkedUser(customer);

  return (
    linkedUser?.id ||
    linkedUser?._id ||
    customer?.userId ||
    null
  );
};

const customerHasLogin = (
  customer,
) => {
  return Boolean(
    getLinkedUserId(customer),
  );
};

const getCustomerUsername = (
  customer,
) => {
  const linkedUser =
    getLinkedUser(customer);

  return (
    linkedUser?.username ||
    customer?.username ||
    ""
  );
};

const getCustomerEmail = (
  customer,
) => {
  const linkedUser =
    getLinkedUser(customer);

  return (
    linkedUser?.email ||
    customer?.email ||
    ""
  );
};

const formatBalance = (
  value,
) => {
  return Number(
    value || 0,
  ).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
};

const getStatusLabel = (
  status,
) => {
  return status !== false
    ? t(
        "customer.status.active",
      )
    : t(
        "customer.status.inactive",
      );
};

const getStatusSeverity = (
  status,
) => {
  return status !== false
    ? "success"
    : "danger";
};

/*
|--------------------------------------------------------------------------
| Form and message helpers
|--------------------------------------------------------------------------
*/

const clearMessages = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const resetForm = () => {
  form.value =
    createEmptyForm();
};

const handleFormDialogHide = () => {
  if (!saving.value) {
    resetForm();
  }
};

const handleDeleteDialogHide = () => {
  if (!deleting.value) {
    selectedCustomer.value =
      null;
  }
};

/*
|--------------------------------------------------------------------------
| Fetch customers
|--------------------------------------------------------------------------
*/

const fetchCustomers = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const params = {
      page: page.value,
      limit: limit.value,
    };

    const searchValue =
      search.value.trim();

    if (searchValue) {
      params.search =
        searchValue;
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
        "/customers",
        {
          params,
        },
      );

    customers.value =
      extractArrayData(
        response,
        [
          "customers",
          "items",
          "results",
        ],
      );

    totalRecords.value =
      Number(
        extractTotalRecords(
          response,
          customers.value.length,
        ),
      );
  } catch (error) {
    console.error(
      "Fetch customers error:",
      error,
    );

    customers.value = [];
    totalRecords.value = 0;

    errorMessage.value =
      getApiErrorMessage(
        error,
        "customer.errors.fetch",
      );
  } finally {
    loading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const applyFilter = () => {
  page.value = 1;

  fetchCustomers();
};

const clearFilter = () => {
  search.value = "";
  filterStatus.value = null;
  page.value = 1;

  fetchCustomers();
};

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

const onPageChange = (
  event,
) => {
  page.value =
    event.page + 1;

  limit.value =
    event.rows;

  fetchCustomers();
};

const goToPreviousPage = () => {
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

/*
|--------------------------------------------------------------------------
| Create dialog
|--------------------------------------------------------------------------
*/

const openCreateDialog = () => {
  clearMessages();
  resetForm();

  isEditMode.value = false;
  formDialogVisible.value = true;
};

/*
|--------------------------------------------------------------------------
| Edit dialog
|--------------------------------------------------------------------------
*/

const openEditDialog = (
  customer,
) => {
  clearMessages();

  const linkedUser =
    getLinkedUser(customer);

  const linkedUserId =
    getLinkedUserId(customer);

  form.value = {
    id:
      getCustomerId(customer),

    userId:
      linkedUserId,

    hasLoginAccount:
      Boolean(linkedUserId),

    username:
      linkedUser?.username ||
      customer?.username ||
      "",

    email:
      linkedUser?.email ||
      customer?.email ||
      "",

    password: "",
    confirmPassword: "",

    branchId:
      customer?.branchId ||
      "",

    phoneNumber:
      customer?.phoneNumber ||
      "",

    address:
      customer?.address ||
      "",

    description:
      customer?.description ||
      "",

    balance:
      Number(
        customer?.balance ?? 0,
      ),

    status:
      customer?.status !== false,
  };

  isEditMode.value = true;
  formDialogVisible.value = true;
};

const closeFormDialog = () => {
  if (saving.value) {
    return;
  }

  formDialogVisible.value = false;
};

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const validateForm = () => {
  const username =
    form.value.username.trim();

  const email =
    form.value.email
      .trim()
      .toLowerCase();

  const password =
    String(
      form.value.password || "",
    );

  const confirmPassword =
    String(
      form.value.confirmPassword || "",
    );

  if (!username) {
    return t(
      "customer.errors.usernameRequired",
    );
  }

  if (
    username.length > 100
  ) {
    return t(
      "customer.errors.usernameTooLong",
    );
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    return t(
      "customer.errors.invalidEmail",
    );
  }

  if (
    !form.value.branchId.trim()
  ) {
    return t(
      "customer.errors.branchRequired",
    );
  }

  if (
    passwordRequired.value &&
    !password
  ) {
    return t(
      "customer.errors.passwordRequired",
    );
  }

  if (
    password &&
    password.length < 6
  ) {
    return t(
      "customer.errors.passwordTooShort",
    );
  }

  if (
    password !==
    confirmPassword
  ) {
    return t(
      "customer.errors.passwordMismatch",
    );
  }

  const balance =
    Number(
      form.value.balance,
    );

  if (
    !Number.isFinite(balance)
  ) {
    return t(
      "customer.errors.invalidBalance",
    );
  }

  if (balance < 0) {
    return t(
      "customer.errors.balanceNegative",
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| Build request payload
|--------------------------------------------------------------------------
*/

const buildPayload = () => {
  const payload = {
    username:
      form.value.username.trim(),

    /*
     * Blank email is allowed.
     */
    email:
      form.value.email
        .trim()
        .toLowerCase(),

    branchId:
      form.value.branchId.trim(),

    phoneNumber:
      form.value.phoneNumber.trim(),

    address:
      form.value.address.trim(),

    description:
      form.value.description.trim(),

    balance:
      Number(
        form.value.balance || 0,
      ),

    status:
      Boolean(
        form.value.status,
      ),
  };

  /*
   * On edit, an empty password keeps the existing password.
   */
  if (form.value.password) {
    payload.password =
      form.value.password;
  }

  return payload;
};

/*
|--------------------------------------------------------------------------
| Save customer
|--------------------------------------------------------------------------
*/

const saveCustomer = async () => {
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
      if (!form.value.id) {
        errorMessage.value =
          t(
            "customer.errors.idMissing",
          );

        return;
      }

      await api.put(
        `/customers/${form.value.id}`,
        payload,
      );

      successMessage.value =
        t(
          "customer.messages.updated",
        );
    } else {
      await api.post(
        "/customers",
        payload,
      );

      successMessage.value =
        t(
          "customer.messages.created",
        );
    }

    formDialogVisible.value = false;

    await fetchCustomers();
  } catch (error) {
    console.error(
      "Save customer error:",
      error,
    );

    errorMessage.value =
      getApiErrorMessage(
        error,
        "customer.errors.save",
      );
  } finally {
    saving.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Delete customer
|--------------------------------------------------------------------------
*/

const openDeleteDialog = (
  customer,
) => {
  clearMessages();

  selectedCustomer.value =
    customer;

  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
};

const confirmDeleteCustomer =
  async () => {
    if (!selectedCustomer.value) {
      return;
    }

    try {
      deleting.value = true;
      errorMessage.value = "";
      successMessage.value = "";

      const customerId =
        getCustomerId(
          selectedCustomer.value,
        );

      if (!customerId) {
        errorMessage.value =
          t(
            "customer.errors.idMissing",
          );

        return;
      }

      await api.delete(
        `/customers/${customerId}`,
      );

      successMessage.value =
        t(
          "customer.messages.deleted",
        );

      deleteDialogVisible.value =
        false;

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
        "Delete customer error:",
        error,
      );

      errorMessage.value =
        getApiErrorMessage(
          error,
          "customer.errors.delete",
        );

      deleteDialogVisible.value =
        false;
    } finally {
      deleting.value = false;
    }
  };

/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

onMounted(() => {
  fetchCustomers();
});
</script>

<template>
  <div
    class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6"
  >
    <Card>
      <template #title>
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            class="flex min-w-0 items-center gap-3"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
            >
              <i
                class="pi pi-users"
              ></i>
            </div>

            <h1
              class="truncate text-xl font-bold sm:text-2xl"
            >
              {{
                t(
                  "customer.title",
                )
              }}
            </h1>
          </div>

          <Button
            type="button"
            :label="
              t(
                'customer.add',
              )
            "
            icon="pi pi-plus"
            class="w-full sm:w-auto"
            @click="
              openCreateDialog
            "
          />
        </div>
      </template>

      <template #content>
        <Message
          v-if="
            errorMessage &&
            !formDialogVisible
          "
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
          class="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
        >
          <InputText
            v-model="search"
            class="w-full"
            :placeholder="
              t(
                'customer.searchPlaceholder',
              )
            "
            @keyup.enter="
              applyFilter
            "
          />

          <Select
            v-model="filterStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="
              t(
                'customer.allStatuses',
              )
            "
            class="w-full"
            showClear
          />

          <div
            class="grid grid-cols-2 gap-2 sm:flex"
          >
            <Button
              type="button"
              :label="
                t(
                  'customer.search',
                )
              "
              icon="pi pi-search"
              @click="
                applyFilter
              "
            />

            <Button
              type="button"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :aria-label="
                t(
                  'customer.reset',
                )
              "
              :title="
                t(
                  'customer.reset',
                )
              "
              @click="
                clearFilter
              "
            />
          </div>
        </div>

        <!-- Mobile customers -->

        <section
          class="space-y-3 md:hidden"
        >
          <div
            v-if="loading"
            class="py-10 text-center"
          >
            <i
              class="pi pi-spin pi-spinner text-2xl text-primary"
            ></i>
          </div>

          <template v-else>
            <article
              v-for="
                customer in customers
              "
              :key="
                getCustomerId(
                  customer,
                )
              "
              class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div
                class="flex items-start justify-between gap-3"
              >
                <div
                  class="min-w-0"
                >
                  <h2
                    class="truncate text-lg font-bold"
                  >
                    {{
                      getCustomerUsername(
                        customer,
                      ) || "-"
                    }}
                  </h2>

                  <p
                    class="mt-1 truncate text-sm text-gray-500"
                  >
                    {{
                      getCustomerEmail(
                        customer,
                      ) ||
                      t(
                        "customer.noEmail",
                      )
                    }}
                  </p>

                  <p
                    class="mt-1 text-sm text-gray-500"
                  >
                    {{
                      customer.branchId ||
                      "-"
                    }}
                  </p>
                </div>

                <Tag
                  :value="
                    getStatusLabel(
                      customer.status,
                    )
                  "
                  :severity="
                    getStatusSeverity(
                      customer.status,
                    )
                  "
                />
              </div>

              <div
                class="mt-3 flex flex-wrap gap-2"
              >
                <Tag
                  :value="
                    t(
                      'customer.role.customer',
                    )
                  "
                  severity="info"
                />

                <Tag
                  :value="
                    customerHasLogin(
                      customer,
                    )
                      ? t(
                          'customer.login.readyLong',
                        )
                      : t(
                          'customer.login.missingLong',
                        )
                  "
                  :severity="
                    customerHasLogin(
                      customer,
                    )
                      ? 'success'
                      : 'warn'
                  "
                />
              </div>

              <div
                class="mt-3 grid grid-cols-2 gap-2"
              >
                <div
                  class="rounded-lg bg-gray-50 p-3"
                >
                  <div
                    class="text-xs text-gray-500"
                  >
                    {{
                      t(
                        "customer.fields.phone",
                      )
                    }}
                  </div>

                  <div
                    class="mt-1 truncate font-medium"
                  >
                    {{
                      customer.phoneNumber ||
                      "-"
                    }}
                  </div>
                </div>

                <div
                  class="rounded-lg bg-gray-50 p-3"
                >
                  <div
                    class="text-xs text-gray-500"
                  >
                    {{
                      t(
                        "customer.fields.balance",
                      )
                    }}
                  </div>

                  <div
                    class="mt-1 font-semibold"
                  >
                    {{
                      formatBalance(
                        customer.balance,
                      )
                    }}
                  </div>
                </div>
              </div>

              <div
                class="mt-3 grid grid-cols-2 gap-2"
              >
                <Button
                  type="button"
                  :label="
                    t(
                      'customer.edit',
                    )
                  "
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  @click="
                    openEditDialog(
                      customer,
                    )
                  "
                />

                <Button
                  type="button"
                  :label="
                    t(
                      'customer.delete',
                    )
                  "
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="
                    openDeleteDialog(
                      customer,
                    )
                  "
                />
              </div>
            </article>

            <div
              v-if="
                !customers.length
              "
              class="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500"
            >
              {{
                t(
                  "customer.noCustomers",
                )
              }}
            </div>
          </template>

          <div
            v-if="
              totalRecords > 0
            "
            class="flex items-center justify-between rounded-xl border border-gray-200 p-2"
          >
            <Button
              type="button"
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
              class="text-sm font-medium"
            >
              {{
                t(
                  "customer.pageOf",
                  {
                    page,
                    total:
                      totalPages,
                  },
                )
              }}
            </span>

            <Button
              type="button"
              icon="pi pi-chevron-right"
              severity="secondary"
              text
              rounded
              :disabled="
                page >= totalPages ||
                loading
              "
              @click="
                goToNextPage
              "
            />
          </div>
        </section>

        <!-- Desktop table -->

        <section
          class="hidden md:block"
        >
          <DataTable
            :value="customers"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="_id"
            :rows="limit"
            :first="
              (page - 1) *
              limit
            "
            :totalRecords="
              totalRecords
            "
            :rowsPerPageOptions="
              [
                5,
                10,
                20,
                50,
              ]
            "
            tableStyle="min-width: 1100px"
            @page="
              onPageChange
            "
          >
            <Column
              :header="
                t(
                  'customer.columns.username',
                )
              "
              style="min-width: 160px"
            >
              <template #body="{ data }">
                <span
                  class="font-semibold"
                >
                  {{
                    getCustomerUsername(
                      data,
                    ) || "-"
                  }}
                </span>
              </template>
            </Column>

            <Column
              :header="
                t(
                  'customer.columns.email',
                )
              "
              style="min-width: 210px"
            >
              <template #body="{ data }">
                {{
                  getCustomerEmail(
                    data,
                  ) ||
                  t(
                    "customer.noEmail",
                  )
                }}
              </template>
            </Column>

            <Column
              :header="
                t(
                  'customer.columns.role',
                )
              "
              style="min-width: 110px"
            >
              <template #body>
                <Tag
                  :value="
                    t(
                      'customer.role.customer',
                    )
                  "
                  severity="info"
                />
              </template>
            </Column>

            <Column
              :header="
                t(
                  'customer.columns.login',
                )
              "
              style="min-width: 130px"
            >
              <template #body="{ data }">
                <Tag
                  :value="
                    customerHasLogin(
                      data,
                    )
                      ? t(
                          'customer.login.ready',
                        )
                      : t(
                          'customer.login.missing',
                        )
                  "
                  :severity="
                    customerHasLogin(
                      data,
                    )
                      ? 'success'
                      : 'warn'
                  "
                />
              </template>
            </Column>

            <Column
              field="branchId"
              :header="
                t(
                  'customer.columns.branch',
                )
              "
              style="min-width: 130px"
            >
              <template #body="{ data }">
                {{
                  data.branchId ||
                  "-"
                }}
              </template>
            </Column>

            <Column
              field="phoneNumber"
              :header="
                t(
                  'customer.columns.phone',
                )
              "
              style="min-width: 150px"
            >
              <template #body="{ data }">
                {{
                  data.phoneNumber ||
                  "-"
                }}
              </template>
            </Column>

            <Column
              field="balance"
              :header="
                t(
                  'customer.columns.balance',
                )
              "
              style="min-width: 120px"
            >
              <template #body="{ data }">
                {{
                  formatBalance(
                    data.balance,
                  )
                }}
              </template>
            </Column>

            <Column
              :header="
                t(
                  'customer.columns.status',
                )
              "
              style="min-width: 110px"
            >
              <template #body="{ data }">
                <Tag
                  :value="
                    getStatusLabel(
                      data.status,
                    )
                  "
                  :severity="
                    getStatusSeverity(
                      data.status,
                    )
                  "
                />
              </template>
            </Column>

            <Column
              :header="
                t(
                  'customer.columns.action',
                )
              "
              frozen
              alignFrozen="right"
              style="min-width: 120px"
            >
              <template #body="{ data }">
                <div
                  class="flex gap-2"
                >
                  <Button
                    type="button"
                    icon="pi pi-pencil"
                    size="small"
                    severity="info"
                    :title="
                      t(
                        'customer.edit',
                      )
                    "
                    @click="
                      openEditDialog(
                        data,
                      )
                    "
                  />

                  <Button
                    type="button"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    :title="
                      t(
                        'customer.delete',
                      )
                    "
                    @click="
                      openDeleteDialog(
                        data,
                      )
                    "
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div
                class="py-8 text-center text-gray-500"
              >
                {{
                  t(
                    "customer.noCustomers",
                  )
                }}
              </div>
            </template>
          </DataTable>
        </section>
      </template>
    </Card>

    <!-- Create / Edit dialog -->

    <Dialog
      v-model:visible="
        formDialogVisible
      "
      appendTo="body"
      position="center"
      modal
      :autoZIndex="true"
      :baseZIndex="20000"
      :header="
        isEditMode
          ? t(
              'customer.dialogs.editTitle',
            )
          : t(
              'customer.dialogs.addTitle',
            )
      "
      :style="{
        width:
          'calc(100vw - 24px)',
        maxWidth:
          '720px',
        maxHeight:
          'calc(100dvh - 24px)',
      }"
      :closable="!saving"
      :closeOnEscape="!saving"
      :draggable="false"
      :dismissableMask="false"
      :blockScroll="true"
      class="customer-form-modal"
      @hide="
        handleFormDialogHide
      "
    >
      <div class="space-y-5">
        <Message
          v-if="errorMessage"
          severity="error"
          closable
          @close="
            errorMessage = ''
          "
        >
          {{ errorMessage }}
        </Message>

        <!-- Login account -->

        <section
          class="rounded-xl border border-blue-200 bg-blue-50 p-4"
        >
          <div
            class="mb-4 flex items-start justify-between gap-3"
          >
            <div class="min-w-0">
              <h3
                class="font-bold text-blue-900"
              >
                {{
                  t(
                    "customer.login.title",
                  )
                }}
              </h3>

              <p
                class="mt-1 text-sm text-blue-700"
              >
                {{
                  t(
                    "customer.login.description",
                  )
                }}
              </p>
            </div>

            <Tag
              :value="
                t(
                  'customer.role.customer',
                )
              "
              severity="info"
            />
          </div>

          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                for="customer-username"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.username",
                  )
                }}

                <span class="text-red-500">
                  *
                </span>
              </label>

              <InputText
                id="customer-username"
                v-model="
                  form.username
                "
                class="w-full"
                autocomplete="username"
                :placeholder="
                  t(
                    'customer.placeholders.username',
                  )
                "
              />
            </div>

            <div>
              <label
                for="customer-email"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.email",
                  )
                }}

                <span
                  class="font-normal text-gray-500"
                >
                  ({{
                    t(
                      "customer.login.emailOptional",
                    )
                  }})
                </span>
              </label>

              <InputText
                id="customer-email"
                v-model="
                  form.email
                "
                type="email"
                class="w-full"
                autocomplete="email"
                :placeholder="
                  customerEmailPlaceholder
                "
              />
            </div>

            <div>
              <label
                for="customer-password"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.password",
                  )
                }}

                <span
                  v-if="
                    passwordRequired
                  "
                  class="text-red-500"
                >
                  *
                </span>
              </label>

              <Password
                inputId="customer-password"
                v-model="
                  form.password
                "
                class="w-full"
                input-class="w-full"
                autocomplete="new-password"
                :placeholder="
                  isEditMode
                    ? t(
                        'customer.login.updatePasswordPlaceholder',
                      )
                    : t(
                        'customer.login.createPasswordPlaceholder',
                      )
                "
                toggleMask
                :feedback="false"
              />
            </div>

            <div>
              <label
                for="customer-confirm-password"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.confirmPassword",
                  )
                }}

                <span
                  v-if="
                    passwordRequired
                  "
                  class="text-red-500"
                >
                  *
                </span>
              </label>

              <Password
                inputId="customer-confirm-password"
                v-model="
                  form.confirmPassword
                "
                class="w-full"
                input-class="w-full"
                autocomplete="new-password"
                :placeholder="
                  t(
                    'customer.login.confirmPasswordPlaceholder',
                  )
                "
                toggleMask
                :feedback="false"
              />
            </div>

            <p
              class="text-xs text-blue-700 sm:col-span-2"
            >
              {{ passwordHelpText }}
            </p>
          </div>
        </section>

        <!-- Customer information -->

        <section
          class="rounded-xl border border-gray-200 bg-white p-4"
        >
          <h3
            class="mb-4 font-bold text-gray-900"
          >
            {{
              t(
                "customer.sections.customerInformation",
              )
            }}
          </h3>

          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                for="customer-branch"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.branch",
                  )
                }}

                <span class="text-red-500">
                  *
                </span>
              </label>

              <InputText
                id="customer-branch"
                v-model="
                  form.branchId
                "
                class="w-full"
                :placeholder="
                  t(
                    'customer.placeholders.branch',
                  )
                "
              />
            </div>

            <div>
              <label
                for="customer-phone"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.phone",
                  )
                }}
              </label>

              <InputText
                id="customer-phone"
                v-model="
                  form.phoneNumber
                "
                class="w-full"
                inputmode="tel"
                :placeholder="
                  t(
                    'customer.placeholders.phone',
                  )
                "
              />
            </div>

            <div>
              <label
                for="customer-balance"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.balance",
                  )
                }}
              </label>

              <InputNumber
                inputId="customer-balance"
                v-model="
                  form.balance
                "
                class="w-full"
                input-class="w-full"
                :min="0"
                :maxFractionDigits="2"
                :useGrouping="true"
              />
            </div>

            <div
              class="flex min-h-20 items-center justify-between rounded-xl border border-gray-200 p-3"
            >
              <div>
                <div class="font-medium">
                  {{
                    t(
                      "customer.fields.status",
                    )
                  }}
                </div>

                <div
                  class="mt-1 text-xs text-gray-500"
                >
                  {{
                    getStatusLabel(
                      form.status,
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

            <div
              class="sm:col-span-2"
            >
              <label
                for="customer-address"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.address",
                  )
                }}
              </label>

              <Textarea
                id="customer-address"
                v-model="
                  form.address
                "
                class="w-full"
                rows="2"
                autoResize
                :placeholder="
                  t(
                    'customer.placeholders.address',
                  )
                "
              />
            </div>

            <div
              class="sm:col-span-2"
            >
              <label
                for="customer-description"
                class="mb-1 block text-sm font-medium"
              >
                {{
                  t(
                    "customer.fields.description",
                  )
                }}
              </label>

              <Textarea
                id="customer-description"
                v-model="
                  form.description
                "
                class="w-full"
                rows="2"
                autoResize
                :placeholder="
                  t(
                    'customer.placeholders.description',
                  )
                "
              />
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div
          class="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end"
        >
          <Button
            type="button"
            :label="
              t(
                'customer.cancel',
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
            type="button"
            :label="
              isEditMode
                ? t(
                    'customer.update',
                  )
                : t(
                    'customer.create',
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

    <!-- Delete dialog -->

    <Dialog
      v-model:visible="
        deleteDialogVisible
      "
      appendTo="body"
      position="center"
      modal
      :autoZIndex="true"
      :baseZIndex="20000"
      :header="
        t(
          'customer.dialogs.deleteTitle',
        )
      "
      :style="{
        width:
          'calc(100vw - 24px)',
        maxWidth:
          '420px',
      }"
      :closable="!deleting"
      :closeOnEscape="!deleting"
      :draggable="false"
      :dismissableMask="false"
      :blockScroll="true"
      class="customer-delete-modal"
      @hide="
        handleDeleteDialogHide
      "
    >
      <p class="font-semibold">
        {{
          t(
            "customer.deleteQuestion",
            {
              name:
                getCustomerUsername(
                  selectedCustomer,
                ) ||
                "-",
            },
          )
        }}
      </p>

      <p
        class="mt-2 text-sm text-gray-500"
      >
        {{
          t(
            "customer.deleteLoginNote",
          )
        }}
      </p>

      <template #footer>
        <div
          class="grid w-full grid-cols-2 gap-2"
        >
          <Button
            type="button"
            :label="
              t(
                'customer.cancel',
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
            type="button"
            :label="
              t(
                'customer.delete',
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
:deep(.p-password),
:deep(.p-password-input),
:deep(.p-select),
:deep(.p-inputnumber),
:deep(.p-inputnumber-input),
:deep(.p-textarea),
:deep(.p-button) {
  min-height: 44px;
}

:deep(.p-password),
:deep(.p-inputnumber),
:deep(.p-select) {
  width: 100%;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 1.5rem;
  }
}
</style>

<style>
/*
|--------------------------------------------------------------------------
| Dialog overlay
|--------------------------------------------------------------------------
*/

.p-dialog-mask {
  z-index: 20000 !important;
}

.p-dialog-mask .p-dialog {
  z-index: 20001 !important;
}

/*
|--------------------------------------------------------------------------
| Customer form dialog
|--------------------------------------------------------------------------
*/

.customer-form-modal.p-dialog {
  display: flex !important;
  max-height: calc(100dvh - 24px) !important;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  box-shadow:
    0 25px 50px -12px
      rgb(0 0 0 / 0.3);
}

.customer-form-modal
  .p-dialog-header {
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.customer-form-modal
  .p-dialog-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1rem 1.25rem;
  background: #ffffff;
}

.customer-form-modal
  .p-dialog-footer {
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

/*
|--------------------------------------------------------------------------
| Delete dialog
|--------------------------------------------------------------------------
*/

.customer-delete-modal.p-dialog {
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  box-shadow:
    0 25px 50px -12px
      rgb(0 0 0 / 0.3);
}

.customer-delete-modal
  .p-dialog-header {
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.customer-delete-modal
  .p-dialog-content {
  background: #ffffff;
}

.customer-delete-modal
  .p-dialog-footer {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

/*
|--------------------------------------------------------------------------
| Mobile dialog
|--------------------------------------------------------------------------
*/

@media (max-width: 639px) {
  .customer-form-modal.p-dialog {
    width: 100vw !important;
    height: 100dvh !important;
    max-width: none !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .customer-form-modal
    .p-dialog-header {
    padding: 0.875rem;
  }

  .customer-form-modal
    .p-dialog-content {
    padding: 0.875rem;
  }

  .customer-form-modal
    .p-dialog-footer {
    padding: 0.75rem;
    padding-bottom: max(
      0.75rem,
      env(safe-area-inset-bottom)
    );
  }
}
</style>