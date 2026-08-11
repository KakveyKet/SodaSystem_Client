<script setup>
import { computed, onMounted, ref } from "vue";

import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Message from "primevue/message";
import Select from "primevue/select";

import api from "../services/api";

const { t, locale } = useI18n();

/*
|--------------------------------------------------------------------------
| Date helpers
|--------------------------------------------------------------------------
*/

const getToday = () => {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getCurrentWeekRange = () => {
  const today = getToday();

  const monday = new Date(today);

  const day = monday.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  monday.setDate(monday.getDate() + difference);

  const sunday = new Date(monday);

  sunday.setDate(monday.getDate() + 6);

  return [monday, sunday];
};

const formatDateForApi = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(locale.value === "km" ? "km-KH" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

/*
|--------------------------------------------------------------------------
| Customer helper
|--------------------------------------------------------------------------
*/

const getCustomerLabel = (customer) => {
  if (!customer) {
    return "-";
  }

  const linkedUser =
    customer.userId && typeof customer.userId === "object"
      ? customer.userId
      : null;

  return (
    linkedUser?.username ||
    customer.username ||
    customer.name ||
    linkedUser?.email ||
    customer.email ||
    "-"
  );
};

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const loading = ref(false);

const customerLoading = ref(false);

const errorMessage = ref("");

const transactions = ref([]);

const customers = ref([]);

const customerId = ref(null);

const dateRange = ref(getCurrentWeekRange());

const page = ref(1);

const limit = ref(20);

const totalRecords = ref(0);

/*
|--------------------------------------------------------------------------
| Customer options
|--------------------------------------------------------------------------
*/

const customerOptions = computed(() => {
  return customers.value.map((customer) => ({
    label: getCustomerLabel(customer),

    value: String(customer._id || customer.id),
  }));
});

const selectedCustomerName = computed(() => {
  if (!customerId.value) {
    return t("customerDepositReport.filters.allCustomers");
  }

  return (
    customerOptions.value.find((item) => {
      return String(item.value) === String(customerId.value);
    })?.label || t("customerDepositReport.fields.customer")
  );
});

const currentRangeText = computed(() => {
  const start = dateRange.value?.[0];

  const end = dateRange.value?.[1] || dateRange.value?.[0];

  return `${formatDateForApi(start)} → ${formatDateForApi(end)}`;
});

/*
|--------------------------------------------------------------------------
| Fetch customers
|--------------------------------------------------------------------------
*/

const fetchCustomers = async () => {
  try {
    customerLoading.value = true;

    const response = await api.get("/customers", {
      params: {
        page: 1,
        limit: 500,
        status: true,
      },
    });

    const data = response.data?.data;

    if (Array.isArray(data)) {
      customers.value = data;
    } else if (Array.isArray(data?.customers)) {
      customers.value = data.customers;
    } else if (Array.isArray(response.data?.customers)) {
      customers.value = response.data.customers;
    } else {
      customers.value = [];
    }
  } catch (error) {
    console.error("Fetch customers error:", error);

    customers.value = [];
  } finally {
    customerLoading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Fetch report
|--------------------------------------------------------------------------
*/

const fetchReport = async () => {
  try {
    loading.value = true;

    errorMessage.value = "";

    const start = dateRange.value?.[0] || null;

    const end = dateRange.value?.[1] || dateRange.value?.[0] || null;

    const params = {
      page: page.value,

      limit: limit.value,
    };

    if (customerId.value) {
      params.customerId = customerId.value;
    }

    if (start) {
      params.dateFrom = formatDateForApi(start);
    }

    if (end) {
      params.dateTo = formatDateForApi(end);
    }

    const response = await api.get("/reports/customer-deposits", {
      params,
    });

    transactions.value = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    totalRecords.value = Number(
      response.data?.pagination?.total || transactions.value.length,
    );
  } catch (error) {
    console.error("Fetch customer deposit report error:", error);

    transactions.value = [];

    totalRecords.value = 0;

    errorMessage.value =
      error.response?.data?.message || t("customerDepositReport.errors.fetch");
  } finally {
    loading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const applyFilters = async () => {
  page.value = 1;

  await fetchReport();
};

const resetFilters = async () => {
  customerId.value = null;

  dateRange.value = getCurrentWeekRange();

  page.value = 1;

  await fetchReport();
};

const onPageChange = async (event) => {
  page.value = event.page + 1;

  limit.value = event.rows;

  await fetchReport();
};

/*
|--------------------------------------------------------------------------
| Print
|--------------------------------------------------------------------------
|
| Print includes only:
| - report title
| - selected customer/date range
| - transaction table
|
| No summary cards.
| No summary boxes.
|
*/

const buildPrintHtml = () => {
  const rows = transactions.value
    .map((transaction, index) => {
      return `
              <tr>
                <td class="center">
                  ${(page.value - 1) * limit.value + index + 1}
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      transaction.transactionDate || transaction.createdAt,
                    ),
                  )}
                </td>

                <td>
                  ${escapeHtml(getCustomerLabel(transaction.customerId))}
                </td>

                <td class="amount">
                  ${escapeHtml(formatMoney(transaction.amount))}
                </td>

                <td class="amount">
                  ${escapeHtml(formatMoney(transaction.oldBalance))}
                </td>

                <td class="amount">
                  ${escapeHtml(formatMoney(transaction.newBalance))}
                </td>

                
              </tr>
            `;
    })
    .join("");

  return `
      <!DOCTYPE html>

      <html
        lang="${locale.value === "km" ? "km" : "en"}"
      >
        <head>
          <meta charset="UTF-8" />

          <title>
            ${escapeHtml(t("customerDepositReport.title"))}
          </title>

          <style>
            * {
              box-sizing:
                border-box;
            }

            body {
              margin:
                0;

              padding:
                18px;

              color:
                #111827;

              font-family:
                "Noto Sans Khmer",
                "Khmer OS Battambang",
                "Inter",
                Arial,
                sans-serif;
            }

            .report {
              width:
                100%;

              max-width:
                1100px;

              margin:
                0 auto;
            }

            h1 {
              margin:
                0;

              text-align:
                center;

              font-size:
                20px;
            }

            .subtitle {
              margin-top:
                6px;

              margin-bottom:
                16px;

              text-align:
                center;

              font-size:
                12px;

              color:
                #6b7280;
            }

            table {
              width:
                100%;

              border-collapse:
                collapse;

              font-size:
                12px;
            }

            th,
            td {
              border:
                1px solid
                #d1d5db;

              padding:
                7px;

              vertical-align:
                middle;
            }

            th {
              background:
                #f3f4f6;

              font-weight:
                800;

              text-align:
                center;
            }

            .center {
              text-align:
                center;
            }

            .amount {
              text-align:
                right;

              font-weight:
                700;
            }

            .empty {
              padding:
                22px;

              text-align:
                center;

              color:
                #6b7280;
            }

            @media print {
              body {
                padding:
                  0;
              }

              @page {
                size:
                  landscape;

                margin:
                  8mm;
              }
            }
          </style>
        </head>

        <body>
          <div
            class="report"
          >
            <h1>
              ${escapeHtml(t("customerDepositReport.title"))}
            </h1>

            <div
              class="subtitle"
            >
              ${escapeHtml(selectedCustomerName.value)}

              |

              ${escapeHtml(currentRangeText.value)}
            </div>

            <table>
              <thead>
                <tr>
                  <th
                    style="width: 50px;"
                  >
                    #
                  </th>

                  <th
                    style="width: 150px;"
                  >
                    ${escapeHtml(t("customerDepositReport.fields.date"))}
                  </th>

                  <th>
                    ${escapeHtml(t("customerDepositReport.fields.customer"))}
                  </th>

                  <th
                    style="width: 120px;"
                  >
                    ${escapeHtml(t("customerDepositReport.fields.loanDeposit"))}
                  </th>

                  <th
                    style="width: 110px;"
                  >
                    ${escapeHtml(t("customerDepositReport.fields.before"))}
                  </th>

                  <th
                    style="width: 110px;"
                  >
                    ${escapeHtml(t("customerDepositReport.fields.after"))}
                  </th>

                 
                </tr>
              </thead>

              <tbody>
                ${
                  rows ||
                  `
                    <tr>
                      <td
                        colspan="7"
                        class="empty"
                      >
                        ${escapeHtml(t("customerDepositReport.empty"))}
                      </td>
                    </tr>
                  `
                }
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
};

const printReport = () => {
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    errorMessage.value = t("customerDepositReport.errors.popupBlocked");

    return;
  }

  printWindow.document.open();

  printWindow.document.write(buildPrintHtml());

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/*
|--------------------------------------------------------------------------
| Load
|--------------------------------------------------------------------------
*/

onMounted(async () => {
  await Promise.all([fetchCustomers(), fetchReport()]);
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-3 sm:p-4 lg:p-6">
    <div class="space-y-4">
      <!--
      ========================================================================
      Header
      ========================================================================
      -->

      <Card>
        <template #content>
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
              >
                <i class="pi pi-chart-bar text-xl"></i>
              </div>

              <div>
                <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">
                  {{ t("customerDepositReport.title") }}
                </h1>

                <p class="mt-1 text-sm text-slate-500">
                  {{ t("customerDepositReport.currentWeekHint") }}
                </p>
              </div>
            </div>

            <Button
              type="button"
              :label="t('customerDepositReport.actions.print')"
              icon="pi pi-print"
              severity="secondary"
              outlined
              :disabled="loading"
              @click="printReport"
            />
          </div>
        </template>
      </Card>

      <!-- Error -->

      <Message
        v-if="errorMessage"
        severity="error"
        closable
        @close="errorMessage = ''"
      >
        {{ errorMessage }}
      </Message>

      <!--
      ========================================================================
      Filters
      ========================================================================
      -->

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-emerald-600"></i>

            <span>
              {{ t("customerDepositReport.filters.title") }}
            </span>
          </div>
        </template>

        <template #content>
          <div
            class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_auto]"
          >
            <!-- Customer -->

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">
                {{ t("customerDepositReport.fields.customer") }}
              </label>

              <Select
                v-model="customerId"
                :options="customerOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('customerDepositReport.filters.allCustomers')"
                class="w-full"
                appendTo="body"
                showClear
                filter
                :loading="customerLoading"
              />
            </div>

            <!-- Date range -->

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">
                {{ t("customerDepositReport.fields.dateRange") }}
              </label>

              <DatePicker
                v-model="dateRange"
                selectionMode="range"
                dateFormat="yy-mm-dd"
                class="w-full"
                input-class="w-full"
                appendTo="body"
                showIcon
                iconDisplay="input"
                showButtonBar
                fluid
                :manualInput="false"
              />
            </div>

            <!-- Buttons -->

            <div class="grid grid-cols-2 gap-2 self-end">
              <Button
                type="button"
                :label="t('customerDepositReport.actions.search')"
                icon="pi pi-search"
                :loading="loading"
                @click="applyFilters"
              />

              <Button
                type="button"
                :label="t('customerDepositReport.actions.reset')"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                :disabled="loading"
                @click="resetFilters"
              />
            </div>
          </div>
        </template>
      </Card>

      <!--
      ========================================================================
      Transaction table
      ========================================================================
      -->

      <Card>
        <template #title>
          <div
            class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              {{ t("customerDepositReport.transactionsTitle") }}
            </span>

            <span class="text-sm font-normal text-slate-500">
              {{ selectedCustomerName }}

              ·

              {{ currentRangeText }}
            </span>
          </div>
        </template>

        <template #content>
          <!--
          ====================================================================
          Mobile transactions
          ====================================================================
          -->

          <div class="space-y-3 md:hidden">
            <div v-if="loading" class="py-10 text-center text-slate-500">
              <i class="pi pi-spin pi-spinner text-2xl"></i>

              <div class="mt-2 text-sm">
                {{ t("customerDepositReport.loading") }}
              </div>
            </div>

            <template v-else>
              <article
                v-for="transaction in transactions"
                :key="transaction._id || transaction.id"
                class="rounded-xl border border-slate-200 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate font-bold text-slate-900">
                      {{ getCustomerLabel(transaction.customerId) }}
                    </div>

                    <div class="mt-1 text-xs text-slate-500">
                      {{
                        formatDate(
                          transaction.transactionDate || transaction.createdAt,
                        )
                      }}
                    </div>
                  </div>

                  <div class="shrink-0 text-xl font-extrabold text-emerald-700">
                    {{ formatMoney(transaction.amount) }}
                  </div>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <div class="rounded-lg bg-slate-50 p-2">
                    <div class="text-xs text-slate-500">
                      {{ t("customerDepositReport.fields.before") }}
                    </div>

                    <div class="mt-1 font-semibold">
                      {{ formatMoney(transaction.oldBalance) }}
                    </div>
                  </div>

                  <div class="rounded-lg bg-slate-50 p-2">
                    <div class="text-xs text-slate-500">
                      {{ t("customerDepositReport.fields.after") }}
                    </div>

                    <div class="mt-1 font-semibold">
                      {{ formatMoney(transaction.newBalance) }}
                    </div>
                  </div>
                </div>

                <!-- <div class="mt-3">
                  <div class="text-xs text-slate-500">
                    {{ t("customerDepositReport.fields.description") }}
                  </div>

                  <div class="mt-1 text-sm text-slate-700">
                    {{
                      transaction.description ||
                      t("customerDepositReport.defaults.description")
                    }}
                  </div>
                </div> -->
              </article>

              <div
                v-if="!transactions.length"
                class="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500"
              >
                {{ t("customerDepositReport.empty") }}
              </div>
            </template>
          </div>

          <!--
          ====================================================================
          Desktop table
          ====================================================================
          -->

          <div class="hidden md:block">
            <DataTable
              :value="transactions"
              :loading="loading"
              lazy
              paginator
              dataKey="_id"
              :rows="limit"
              :first="(page - 1) * limit"
              :totalRecords="totalRecords"
              :rowsPerPageOptions="[10, 20, 50, 100]"
              tableStyle="min-width: 980px"
              @page="onPageChange"
            >
              <Column
                :header="t('customerDepositReport.fields.date')"
                style="min-width: 165px"
              >
                <template #body="{ data }">
                  {{ formatDate(data.transactionDate || data.createdAt) }}
                </template>
              </Column>

              <Column
                :header="t('customerDepositReport.fields.customer')"
                style="min-width: 180px"
              >
                <template #body="{ data }">
                  <div class="font-semibold">
                    {{ getCustomerLabel(data.customerId) }}
                  </div>
                </template>
              </Column>

              <Column
                :header="t('customerDepositReport.fields.loanDeposit')"
                style="min-width: 140px"
              >
                <template #body="{ data }">
                  <span class="font-bold text-emerald-700">
                    {{ formatMoney(data.amount) }}
                  </span>
                </template>
              </Column>

              <Column
                :header="t('customerDepositReport.fields.before')"
                style="min-width: 120px"
              >
                <template #body="{ data }">
                  {{ formatMoney(data.oldBalance) }}
                </template>
              </Column>

              <Column
                :header="t('customerDepositReport.fields.after')"
                style="min-width: 120px"
              >
                <template #body="{ data }">
                  <span class="font-semibold">
                    {{ formatMoney(data.newBalance) }}
                  </span>
                </template>
              </Column>

              <!-- <Column
                field="description"
                :header="t('customerDepositReport.fields.description')"
                style="min-width: 220px"
              >
                <template #body="{ data }">
                  {{
                    data.description ||
                    t("customerDepositReport.defaults.description")
                  }}
                </template>
              </Column> -->

              <template #empty>
                <div class="py-10 text-center text-slate-500">
                  {{ t("customerDepositReport.empty") }}
                </div>
              </template>
            </DataTable>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-datepicker) {
  min-height: 44px;
}

:deep(.p-select),
:deep(.p-datepicker) {
  width: 100%;
}
</style>

<style>
.p-select-overlay,
.p-datepicker-panel {
  z-index: 30000 !important;
}
</style>
