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
import Password from "primevue/password";
import Select from "primevue/select";
import Tag from "primevue/tag";

import api from "../services/api";

const { t, locale } = useI18n();

const users = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const formDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditMode = ref(false);

const selectedUser = ref(null);

const errorMessage = ref("");
const successMessage = ref("");

const search = ref("");
const filterRole = ref(null);

const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

/*
|--------------------------------------------------------------------------
| Role options
|--------------------------------------------------------------------------
|
| Computed is required so labels change immediately when the application
| language changes.
|
*/

const roleOptions = computed(() => {
  return [
    {
      label: t("user.roles.user"),
      value: "user",
    },
    {
      label: t("user.roles.admin"),
      value: "admin",
    },
  ];
});

const form = ref({
  id: null,
  name: "",
  email: "",
  password: "",
  role: "user",
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

const getUserId = (user) => {
  return (
    user?.id ||
    user?._id ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Date formatting
|--------------------------------------------------------------------------
*/

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
      minute: "2-digit",
    }
  );
};

const getRoleLabel = (role) => {
  return role === "admin"
    ? t("user.roles.admin")
    : t("user.roles.user");
};

const getRoleSeverity = (role) => {
  return role === "admin"
    ? "danger"
    : "info";
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
    email: "",
    password: "",
    role: "user",
  };
};

/*
|--------------------------------------------------------------------------
| Fetch users
|--------------------------------------------------------------------------
*/

const fetchUsers = async () => {
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

    if (filterRole.value) {
      params.role =
        filterRole.value;
    }

    const response = await api.get(
      "/users",
      {
        params,
      }
    );

    users.value =
      extractArrayData(
        response,
        [
          "users",
          "items",
          "results",
        ]
      );

    totalRecords.value =
      extractTotalRecords(
        response,
        users.value.length
      );
  } catch (error) {
    console.error(
      "Fetch users error:",
      error
    );

    users.value = [];

    errorMessage.value =
      getApiErrorMessage(
        error,
        "user.errors.fetch"
      );
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  page.value = 1;
  fetchUsers();
};

const clearFilter = () => {
  search.value = "";
  filterRole.value = null;
  page.value = 1;

  fetchUsers();
};

const onPageChange = (event) => {
  page.value =
    event.page + 1;

  limit.value =
    event.rows;

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
    page.value >=
      totalPages.value
  ) {
    return;
  }

  page.value += 1;

  fetchUsers();
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

const openEditDialog = (user) => {
  clearMessages();

  form.value = {
    id: getUserId(user),
    name: user.name || "",
    email: user.email || "",
    password: "",
    role: user.role || "user",
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
      "user.errors.nameRequired"
    );
  }

  if (
    !form.value.email.trim()
  ) {
    return t(
      "user.errors.emailRequired"
    );
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      form.value.email.trim()
    )
  ) {
    return t(
      "user.errors.emailInvalid"
    );
  }

  if (
    !isEditMode.value &&
    !form.value.password
  ) {
    return t(
      "user.errors.passwordRequired"
    );
  }

  if (
    form.value.password &&
    form.value.password.length < 6
  ) {
    return t(
      "user.errors.passwordMin"
    );
  }

  if (
    !["user", "admin"].includes(
      form.value.role
    )
  ) {
    return t(
      "user.errors.roleInvalid"
    );
  }

  return "";
};

const buildPayload = () => {
  const payload = {
    name:
      form.value.name.trim(),

    email:
      form.value.email
        .trim()
        .toLowerCase(),

    role:
      form.value.role,
  };

  if (form.value.password) {
    payload.password =
      form.value.password;
  }

  return payload;
};

const saveUser = async () => {
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
        `/users/${form.value.id}`,
        payload
      );

      successMessage.value =
        t(
          "user.messages.updated"
        );
    } else {
      await api.post(
        "/users",
        payload
      );

      successMessage.value =
        t(
          "user.messages.created"
        );
    }

    formDialogVisible.value = false;

    resetForm();

    await fetchUsers();
  } catch (error) {
    console.error(
      "Save user error:",
      error
    );

    errorMessage.value =
      getApiErrorMessage(
        error,
        "user.errors.save"
      );
  } finally {
    saving.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Delete user
|--------------------------------------------------------------------------
*/

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
    errorMessage.value = "";
    successMessage.value = "";

    const userId =
      getUserId(
        selectedUser.value
      );

    if (!userId) {
      errorMessage.value =
        t(
          "user.errors.idMissing"
        );

      return;
    }

    await api.delete(
      `/users/${userId}`
    );

    successMessage.value =
      t(
        "user.messages.deleted"
      );

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
      "Delete user error:",
      error
    );

    errorMessage.value =
      getApiErrorMessage(
        error,
        "user.errors.delete"
      );

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
                bg-cyan-100
                text-cyan-700
              "
            >
              <i
                class="
                  pi
                  pi-user-edit
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
              {{ t("user.title") }}
            </h1>
          </div>

          <Button
            :label="
              t('user.add')
            "
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
            sm:grid-cols-[1fr_190px_auto]
          "
        >
          <InputText
            v-model="search"
            class="w-full"
            :placeholder="
              t(
                'user.searchPlaceholder'
              )
            "
            @keyup.enter="
              applyFilter
            "
          />

          <Select
            v-model="filterRole"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="
              t('user.allRoles')
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
                t('user.search')
              "
              icon="pi pi-search"
              @click="applyFilter"
            />

            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :aria-label="
                t('user.reset')
              "
              :title="
                t('user.reset')
              "
              @click="clearFilter"
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
              v-for="user in users"
              :key="
                getUserId(user)
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
                      user.name ||
                      "-"
                    }}
                  </h2>

                  <div
                    class="
                      mt-1
                      break-all
                      text-sm
                      text-gray-500
                    "
                  >
                    {{
                      user.email ||
                      "-"
                    }}
                  </div>
                </div>

                <Tag
                  :value="
                    getRoleLabel(
                      user.role
                    )
                  "
                  :severity="
                    getRoleSeverity(
                      user.role
                    )
                  "
                />
              </div>

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
                      "user.created"
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
                      user.createdAt
                    )
                  }}
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
                    t('user.edit')
                  "
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  @click="
                    openEditDialog(
                      user
                    )
                  "
                />

                <Button
                  :label="
                    t('user.delete')
                  "
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="
                    openDeleteDialog(
                      user
                    )
                  "
                />
              </div>
            </article>

            <div
              v-if="!users.length"
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
                  "user.noUsers"
                )
              }}
            </div>
          </template>

          <div
            v-if="totalRecords > 0"
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
              :aria-label="
                t('user.pageOf', {
                  page:
                    Math.max(
                      page - 1,
                      1
                    ),
                  total:
                    totalPages
                })
              "
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
                  "user.pageOf",
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
              :aria-label="
                t('user.pageOf', {
                  page:
                    Math.min(
                      page + 1,
                      totalPages
                    ),
                  total:
                    totalPages
                })
              "
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
            :value="users"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="id"
            :rows="limit"
            :first="
              (page - 1) * limit
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
            @page="onPageChange"
          >
            <Column
              field="name"
              :header="
                t(
                  'user.columns.name'
                )
              "
              style="
                min-width: 170px
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
              field="email"
              :header="
                t(
                  'user.columns.email'
                )
              "
              style="
                min-width: 220px
              "
            />

            <Column
              field="role"
              :header="
                t(
                  'user.columns.role'
                )
              "
              style="
                min-width: 140px
              "
            >
              <template
                #body="{ data }"
              >
                <Tag
                  :value="
                    getRoleLabel(
                      data.role
                    )
                  "
                  :severity="
                    getRoleSeverity(
                      data.role
                    )
                  "
                />
              </template>
            </Column>

            <Column
              field="createdAt"
              :header="
                t(
                  'user.columns.created'
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
                  'user.columns.action'
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
                      t('user.edit')
                    "
                    :title="
                      t('user.edit')
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
                        'user.delete'
                      )
                    "
                    :title="
                      t(
                        'user.delete'
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
                    "user.noUsers"
                  )
                }}
              </div>
            </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add/Edit user -->

    <Dialog
      v-model:visible="
        formDialogVisible
      "
      modal
      :header="
        isEditMode
          ? t(
              'user.dialogs.editTitle'
            )
          : t(
              'user.dialogs.addTitle'
            )
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
            class="
              mb-1
              block
              text-sm
              font-medium
            "
          >
            {{
              t(
                "user.fields.name"
              )
            }}
          </label>

          <InputText
            v-model="form.name"
            class="w-full"
            :placeholder="
              t(
                'user.placeholders.name'
              )
            "
            autocomplete="name"
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
                "user.fields.email"
              )
            }}
          </label>

          <InputText
            v-model="form.email"
            type="email"
            class="w-full"
            :placeholder="
              t(
                'user.placeholders.email'
              )
            "
            autocomplete="email"
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
                "user.fields.password"
              )
            }}
          </label>

          <Password
            v-model="form.password"
            class="w-full"
            input-class="w-full"
            :placeholder="
              isEditMode
                ? t(
                    'user.placeholders.keepPassword'
                  )
                : t(
                    'user.placeholders.password'
                  )
            "
            :feedback="!isEditMode"
            :promptLabel="
              t(
                'user.passwordStrength.prompt'
              )
            "
            :weakLabel="
              t(
                'user.passwordStrength.weak'
              )
            "
            :mediumLabel="
              t(
                'user.passwordStrength.medium'
              )
            "
            :strongLabel="
              t(
                'user.passwordStrength.strong'
              )
            "
            toggleMask
            autocomplete="new-password"
          />

          <div
            v-if="isEditMode"
            class="
              mt-1
              text-xs
              text-gray-500
            "
          >
            {{
              t(
                "user.passwordHint"
              )
            }}
          </div>
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
                "user.fields.role"
              )
            }}
          </label>

          <Select
            v-model="form.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="
              t(
                'user.placeholders.role'
              )
            "
            class="w-full"
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
              t('user.cancel')
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
                    'user.update'
                  )
                : t(
                    'user.create'
                  )
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
      v-model:visible="
        deleteDialogVisible
      "
      modal
      :header="
        t(
          'user.dialogs.deleteTitle'
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
              "user.deleteQuestion",
              {
                name:
                  selectedUser?.name ||
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
              "user.deleteWarning"
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
              t('user.cancel')
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
              t('user.delete')
            "
            icon="pi pi-trash"
            severity="danger"
            :loading="deleting"
            @click="
              confirmDeleteUser
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

  .user-form-dialog
    .p-dialog-content {
    overflow-y: auto;
  }
}
</style>