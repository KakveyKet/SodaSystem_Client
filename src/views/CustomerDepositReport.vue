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
import Tag from "primevue/tag";

import api from "../services/api";

const { t, locale } = useI18n();

const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getCurrentWeekRange = () => {
  const today = getToday();
  const monday = new Date(today);
  const weekday = monday.getDay();
  const difference = weekday === 0 ? -6 : 1 - weekday;

  monday.setDate(monday.getDate() + difference);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return [monday, sunday];
};

const formatDateForApi = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(
    locale.value === "km" ? "km-KH" : "en-GB",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatSignedMoney = (value) => {
  const number = Number(value || 0);
  const absolute = Math.abs(number).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (number > 0) return `+${absolute}`;
  if (number < 0) return `-${absolute}`;
  return "0";
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getCustomerLabel = (customer) => {
  if (!customer) {
    return t("customerTransactionReport.defaults.deletedCustomer");
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

const getSignedAmount = (transaction) => {
  if (
    transaction?.signedAmount !== null &&
    transaction?.signedAmount !== undefined &&
    Number.isFinite(Number(transaction.signedAmount))
  ) {
    return Number(transaction.signedAmount);
  }

  if (
    transaction?.balanceDelta !== null &&
    transaction?.balanceDelta !== undefined &&
    Number.isFinite(Number(transaction.balanceDelta))
  ) {
    return Number(transaction.balanceDelta);
  }

  const amount = Number(transaction?.amount || 0);
  return transaction?.operation === "withdraw"
    ? -Math.abs(amount)
    : Math.abs(amount);
};

const getTypeLabel = (transaction) => {
  if (transaction?.operation === "invoice") {
    return t("customerTransactionReport.types.invoice");
  }

  if (transaction?.operation === "withdraw") {
    return t("customerTransactionReport.types.withdraw");
  }

  return t("customerTransactionReport.types.deposit");
};

const getTypeSeverity = (transaction) => {
  if (transaction?.operation === "invoice") return "info";
  if (transaction?.operation === "withdraw") return "danger";
  return "success";
};

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

const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    label: getCustomerLabel(customer),
    value: String(customer._id || customer.id),
  })),
);

const selectedCustomerName = computed(() => {
  if (!customerId.value) {
    return t("customerTransactionReport.filters.allCustomers");
  }

  return (
    customerOptions.value.find(
      (item) => String(item.value) === String(customerId.value),
    )?.label || t("customerTransactionReport.fields.customer")
  );
});

const currentRangeText = computed(() => {
  const start = dateRange.value?.[0];
  const end = dateRange.value?.[1] || dateRange.value?.[0];

  return `${formatDateForApi(start)} → ${formatDateForApi(end)}`;
});

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

    customers.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.customers)
        ? data.customers
        : Array.isArray(response.data?.customers)
          ? response.data.customers
          : [];
  } catch (error) {
    console.error("Fetch customers error:", error);
    customers.value = [];
  } finally {
    customerLoading.value = false;
  }
};

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

    if (customerId.value) params.customerId = customerId.value;
    if (start) params.dateFrom = formatDateForApi(start);
    if (end) params.dateTo = formatDateForApi(end);

    const response = await api.get(
      "/reports/customer-transactions",
      { params },
    );

    transactions.value = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    totalRecords.value = Number(
      response.data?.pagination?.total || 0,
    );
  } catch (error) {
    console.error("Fetch customer transaction report error:", error);

    transactions.value = [];
    totalRecords.value = 0;
    errorMessage.value =
      error.response?.data?.message ||
      t("customerTransactionReport.errors.fetch");
  } finally {
    loading.value = false;
  }
};

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

const buildPrintHtml = () => {
  const rows = transactions.value
    .map((transaction, index) => {
      const signedAmount = getSignedAmount(transaction);

      return `
        <tr>
          <td class="center">${(page.value - 1) * limit.value + index + 1}</td>
          <td>${escapeHtml(formatDate(transaction.transactionDate || transaction.createdAt))}</td>
          <td>${escapeHtml(getCustomerLabel(transaction.customerId))}</td>
          <td class="center">${escapeHtml(getTypeLabel(transaction))}</td>
          <td class="amount ${signedAmount < 0 ? "negative" : "positive"}">${escapeHtml(formatSignedMoney(signedAmount))}</td>
          <td class="amount">${escapeHtml(formatMoney(transaction.oldBalance))}</td>
          <td class="amount">${escapeHtml(formatMoney(transaction.newBalance))}</td>
          <td>${escapeHtml(transaction.description || "-")}</td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
  <html lang="${locale.value === "km" ? "km" : "en"}">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(t("customerTransactionReport.title"))}</title>
      <style>
        *{box-sizing:border-box}
        body{margin:0;padding:18px;color:#111827;font-family:"Noto Sans Khmer","Khmer OS Battambang",Inter,Arial,sans-serif}
        .report{width:100%;max-width:1200px;margin:auto}
        h1{margin:0;text-align:center;font-size:20px}
        .subtitle{margin:6px 0 16px;text-align:center;font-size:12px;color:#6b7280}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border:1px solid #d1d5db;padding:6px;vertical-align:middle}
        th{background:#f3f4f6;font-weight:800;text-align:center}
        .center{text-align:center}.amount{text-align:right;font-weight:700}
        .positive{color:#047857}.negative{color:#dc2626}
        .empty{padding:22px;text-align:center;color:#6b7280}
        @media print{body{padding:0}@page{size:landscape;margin:8mm}}
      </style>
    </head>
    <body>
      <div class="report">
        <h1>${escapeHtml(t("customerTransactionReport.title"))}</h1>
        <div class="subtitle">${escapeHtml(selectedCustomerName.value)} | ${escapeHtml(currentRangeText.value)}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.date"))}</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.customer"))}</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.type"))}</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.change"))}</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.before"))}</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.after"))}</th>
              <th>${escapeHtml(t("customerTransactionReport.fields.description"))}</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="8" class="empty">${escapeHtml(t("customerTransactionReport.empty"))}</td></tr>`}
          </tbody>
        </table>
      </div>
    </body>
  </html>`;
};

const printReport = () => {
  const printWindow = window.open(
    "",
    "_blank",
    "width=1200,height=800",
  );

  if (!printWindow) {
    errorMessage.value = t(
      "customerTransactionReport.errors.popupBlocked",
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintHtml());
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => printWindow.print(), 250);
};

onMounted(async () => {
  await Promise.all([
    fetchCustomers(),
    fetchReport(),
  ]);
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-3 sm:p-4 lg:p-6">
    <div class="space-y-4">
      <Card>
        <template #content>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <i class="pi pi-chart-bar text-xl"></i>
              </div>

              <div>
                <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">
                  {{ t("customerTransactionReport.title") }}
                </h1>
                <p class="mt-1 text-sm text-slate-500">
                  {{ t("customerTransactionReport.currentWeekHint") }}
                </p>
              </div>
            </div>

            <Button
              type="button"
              :label="t('customerTransactionReport.actions.print')"
              icon="pi pi-print"
              severity="secondary"
              outlined
              :disabled="loading"
              @click="printReport"
            />
          </div>
        </template>
      </Card>

      <Message
        v-if="errorMessage"
        severity="error"
        closable
        @close="errorMessage = ''"
      >
        {{ errorMessage }}
      </Message>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-emerald-600"></i>
            <span>{{ t("customerTransactionReport.filters.title") }}</span>
          </div>
        </template>

        <template #content>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_auto]">
            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">
                {{ t("customerTransactionReport.fields.customer") }}
              </label>

              <Select
                v-model="customerId"
                :options="customerOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('customerTransactionReport.filters.allCustomers')"
                class="w-full"
                appendTo="body"
                showClear
                filter
                :loading="customerLoading"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">
                {{ t("customerTransactionReport.fields.dateRange") }}
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

            <div class="grid grid-cols-2 gap-2 self-end">
              <Button
                type="button"
                :label="t('customerTransactionReport.actions.search')"
                icon="pi pi-search"
                :loading="loading"
                @click="applyFilters"
              />

              <Button
                type="button"
                :label="t('customerTransactionReport.actions.reset')"
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

      <Card>
        <template #title>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>{{ t("customerTransactionReport.transactionsTitle") }}</span>
            <span class="text-sm font-normal text-slate-500">
              {{ selectedCustomerName }} · {{ currentRangeText }}
            </span>
          </div>
        </template>

        <template #content>
          <div class="space-y-3 md:hidden">
            <div v-if="loading" class="py-10 text-center text-slate-500">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
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
                      {{ formatDate(transaction.transactionDate || transaction.createdAt) }}
                    </div>
                    <Tag
                      class="mt-2"
                      :value="getTypeLabel(transaction)"
                      :severity="getTypeSeverity(transaction)"
                    />
                  </div>

                  <div
                    class="shrink-0 text-xl font-extrabold"
                    :class="getSignedAmount(transaction) < 0 ? 'text-red-600' : 'text-emerald-700'"
                  >
                    {{ formatSignedMoney(getSignedAmount(transaction)) }}
                  </div>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <div class="rounded-lg bg-slate-50 p-2">
                    <div class="text-xs text-slate-500">
                      {{ t("customerTransactionReport.fields.before") }}
                    </div>
                    <div class="mt-1 font-semibold">
                      {{ formatMoney(transaction.oldBalance) }}
                    </div>
                  </div>

                  <div class="rounded-lg bg-slate-50 p-2">
                    <div class="text-xs text-slate-500">
                      {{ t("customerTransactionReport.fields.after") }}
                    </div>
                    <div class="mt-1 font-semibold">
                      {{ formatMoney(transaction.newBalance) }}
                    </div>
                  </div>
                </div>

                <div v-if="transaction.description" class="mt-3 text-sm text-slate-600">
                  {{ transaction.description }}
                </div>
              </article>

              <div
                v-if="!transactions.length"
                class="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500"
              >
                {{ t("customerTransactionReport.empty") }}
              </div>
            </template>
          </div>

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
              tableStyle="min-width: 1100px"
              @page="onPageChange"
            >
              <Column :header="t('customerTransactionReport.fields.date')" style="min-width: 165px">
                <template #body="{ data }">
                  {{ formatDate(data.transactionDate || data.createdAt) }}
                </template>
              </Column>

              <Column :header="t('customerTransactionReport.fields.customer')" style="min-width: 180px">
                <template #body="{ data }">
                  <span class="font-semibold">{{ getCustomerLabel(data.customerId) }}</span>
                </template>
              </Column>

              <Column :header="t('customerTransactionReport.fields.type')" style="min-width: 125px">
                <template #body="{ data }">
                  <Tag :value="getTypeLabel(data)" :severity="getTypeSeverity(data)" />
                </template>
              </Column>

              <Column :header="t('customerTransactionReport.fields.change')" style="min-width: 130px">
                <template #body="{ data }">
                  <span
                    class="font-bold"
                    :class="getSignedAmount(data) < 0 ? 'text-red-600' : 'text-emerald-700'"
                  >
                    {{ formatSignedMoney(getSignedAmount(data)) }}
                  </span>
                </template>
              </Column>

              <Column :header="t('customerTransactionReport.fields.before')" style="min-width: 120px">
                <template #body="{ data }">{{ formatMoney(data.oldBalance) }}</template>
              </Column>

              <Column :header="t('customerTransactionReport.fields.after')" style="min-width: 120px">
                <template #body="{ data }">
                  <span class="font-semibold">{{ formatMoney(data.newBalance) }}</span>
                </template>
              </Column>

              <Column field="description" :header="t('customerTransactionReport.fields.description')" style="min-width: 240px">
                <template #body="{ data }">{{ data.description || "-" }}</template>
              </Column>

              <template #empty>
                <div class="py-10 text-center text-slate-500">
                  {{ t("customerTransactionReport.empty") }}
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
