<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";

import api from "../services/api";
import CustomerBottomNav from "../components/CustomerBottomNav.vue";

const { t, locale } = useI18n({
  useScope: "local",
  inheritLocale: true,
  messages: {
    en: {
      invoice: {
        title: "My Invoices",
        subtitle: "View and print your own invoices",
        filters: "Filters",
        searchPlaceholder: "Search invoice name...",
        dateRange: "Date Range",
        search: "Search",
        reset: "Reset",
        list: "Invoices",
        name: "Invoice Name",
        date: "Date",
        products: "Products",
        result: "Total Result",
        balanceAfter: "Balance After",
        actions: "Action",
        view: "View",
        print: "Print",
        close: "Close",
        loading: "Loading invoices...",
        empty: "No invoices found.",
        error: "Could not load your invoices",
        detailError: "Could not load invoice detail",
        rows: "Rows",
        category: "Category",
        row: "Row",
        twoD: "2D",
        threeD: "3D",
        correct2D: "Correct 2D",
        correct3D: "Correct 3D",
        invoiceTotal: "Invoice Total Result",
        balanceCalculation: "Customer Balance Calculation",
        balanceBefore: "Balance Before Invoice",
        balanceAfterInvoice: "Balance After Invoice",
        calculation: "Calculation",
      },
    },
    km: {
      invoice: {
        title: "វិក្កយបត្ររបស់ខ្ញុំ",
        subtitle: "មើល និងបោះពុម្ពវិក្កយបត្ររបស់អ្នក",
        filters: "តម្រង",
        searchPlaceholder: "ស្វែងរកឈ្មោះវិក្កយបត្រ...",
        dateRange: "ចន្លោះកាលបរិច្ឆេទ",
        search: "ស្វែងរក",
        reset: "កំណត់ឡើងវិញ",
        list: "វិក្កយបត្រ",
        name: "ឈ្មោះវិក្កយបត្រ",
        date: "កាលបរិច្ឆេទ",
        products: "ផលិតផល",
        result: "លទ្ធផលសរុប",
        balanceAfter: "សមតុល្យក្រោយ",
        actions: "សកម្មភាព",
        view: "មើល",
        print: "បោះពុម្ព",
        close: "បិទ",
        loading: "កំពុងផ្ទុកវិក្កយបត្រ...",
        empty: "មិនមានវិក្កយបត្រទេ។",
        error: "មិនអាចផ្ទុកវិក្កយបត្ររបស់អ្នកបានទេ",
        detailError: "មិនអាចផ្ទុកព័ត៌មានវិក្កយបត្របានទេ",
        rows: "ជួរ",
        category: "ប្រភេទ",
        row: "ជួរ",
        twoD: "2លេខ",
        threeD: "3លេខ",
        correct2D: "ត្រូវ2",
        correct3D: "ត្រូវ3",
        invoiceTotal: "លទ្ធផលសរុបវិក្កយបត្រ",
        balanceCalculation: "ការគណនាសមតុល្យអតិថិជន",
        balanceBefore: "សមតុល្យមុនវិក្កយបត្រ",
        balanceAfterInvoice: "សមតុល្យក្រោយវិក្កយបត្រ",
        calculation: "ការគណនា",
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

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale.value === "km" ? "km-KH" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatSigned = (value) => {
  const number = Number(value || 0);
  if (number > 0) return `+${formatMoney(number)}`;
  return formatMoney(number);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const loading = ref(false);
const detailLoading = ref(false);
const printingId = ref(null);
const errorMessage = ref("");
const invoices = ref([]);
const selectedInvoice = ref(null);
const detailVisible = ref(false);
const search = ref("");
const dateRange = ref(getCurrentWeekRange());
const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);

const totalPages = computed(() =>
  Math.max(Math.ceil(totalRecords.value / Math.max(limit.value, 1)), 1),
);

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value._id || value.id || null;
  return value;
};

const getProductNames = (invoice) => {
  const items = Array.isArray(invoice?.productIds) ? invoice.productIds : [];
  return items
    .map((product) => (typeof product === "object" ? product.name : ""))
    .filter(Boolean)
    .join(", ") || "-";
};

const getRowCategory = (row) => {
  const category = row?.categoryId || row?.category;

  if (category && typeof category === "object") {
    return {
      id: String(category._id || category.id || ""),
      name: category.name || "-",
    };
  }

  return {
    id: category ? String(category) : "",
    name: "-",
  };
};

const buildGroups = (invoice) => {
  const rows = Array.isArray(invoice?.rows) ? invoice.rows : [];
  const calcGroups = Array.isArray(invoice?.categoryGroups)
    ? invoice.categoryGroups
    : [];

  const map = new Map();

  rows.forEach((row) => {
    const category = getRowCategory(row);
    const key = category.id || "__uncategorized__";

    if (!map.has(key)) {
      map.set(key, {
        categoryId: category.id,
        categoryName: category.name,
        rows: [],
        calculation: null,
      });
    }

    const group = map.get(key);
    if (group.categoryName === "-" && category.name !== "-") {
      group.categoryName = category.name;
    }
    group.rows.push(row);
  });

  calcGroups.forEach((calcGroup) => {
    const key = String(calcGroup?.categoryId || "__uncategorized__");
    if (!map.has(key)) {
      map.set(key, {
        categoryId: calcGroup?.categoryId || null,
        categoryName: calcGroup?.categoryName || "-",
        rows: [],
        calculation: calcGroup?.calculation || null,
      });
      return;
    }

    const group = map.get(key);
    group.calculation = calcGroup?.calculation || null;
    if (calcGroup?.categoryName && calcGroup.categoryName !== "-") {
      group.categoryName = calcGroup.categoryName;
    }
  });

  return Array.from(map.values());
};

const getBalanceValues = (invoice) => {
  if (!invoice?.balanceApplied) return null;

  const totalResult = Number(invoice?.totalResult || invoice?.calculatedTotalResult || 0);
  const balanceAfter = Number(invoice?.balanceAfter);

  if (!Number.isFinite(balanceAfter)) return null;

  return {
    before: balanceAfter - totalResult,
    result: totalResult,
    after: balanceAfter,
  };
};

const fetchInvoices = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const start = dateRange.value?.[0] || null;
    const end = dateRange.value?.[1] || dateRange.value?.[0] || null;

    const params = {
      page: page.value,
      limit: limit.value,
    };

    if (search.value.trim()) params.search = search.value.trim();
    if (start) params.dateFrom = formatDateForApi(start);
    if (end) params.dateTo = formatDateForApi(end);

    const response = await api.get("/lottery-plays/me", { params });
    invoices.value = Array.isArray(response.data?.data) ? response.data.data : [];
    totalRecords.value = Number(response.data?.pagination?.total || 0);
  } catch (error) {
    console.error("Fetch customer invoices error:", error);
    invoices.value = [];
    totalRecords.value = 0;
    errorMessage.value =
      error.response?.data?.message || error.message || t("invoice.error");
  } finally {
    loading.value = false;
  }
};

const fetchInvoiceDetail = async (invoice) => {
  const id = getId(invoice);
  if (!id) throw new Error(t("invoice.detailError"));

  const response = await api.get(`/lottery-plays/me/${id}`);
  return response.data?.data || null;
};

const openDetail = async (invoice) => {
  try {
    detailLoading.value = true;
    errorMessage.value = "";
    selectedInvoice.value = await fetchInvoiceDetail(invoice);
    detailVisible.value = true;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || error.message || t("invoice.detailError");
  } finally {
    detailLoading.value = false;
  }
};

const buildPrintHtml = (invoice) => {
  const groups = buildGroups(invoice);
  const balance = getBalanceValues(invoice);
  const totalResult = Number(invoice?.totalResult || invoice?.calculatedTotalResult || 0);

  const sections = groups
    .map((group) => {
      const rows = group.rows
        .map(
          (row, index) => `
            <tr>
              <td class="center">(${index + 1})</td>
              <td>${escapeHtml(row.rowTitle || "-")}</td>
              <td class="num">${row.isTwoNumber ? formatMoney(row.twoDigitNumber) : ""}</td>
              <td class="num">${row.isThreeNumber ? formatMoney(row.threeDigitNumber) : ""}</td>
              <td class="num">${row.isTwoNumber ? formatMoney(row.winTwoNumberType) : ""}</td>
              <td class="num">${row.isThreeNumber ? formatMoney(row.winThreeNumberType) : ""}</td>
            </tr>
          `,
        )
        .join("");

      const calc = group.calculation || {};

      return `
        <section class="category">
          <div class="category-title">${escapeHtml(group.categoryName || "-")}</div>
          <table>
            <thead>
              <tr>
                <th style="width:52px">#</th>
                <th>${escapeHtml(t("invoice.row"))}</th>
                <th>${escapeHtml(t("invoice.twoD"))}</th>
                <th>${escapeHtml(t("invoice.threeD"))}</th>
                <th>${escapeHtml(t("invoice.correct2D"))}</th>
                <th>${escapeHtml(t("invoice.correct3D"))}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="category-result">
            ${escapeHtml(t("invoice.result"))}:
            <strong>${formatSigned(calc.grandTotal || 0)}</strong>
          </div>
        </section>
      `;
    })
    .join("");

  const balanceHtml = balance
    ? `
      <section class="balance-box">
        <h3>${escapeHtml(t("invoice.balanceCalculation"))}</h3>
        <div class="balance-row"><span>${escapeHtml(t("invoice.balanceBefore"))}</span><strong>${formatMoney(balance.before)}</strong></div>
        <div class="balance-row"><span>${escapeHtml(t("invoice.invoiceTotal"))}</span><strong>${formatSigned(balance.result)}</strong></div>
        <div class="balance-row final"><span>${escapeHtml(t("invoice.balanceAfterInvoice"))}</span><strong>${formatMoney(balance.after)}</strong></div>
        <div class="equation">
          ${formatMoney(balance.before)} + ${balance.result < 0 ? `(${formatMoney(balance.result)})` : formatMoney(balance.result)} = ${formatMoney(balance.after)}
        </div>
      </section>
    `
    : "";

  return `<!doctype html>
  <html lang="${locale.value === "km" ? "km" : "en"}">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(invoice?.title || t("invoice.name"))}</title>
      <style>
        *{box-sizing:border-box}
        body{margin:0;padding:18px;font-family:"Noto Sans Khmer","Khmer OS Battambang",Arial,sans-serif;color:#111827}
        .paper{max-width:820px;margin:auto}
        h1{text-align:center;margin:0;font-size:22px}
        .meta{text-align:center;margin:6px 0 18px;color:#64748b;font-size:12px}
        .category{margin-top:14px;break-inside:avoid}
        .category-title{font-size:15px;font-weight:900;margin-bottom:5px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #cbd5e1;padding:6px}
        th{background:#f8fafc}
        .center{text-align:center}.num{text-align:right}
        .category-result{text-align:right;margin-top:6px;font-size:13px}
        .invoice-total{margin-top:16px;border-top:2px solid #0f172a;padding-top:8px;text-align:center;font-size:20px;font-weight:900}
        .balance-box{margin-top:14px;border:2px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;break-inside:avoid}
        .balance-box h3{text-align:center;margin:0 0 8px;color:#166534;font-size:14px}
        .balance-row{display:flex;justify-content:space-between;gap:20px;padding:4px 0;font-size:13px}
        .balance-row.final{margin-top:4px;border-top:1px solid #86efac;padding-top:7px;font-size:15px}
        .equation{text-align:center;border-top:1px dashed #86efac;margin-top:8px;padding-top:8px;font-size:16px;font-weight:900}
        @media print{body{padding:0}@page{size:portrait;margin:7mm}}
      </style>
    </head>
    <body>
      <div class="paper">
        <h1>${escapeHtml(invoice?.title || t("invoice.name"))}</h1>
        <div class="meta">${escapeHtml(formatDate(invoice?.playDate || invoice?.createdAt))} · ${escapeHtml(getProductNames(invoice))}</div>
        ${sections}
        <div class="invoice-total">${escapeHtml(t("invoice.invoiceTotal"))}: ${formatSigned(totalResult)}</div>
        ${balanceHtml}
      </div>
    </body>
  </html>`;
};

const printInvoice = async (invoice) => {
  const id = getId(invoice);

  try {
    printingId.value = id;
    errorMessage.value = "";
    const detail = await fetchInvoiceDetail(invoice);

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) throw new Error("Popup blocked");

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(detail));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || t("invoice.detailError");
  } finally {
    printingId.value = null;
  }
};

const applyFilters = async () => {
  page.value = 1;
  await fetchInvoices();
};

const resetFilters = async () => {
  search.value = "";
  dateRange.value = getCurrentWeekRange();
  page.value = 1;
  await fetchInvoices();
};

const onPageChange = async (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;
  await fetchInvoices();
};

onMounted(fetchInvoices);
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pt-6">
    <div class="mx-auto w-full max-w-6xl space-y-4">
      <div class="px-1">
        <h1 class="text-2xl font-extrabold text-slate-900">{{ t("invoice.title") }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ t("invoice.subtitle") }}</p>
      </div>

      <Message v-if="errorMessage" severity="error" closable @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-emerald-600"></i>
            <span>{{ t("invoice.filters") }}</span>
          </div>
        </template>

        <template #content>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_auto]">
            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">{{ t("invoice.name") }}</label>
              <InputText
                v-model="search"
                class="w-full"
                :placeholder="t('invoice.searchPlaceholder')"
                @keyup.enter="applyFilters"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">{{ t("invoice.dateRange") }}</label>
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

            <div class="grid grid-cols-2 gap-2 self-end">
              <Button :label="t('invoice.search')" icon="pi pi-search" :loading="loading" @click="applyFilters" />
              <Button :label="t('invoice.reset')" icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="resetFilters" />
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>{{ t("invoice.list") }}</template>

        <template #content>
          <div class="space-y-3 md:hidden">
            <div v-if="loading" class="py-10 text-center text-slate-500">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
              <div class="mt-2 text-sm">{{ t("invoice.loading") }}</div>
            </div>

            <template v-else>
              <article
                v-for="invoice in invoices"
                :key="invoice._id || invoice.id"
                class="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate font-bold text-slate-900">{{ invoice.title || "-" }}</h2>
                    <p class="mt-1 text-xs text-slate-500">{{ formatDate(invoice.playDate || invoice.createdAt) }}</p>
                  </div>

                  <div
                    :class="[
                      'shrink-0 text-lg font-black',
                      Number(invoice.totalResult || 0) < 0 ? 'text-rose-600' : 'text-emerald-600',
                    ]"
                  >
                    {{ formatSigned(invoice.totalResult) }}
                  </div>
                </div>

                <div class="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <span class="text-slate-500">{{ t("invoice.products") }}:</span>
                  <span class="ml-1 font-semibold">{{ getProductNames(invoice) }}</span>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <Button :label="t('invoice.view')" icon="pi pi-eye" outlined @click="openDetail(invoice)" />
                  <Button
                    :label="t('invoice.print')"
                    icon="pi pi-print"
                    severity="secondary"
                    outlined
                    :loading="printingId === getId(invoice)"
                    @click="printInvoice(invoice)"
                  />
                </div>
              </article>

              <div v-if="!invoices.length" class="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                {{ t("invoice.empty") }}
              </div>
            </template>
          </div>

          <div class="hidden md:block">
            <DataTable
              :value="invoices"
              :loading="loading"
              lazy
              paginator
              dataKey="_id"
              :rows="limit"
              :first="(page - 1) * limit"
              :totalRecords="totalRecords"
              :rowsPerPageOptions="[5, 10, 20, 50]"
              tableStyle="min-width: 900px"
              @page="onPageChange"
            >
              <Column :header="t('invoice.name')" style="min-width: 200px">
                <template #body="{ data }"><span class="font-semibold">{{ data.title || "-" }}</span></template>
              </Column>
              <Column :header="t('invoice.date')" style="min-width: 130px">
                <template #body="{ data }">{{ formatDate(data.playDate || data.createdAt) }}</template>
              </Column>
              <Column :header="t('invoice.products')" style="min-width: 200px">
                <template #body="{ data }">{{ getProductNames(data) }}</template>
              </Column>
              <Column :header="t('invoice.result')" style="min-width: 140px">
                <template #body="{ data }">
                  <span :class="['font-black', Number(data.totalResult || 0) < 0 ? 'text-rose-600' : 'text-emerald-600']">
                    {{ formatSigned(data.totalResult) }}
                  </span>
                </template>
              </Column>
              <Column :header="t('invoice.balanceAfter')" style="min-width: 130px">
                <template #body="{ data }">{{ data.balanceAfter === null || data.balanceAfter === undefined ? "-" : formatMoney(data.balanceAfter) }}</template>
              </Column>
              <Column :header="t('invoice.actions')" style="min-width: 190px">
                <template #body="{ data }">
                  <div class="flex gap-2">
                    <Button icon="pi pi-eye" size="small" outlined @click="openDetail(data)" />
                    <Button icon="pi pi-print" size="small" severity="secondary" outlined :loading="printingId === getId(data)" @click="printInvoice(data)" />
                  </div>
                </template>
              </Column>

              <template #empty>
                <div class="py-10 text-center text-slate-500">{{ t("invoice.empty") }}</div>
              </template>
            </DataTable>
          </div>
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="detailVisible"
      modal
      :header="selectedInvoice?.title || t('invoice.view')"
      :style="{ width: '96vw', maxWidth: '900px' }"
      :breakpoints="{ '640px': '100vw' }"
      :draggable="false"
      appendTo="body"
    >
      <div v-if="detailLoading" class="py-12 text-center">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="selectedInvoice" class="space-y-4">
        <div class="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <div class="text-xs text-slate-500">{{ t("invoice.date") }}</div>
            <div class="mt-1 font-bold">{{ formatDate(selectedInvoice.playDate || selectedInvoice.createdAt) }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500">{{ t("invoice.products") }}</div>
            <div class="mt-1 font-bold">{{ getProductNames(selectedInvoice) }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500">{{ t("invoice.result") }}</div>
            <div class="mt-1 font-black">{{ formatSigned(selectedInvoice.totalResult) }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500">{{ t("invoice.balanceAfter") }}</div>
            <div class="mt-1 font-black">{{ selectedInvoice.balanceAfter === null || selectedInvoice.balanceAfter === undefined ? "-" : formatMoney(selectedInvoice.balanceAfter) }}</div>
          </div>
        </div>

        <section
          v-for="group in buildGroups(selectedInvoice)"
          :key="group.categoryId || group.categoryName"
          class="rounded-2xl border border-slate-200 p-3 sm:p-4"
        >
          <h3 class="font-extrabold text-slate-900">{{ group.categoryName }}</h3>

          <div class="mt-3 overflow-x-auto">
            <table class="w-full min-w-[650px] border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-200 p-2 text-left">#</th>
                  <th class="border border-slate-200 p-2 text-left">{{ t("invoice.row") }}</th>
                  <th class="border border-slate-200 p-2">{{ t("invoice.twoD") }}</th>
                  <th class="border border-slate-200 p-2">{{ t("invoice.threeD") }}</th>
                  <th class="border border-slate-200 p-2">{{ t("invoice.correct2D") }}</th>
                  <th class="border border-slate-200 p-2">{{ t("invoice.correct3D") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in group.rows" :key="row._id || `${group.categoryId}-${index}`">
                  <td class="border border-slate-200 p-2">{{ index + 1 }}</td>
                  <td class="border border-slate-200 p-2 font-semibold">{{ row.rowTitle }}</td>
                  <td class="border border-slate-200 p-2 text-right">{{ row.isTwoNumber ? formatMoney(row.twoDigitNumber) : "" }}</td>
                  <td class="border border-slate-200 p-2 text-right">{{ row.isThreeNumber ? formatMoney(row.threeDigitNumber) : "" }}</td>
                  <td class="border border-slate-200 p-2 text-right">{{ row.isTwoNumber ? formatMoney(row.winTwoNumberType) : "" }}</td>
                  <td class="border border-slate-200 p-2 text-right">{{ row.isThreeNumber ? formatMoney(row.winThreeNumberType) : "" }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-3 text-right font-black">
            {{ t("invoice.result") }}: {{ formatSigned(group.calculation?.grandTotal || 0) }}
          </div>
        </section>

        <div class="rounded-2xl bg-slate-900 p-4 text-center text-white">
          <div class="text-sm text-slate-300">{{ t("invoice.invoiceTotal") }}</div>
          <div class="mt-1 text-2xl font-black">{{ formatSigned(selectedInvoice.totalResult) }}</div>
        </div>

        <div v-if="getBalanceValues(selectedInvoice)" class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <h3 class="text-center font-black text-emerald-800">{{ t("invoice.balanceCalculation") }}</h3>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between gap-3"><span>{{ t("invoice.balanceBefore") }}</span><strong>{{ formatMoney(getBalanceValues(selectedInvoice).before) }}</strong></div>
            <div class="flex justify-between gap-3"><span>{{ t("invoice.invoiceTotal") }}</span><strong>{{ formatSigned(getBalanceValues(selectedInvoice).result) }}</strong></div>
            <div class="flex justify-between gap-3 border-t border-emerald-200 pt-2 text-base"><span>{{ t("invoice.balanceAfterInvoice") }}</span><strong>{{ formatMoney(getBalanceValues(selectedInvoice).after) }}</strong></div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button :label="t('invoice.close')" severity="secondary" outlined @click="detailVisible = false" />
        <Button
          v-if="selectedInvoice"
          :label="t('invoice.print')"
          icon="pi pi-print"
          @click="printInvoice(selectedInvoice)"
        />
      </template>
    </Dialog>

    <CustomerBottomNav />
  </main>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-datepicker) {
  min-height: 44px;
}
</style>

<style>
.p-datepicker-panel,
.p-dialog-mask {
  z-index: 30000 !important;
}
</style>
