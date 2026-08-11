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
import CustomerBottomNav from "../components/CustomerBottomNav.vue";

const { t, locale } = useI18n({
  useScope: "local",
  inheritLocale: true,
  messages: {
    en: {
      report: {
        title: "My Report",
        subtitle: "Your balance transaction history",
        filters: "Filters",
        dateRange: "Date Range",
        type: "Type",
        allTypes: "All Types",
        search: "Search",
        reset: "Reset",
        transactions: "Transactions",
        date: "Date",
        reference: "Reference",
        change: "Change",
        before: "Before",
        after: "After",
        description: "Description",
        deposit: "Deposit",
        withdraw: "Withdraw",
        invoice: "Invoice",
        empty: "No transactions found for this period.",
        loading: "Loading transactions...",
        error: "Could not load your report",
      },
    },
    km: {
      report: {
        title: "របាយការណ៍របស់ខ្ញុំ",
        subtitle: "ប្រវត្តិប្រតិបត្តិការសមតុល្យរបស់អ្នក",
        filters: "តម្រង",
        dateRange: "ចន្លោះកាលបរិច្ឆេទ",
        type: "ប្រភេទ",
        allTypes: "ប្រភេទទាំងអស់",
        search: "ស្វែងរក",
        reset: "កំណត់ឡើងវិញ",
        transactions: "ប្រតិបត្តិការ",
        date: "កាលបរិច្ឆេទ",
        reference: "ឯកសារយោង",
        change: "ចំនួនផ្លាស់ប្តូរ",
        before: "សមតុល្យមុន",
        after: "សមតុល្យក្រោយ",
        description: "បរិយាយ",
        deposit: "ប្រាក់ដាក់",
        withdraw: "ដកប្រាក់",
        invoice: "វិក្កយបត្រ",
        empty: "មិនមានប្រតិបត្តិការសម្រាប់រយៈពេលនេះទេ។",
        loading: "កំពុងផ្ទុកប្រតិបត្តិការ...",
        error: "មិនអាចផ្ទុករបាយការណ៍របស់អ្នកបានទេ",
      },
    },
  },
});

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
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(locale.value === "km" ? "km-KH" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const loading = ref(false);
const errorMessage = ref("");
const transactions = ref([]);
const dateRange = ref(getCurrentWeekRange());
const operation = ref(null);
const page = ref(1);
const limit = ref(20);
const totalRecords = ref(0);

const operationOptions = computed(() => [
  { label: t("report.allTypes"), value: null },
  { label: t("report.deposit"), value: "deposit" },
  { label: t("report.withdraw"), value: "withdraw" },
  { label: t("report.invoice"), value: "invoice" },
]);

const getOperationLabel = (value) => {
  if (value === "deposit") return t("report.deposit");
  if (value === "withdraw") return t("report.withdraw");
  if (value === "invoice") return t("report.invoice");
  return value || "-";
};

const getOperationSeverity = (value) => {
  if (value === "deposit") return "success";
  if (value === "withdraw") return "danger";
  if (value === "invoice") return "info";
  return "secondary";
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

  const amount = Math.abs(Number(transaction?.amount || 0));
  return transaction?.operation === "withdraw" ? -amount : amount;
};

const formatSignedMoney = (transaction) => {
  const value = getSignedAmount(transaction);
  if (value > 0) return `+${formatMoney(value)}`;
  return formatMoney(value);
};

const getReference = (transaction) => {
  if (transaction?.invoiceTitle) return transaction.invoiceTitle;
  if (transaction?.invoiceId?.title) return transaction.invoiceId.title;
  if (transaction?.source) return transaction.source.replaceAll("_", " ");
  return "-";
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

    if (start) params.dateFrom = formatDateForApi(start);
    if (end) params.dateTo = formatDateForApi(end);
    if (operation.value) params.operation = operation.value;

    const response = await api.get("/reports/my-transactions", { params });

    transactions.value = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    totalRecords.value = Number(response.data?.pagination?.total || 0);
  } catch (error) {
    console.error("Fetch customer report error:", error);
    transactions.value = [];
    totalRecords.value = 0;
    errorMessage.value =
      error.response?.data?.message || error.message || t("report.error");
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  page.value = 1;
  await fetchReport();
};

const resetFilters = async () => {
  dateRange.value = getCurrentWeekRange();
  operation.value = null;
  page.value = 1;
  await fetchReport();
};

const onPageChange = async (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;
  await fetchReport();
};

onMounted(fetchReport);
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pt-6">
    <div class="mx-auto w-full max-w-6xl space-y-4">
      <div class="px-1">
        <h1 class="text-2xl font-extrabold text-slate-900">
          {{ t("report.title") }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ t("report.subtitle") }}
        </p>
      </div>

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
            <span>{{ t("report.filters") }}</span>
          </div>
        </template>

        <template #content>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(200px,0.7fr)_auto]">
            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">
                {{ t("report.dateRange") }}
              </label>
              <DatePicker
                v-model="dateRange"
                selectionMode="range"
                dateFormat="yy-mm-dd"
                class="w-full"
                input-class="w-full"
                appendTo="body"
                showIcon
                showButtonBar
                :manualInput="false"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">
                {{ t("report.type") }}
              </label>
              <Select
                v-model="operation"
                :options="operationOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                appendTo="body"
              />
            </div>

            <div class="grid grid-cols-2 gap-2 self-end">
              <Button
                :label="t('report.search')"
                icon="pi pi-search"
                :loading="loading"
                @click="applyFilters"
              />
              <Button
                :label="t('report.reset')"
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
          {{ t("report.transactions") }}
        </template>

        <template #content>
          <div class="space-y-3 md:hidden">
            <div v-if="loading" class="py-10 text-center text-slate-500">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
              <div class="mt-2 text-sm">{{ t("report.loading") }}</div>
            </div>

            <template v-else>
              <article
                v-for="transaction in transactions"
                :key="transaction._id || transaction.id"
                class="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <Tag
                      :value="getOperationLabel(transaction.operation)"
                      :severity="getOperationSeverity(transaction.operation)"
                    />
                    <div class="mt-2 truncate font-bold text-slate-900">
                      {{ getReference(transaction) }}
                    </div>
                    <div class="mt-1 text-xs text-slate-500">
                      {{ formatDate(transaction.transactionDate || transaction.createdAt) }}
                    </div>
                  </div>

                  <div
                    :class="[
                      'shrink-0 text-xl font-black',
                      getSignedAmount(transaction) < 0
                        ? 'text-rose-600'
                        : 'text-emerald-600',
                    ]"
                  >
                    {{ formatSignedMoney(transaction) }}
                  </div>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <div class="rounded-xl bg-slate-50 p-3">
                    <div class="text-xs text-slate-500">{{ t("report.before") }}</div>
                    <div class="mt-1 font-bold">{{ formatMoney(transaction.oldBalance) }}</div>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-3">
                    <div class="text-xs text-slate-500">{{ t("report.after") }}</div>
                    <div class="mt-1 font-bold">{{ formatMoney(transaction.newBalance) }}</div>
                  </div>
                </div>

                <p v-if="transaction.description" class="mt-3 text-sm text-slate-600">
                  {{ transaction.description }}
                </p>
              </article>

              <div
                v-if="!transactions.length"
                class="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500"
              >
                {{ t("report.empty") }}
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
              tableStyle="min-width: 1000px"
              @page="onPageChange"
            >
              <Column :header="t('report.date')" style="min-width: 160px">
                <template #body="{ data }">
                  {{ formatDate(data.transactionDate || data.createdAt) }}
                </template>
              </Column>

              <Column :header="t('report.type')" style="min-width: 120px">
                <template #body="{ data }">
                  <Tag
                    :value="getOperationLabel(data.operation)"
                    :severity="getOperationSeverity(data.operation)"
                  />
                </template>
              </Column>

              <Column :header="t('report.reference')" style="min-width: 190px">
                <template #body="{ data }">
                  <span class="font-semibold">{{ getReference(data) }}</span>
                </template>
              </Column>

              <Column :header="t('report.change')" style="min-width: 130px">
                <template #body="{ data }">
                  <span
                    :class="[
                      'font-black',
                      getSignedAmount(data) < 0 ? 'text-rose-600' : 'text-emerald-600',
                    ]"
                  >
                    {{ formatSignedMoney(data) }}
                  </span>
                </template>
              </Column>

              <Column :header="t('report.before')" style="min-width: 120px">
                <template #body="{ data }">{{ formatMoney(data.oldBalance) }}</template>
              </Column>

              <Column :header="t('report.after')" style="min-width: 120px">
                <template #body="{ data }">
                  <span class="font-semibold">{{ formatMoney(data.newBalance) }}</span>
                </template>
              </Column>

              <Column field="description" :header="t('report.description')" style="min-width: 220px" />

              <template #empty>
                <div class="py-10 text-center text-slate-500">
                  {{ t("report.empty") }}
                </div>
              </template>
            </DataTable>
          </div>
        </template>
      </Card>
    </div>

    <CustomerBottomNav />
  </main>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-datepicker) {
  min-height: 44px;
}
</style>

<style>
.p-select-overlay,
.p-datepicker-panel {
  z-index: 30000 !important;
}
</style>
