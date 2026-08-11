<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";

import api from "../services/api";

const { t, locale } = useI18n();

const TWO_DIGIT_RATE = 100;
const THREE_DIGIT_RATE = 65;
const TWO_DIGIT_WIN_MULTIPLIER = 100;
const THREE_DIGIT_WIN_MULTIPLIER = 600;
const OVERLAY_Z_INDEX = 30000;

const PRODUCT_KIND = Object.freeze({
  TWO_DIGIT: "2d",
  THREE_DIGIT: "3d",
});

/* --------------------------------------------------------------------------
 * Date helpers
 * -------------------------------------------------------------------------- */

const getTodayDate = () => {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const createDefaultDateRange = () => {
  const today = getTodayDate();

  return [today, new Date(today.getTime())];
};

const formatDateForApi = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const parseDatePickerValue = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const isSameLocalDate = (firstDate, secondDate) => {
  if (!firstDate || !secondDate) return false;

  const first = new Date(firstDate);
  const second = new Date(secondDate);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(locale.value === "km" ? "km-KH" : "en-GB");
};

const formatDateOnly = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale.value === "km" ? "km-KH" : "en-GB");
};

/* --------------------------------------------------------------------------
 * State
 * -------------------------------------------------------------------------- */

const loading = ref(false);
const referenceLoading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const printingPlayId = ref(null);

const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const mobileFiltersVisible = ref(false);

const isEditMode = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const selectedDeletePlay = ref(null);
const selectedDetailPlay = ref(null);
const detailRows = ref([]);
const detailLoading = ref(false);

const lotteryPlays = ref([]);
const categories = ref([]);
const products = ref([]);
const customers = ref([]);
const rates = ref([]);

const totalRecords = ref(0);
const page = ref(1);
const limit = ref(10);

const search = ref("");
const filterCategoryId = ref(null);
const filterProductId = ref(null);
const filterDateRange = ref(createDefaultDateRange());

const playForm = ref({
  id: null,
  title: "",
  productIds: [],
  customerId: null,
  playDate: new Date(),
  twoDigitRate: null,
  threeDigitRate: null,
});

const playRows = ref([]);

/* --------------------------------------------------------------------------
 * General helpers
 * -------------------------------------------------------------------------- */

const makeLocalId = () => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "object") {
    return value.id || value._id || null;
  }

  return value;
};

const toIdString = (value) => {
  const id = getId(value);
  return id === null || id === undefined ? null : String(id);
};

const normalizeSelectedIds = (values, legacyValue = null) => {
  const source =
    Array.isArray(values) && values.length
      ? values
      : legacyValue
        ? [legacyValue]
        : [];

  return Array.from(new Set(source.map(toIdString).filter(Boolean)));
};

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

const normalizeProductText = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s_\-–—()]/g, "");
};

const getProductKind = (product) => {
  if (!product) return null;

  const values = [
    product.playType,
    product.numberType,
    product.productType,
    product.code,
    product.name,
  ];

  for (const value of values) {
    const normalized = normalizeProductText(value);

    if (
      normalized === "2" ||
      normalized === "2d" ||
      normalized.includes("2លេខ") ||
      normalized.includes("លេខ2") ||
      normalized.includes("twodigit")
    ) {
      return PRODUCT_KIND.TWO_DIGIT;
    }

    if (
      normalized === "3" ||
      normalized === "3d" ||
      normalized.includes("3លេខ") ||
      normalized.includes("លេខ3") ||
      normalized.includes("threedigit")
    ) {
      return PRODUCT_KIND.THREE_DIGIT;
    }
  }

  return null;
};

const getProductCategoryId = (product) => {
  return toIdString(
    product?.category || product?.categoryId || product?.category_id,
  );
};

const findProductById = (productId) => {
  const target = toIdString(productId);
  if (!target) return null;

  return (
    products.value.find((product) => toIdString(product) === target) || null
  );
};

const findCategoryById = (categoryId) => {
  const target = toIdString(categoryId);
  if (!target) return null;

  return (
    categories.value.find((category) => toIdString(category) === target) || null
  );
};

const findCustomerById = (customerId) => {
  const target = toIdString(customerId);
  if (!target) return null;

  return (
    customers.value.find((customer) => toIdString(customer) === target) || null
  );
};

const getCustomerUsername = (customer) => {
  if (!customer) return "";

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
    ""
  );
};

const formatCustomerLabel = (customer) => {
  const username = getCustomerUsername(customer);
  const branch = String(customer?.branchId || "").trim();

  if (!username && !branch) return "-";
  if (username && branch) return `${username} — ${branch}`;

  return username || branch;
};

/* --------------------------------------------------------------------------
 * Options and selection state
 * -------------------------------------------------------------------------- */

const categoryOptions = computed(() => {
  return categories.value
    .filter((category) => category?.status !== false)
    .map((category) => ({
      label: category.name || "-",
      value: toIdString(category),
    }))
    .filter((option) => option.value);
});

const productOptions = computed(() => {
  return products.value
    .filter((product) => product?.status !== false)
    .map((product) => {
      const category = findCategoryById(getProductCategoryId(product));
      const kind = getProductKind(product);
      const kindLabel =
        kind === PRODUCT_KIND.TWO_DIGIT
          ? "2D"
          : kind === PRODUCT_KIND.THREE_DIGIT
            ? "3D"
            : "";

      return {
        label: [product.name, category?.name, kindLabel]
          .filter(Boolean)
          .join(" — "),
        value: toIdString(product),
      };
    })
    .filter((option) => option.value);
});

const customerOptions = computed(() => {
  return customers.value
    .filter((customer) => customer?.status !== false)
    .map((customer) => ({
      label: formatCustomerLabel(customer),
      value: toIdString(customer),
    }))
    .filter((option) => option.value);
});

const filterProductOptions = computed(() => {
  let list = products.value.filter((product) => product?.status !== false);

  if (filterCategoryId.value) {
    const selectedCategoryId = String(filterCategoryId.value);

    list = list.filter((product) => {
      return getProductCategoryId(product) === selectedCategoryId;
    });
  }

  return list
    .map((product) => ({
      label: product.name || "-",
      value: toIdString(product),
    }))
    .filter((option) => option.value);
});

const normalizeRateNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const rateOptions = computed(() => {
  const map = new Map();

  rates.value.forEach((rate) => {
    if (rate?.status === false) return;

    const number = normalizeRateNumber(rate?.number);
    if (number === null || map.has(number)) return;

    map.set(number, {
      label: rate.name ? `${rate.name} (${number}%)` : `${number}%`,
      value: number,
    });
  });

  [THREE_DIGIT_RATE, TWO_DIGIT_RATE].forEach((number) => {
    if (!map.has(number)) {
      map.set(number, {
        label: `${number}%`,
        value: number,
      });
    }
  });

  return Array.from(map.values()).sort(
    (first, second) => first.value - second.value,
  );
});

const twoDigitRateOptions = rateOptions;
const threeDigitRateOptions = rateOptions;

const isAvailableRate = (value) => {
  const number = normalizeRateNumber(value);

  return (
    number !== null &&
    rateOptions.value.some((option) => Number(option.value) === number)
  );
};

const getPreferredRate = (preferredRate) => {
  if (isAvailableRate(preferredRate)) {
    return Number(preferredRate);
  }

  return rateOptions.value[0]?.value ?? null;
};

const selectedProducts = computed(() => {
  return playForm.value.productIds.map(findProductById).filter(Boolean);
});

const hasTwoDigitProduct = computed(() => {
  return selectedProducts.value.some(
    (product) => getProductKind(product) === PRODUCT_KIND.TWO_DIGIT,
  );
});

const hasThreeDigitProduct = computed(() => {
  return selectedProducts.value.some(
    (product) => getProductKind(product) === PRODUCT_KIND.THREE_DIGIT,
  );
});

const hasActiveFilters = computed(() => {
  const range = Array.isArray(filterDateRange.value)
    ? filterDateRange.value
    : [];

  const startDate = range[0] || null;
  const endDate = range[1] || null;
  const today = getTodayDate();

  const dateChanged =
    !startDate ||
    !endDate ||
    !isSameLocalDate(startDate, today) ||
    !isSameLocalDate(endDate, today);

  return Boolean(
    search.value.trim() ||
    filterCategoryId.value ||
    filterProductId.value ||
    dateChanged,
  );
});

const totalPages = computed(() => {
  return Math.max(
    Math.ceil(Number(totalRecords.value || 0) / Number(limit.value || 10)),
    1,
  );
});

/* --------------------------------------------------------------------------
 * Form rows and product synchronization
 * -------------------------------------------------------------------------- */

const createEmptyPlayRow = () => ({
  localId: makeLocalId(),
  rowTitle: "",
  categoryId: null,
  twoDigitNumber: null,
  threeDigitNumber: null,
  winTwoNumberType: null,
  winThreeNumberType: null,
  isTwoNumber: false,
  isThreeNumber: false,
});

const synchronizeProductsWithRows = ({
  clearDisabled = true,
  applyDefaultRates = true,
} = {}) => {
  playForm.value.productIds = Array.from(
    new Set(playForm.value.productIds.map(toIdString).filter(Boolean)),
  ).slice(0, 2);

  if (hasTwoDigitProduct.value) {
    if (applyDefaultRates && !isAvailableRate(playForm.value.twoDigitRate)) {
      playForm.value.twoDigitRate = getPreferredRate(TWO_DIGIT_RATE);
    }
  } else {
    playForm.value.twoDigitRate = null;
  }

  if (hasThreeDigitProduct.value) {
    if (applyDefaultRates && !isAvailableRate(playForm.value.threeDigitRate)) {
      playForm.value.threeDigitRate = getPreferredRate(THREE_DIGIT_RATE);
    }
  } else {
    playForm.value.threeDigitRate = null;
  }

  playRows.value.forEach((row) => {
    if (!hasTwoDigitProduct.value) {
      row.isTwoNumber = false;

      if (clearDisabled) {
        row.twoDigitNumber = null;
        row.winTwoNumberType = null;
      }
    }

    if (!hasThreeDigitProduct.value) {
      row.isThreeNumber = false;

      if (clearDisabled) {
        row.threeDigitNumber = null;
        row.winThreeNumberType = null;
      }
    }
  });
};

const onProductSelectionChange = () => {
  errorMessage.value = "";
  synchronizeProductsWithRows({ clearDisabled: true });
};

const resetPlayForm = () => {
  playForm.value = {
    id: null,
    title: "",
    productIds: [],
    customerId: null,
    playDate: new Date(),
    twoDigitRate: null,
    threeDigitRate: null,
  };

  playRows.value = [createEmptyPlayRow()];
};

const addPlayRow = () => {
  errorMessage.value = "";
  playRows.value.push(createEmptyPlayRow());
};

const removePlayRow = (index) => {
  if (playRows.value.length === 1) {
    errorMessage.value = t("invoice.errors.atLeastOneRow");
    return;
  }

  playRows.value.splice(index, 1);
};

const duplicatePlayRow = (index) => {
  const row = playRows.value[index];

  playRows.value.splice(index + 1, 0, {
    ...row,
    localId: makeLocalId(),
    rowTitle: row.rowTitle ? `${row.rowTitle} ${t("invoice.copySuffix")}` : "",
  });
};

/* --------------------------------------------------------------------------
 * Calculation helpers
 * -------------------------------------------------------------------------- */

const getRatePercent = (value) => {
  const rate = Number(value || 0);
  return rate > 0 ? rate : 100;
};

const calculateAmountWithRate = (amount, rate) => {
  return (Number(amount || 0) * getRatePercent(rate)) / 100;
};

const getPlayRows = (play) => {
  return Array.isArray(play?.rows) ? play.rows : [];
};

const getPlayCalculation = (
  rows = [],
  twoDigitRate = 100,
  threeDigitRate = 100,
) => {
  let twoDigitBaseTotal = 0;
  let threeDigitBaseTotal = 0;
  let twoDigitCorrectTotal = 0;
  let threeDigitCorrectTotal = 0;

  rows.forEach((row) => {
    if (row.isTwoNumber) {
      twoDigitBaseTotal += Number(row.twoDigitNumber || 0);
      twoDigitCorrectTotal += Number(row.winTwoNumberType || 0);
    }

    if (row.isThreeNumber) {
      threeDigitBaseTotal += Number(row.threeDigitNumber || 0);
      threeDigitCorrectTotal += Number(row.winThreeNumberType || 0);
    }
  });

  const twoDigitGrandTotal = calculateAmountWithRate(
    twoDigitBaseTotal,
    twoDigitRate,
  );

  const threeDigitGrandTotal = calculateAmountWithRate(
    threeDigitBaseTotal,
    threeDigitRate,
  );

  const twoDigitCorrectDeduction =
    twoDigitCorrectTotal * TWO_DIGIT_WIN_MULTIPLIER;

  const threeDigitCorrectDeduction =
    threeDigitCorrectTotal * THREE_DIGIT_WIN_MULTIPLIER;

  return {
    twoDigitBaseTotal,
    threeDigitBaseTotal,
    twoDigitRate,
    threeDigitRate,
    twoDigitGrandTotal,
    threeDigitGrandTotal,
    twoDigitCorrectTotal,
    threeDigitCorrectTotal,
    twoDigitCorrectDeduction,
    threeDigitCorrectDeduction,
    grandTotal:
      twoDigitGrandTotal +
      threeDigitGrandTotal -
      twoDigitCorrectDeduction -
      threeDigitCorrectDeduction,
  };
};

const toPlayResultNumber = (value) => {
  return Math.trunc(Math.abs(Number(value || 0)));
};

const toSignedPlayResultNumber = (value) => {
  const result = Math.trunc(Number(value || 0));
  return Object.is(result, -0) ? 0 : result;
};

const getPlayResultCalculation = (calculation) => {
  const twoDigitResult = toPlayResultNumber(calculation.twoDigitGrandTotal);
  const threeDigitResult = toPlayResultNumber(calculation.threeDigitGrandTotal);
  const twoDigitCorrectResult = toPlayResultNumber(
    calculation.twoDigitCorrectDeduction,
  );
  const threeDigitCorrectResult = toPlayResultNumber(
    calculation.threeDigitCorrectDeduction,
  );

  return {
    twoDigitResult,
    threeDigitResult,
    twoDigitCorrectResult,
    threeDigitCorrectResult,
    playResultTotal: twoDigitResult + threeDigitResult,
    correctDeductionTotal: twoDigitCorrectResult + threeDigitCorrectResult,
    grandTotal:
      twoDigitResult +
      threeDigitResult -
      twoDigitCorrectResult -
      threeDigitCorrectResult,
  };
};

const getLegacyCategoryId = (play) => {
  const legacyIds = normalizeSelectedIds(
    play?.categoryIds,
    play?.categoryId || play?.category,
  );

  return legacyIds[0] || null;
};

const getRowCategoryId = (row, legacyCategoryId = null) => {
  return (
    toIdString(row?.categoryId || row?.category) ||
    toIdString(legacyCategoryId) ||
    null
  );
};

const getRowCategoryName = (row, legacyCategoryId = null) => {
  if (row?.categoryId && typeof row.categoryId === "object") {
    return row.categoryId.name || "-";
  }

  if (row?.category && typeof row.category === "object") {
    return row.category.name || "-";
  }

  const categoryId = getRowCategoryId(row, legacyCategoryId);
  return findCategoryById(categoryId)?.name || "-";
};

const getCategoryCalculationGroups = (
  rows = [],
  twoDigitRate = 100,
  threeDigitRate = 100,
  legacyCategoryId = null,
) => {
  const groups = new Map();

  rows.forEach((row) => {
    const categoryId = getRowCategoryId(row, legacyCategoryId);
    const key = categoryId || "__uncategorized__";
    const categoryName = getRowCategoryName(row, legacyCategoryId);

    if (!groups.has(key)) {
      groups.set(key, {
        categoryId,
        categoryName,
        rows: [],
      });
    }

    groups.get(key).rows.push(row);
  });

  return Array.from(groups.values()).map((group) => {
    const calculation = getPlayCalculation(
      group.rows,
      twoDigitRate,
      threeDigitRate,
    );

    return {
      ...group,
      calculation,
      result: getPlayResultCalculation(calculation),
    };
  });
};

const formCategoryGroups = computed(() => {
  return getCategoryCalculationGroups(
    playRows.value,
    playForm.value.twoDigitRate || 100,
    playForm.value.threeDigitRate || 100,
  );
});

const detailCategoryGroups = computed(() => {
  return getCategoryCalculationGroups(
    detailRows.value,
    selectedDetailPlay.value?.twoDigitRate || 100,
    selectedDetailPlay.value?.threeDigitRate || 100,
    getLegacyCategoryId(selectedDetailPlay.value),
  );
});

/* --------------------------------------------------------------------------
 * Sum category results into one invoice result
 * -------------------------------------------------------------------------- */

const getCategoryGroupSignedTotal = (group) => {
  return toSignedPlayResultNumber(group?.result?.grandTotal || 0);
};

const getCategoryGroupsGrandTotal = (groups = []) => {
  return groups.reduce((sum, group) => {
    return sum + getCategoryGroupSignedTotal(group);
  }, 0);
};

const buildCategoryGrandTotalExpression = (groups = []) => {
  return groups
    .map((group, index) => {
      const value = getCategoryGroupSignedTotal(group);
      const absoluteValue = Math.abs(value).toLocaleString("en-US");

      // Show only the category result numbers.
      // Example: -235 + 54 - 10
      // No category names such as (ថ្ងៃ) or (យប់).
      if (index === 0) {
        return `${value < 0 ? "-" : ""}${absoluteValue}`;
      }

      return `${value < 0 ? "-" : "+"} ${absoluteValue}`;
    })
    .join(" ");
};

const getInvoiceGrandTotalLabel = () => {
  return locale.value === "km" ? "សរុបវិក្កយបត្រ" : "Invoice Total";
};

const formCategoryGrandTotal = computed(() => {
  return getCategoryGroupsGrandTotal(formCategoryGroups.value);
});

const detailCategoryGrandTotal = computed(() => {
  return getCategoryGroupsGrandTotal(detailCategoryGroups.value);
});

const formCategoryGrandTotalExpression = computed(() => {
  return buildCategoryGrandTotalExpression(formCategoryGroups.value);
});

const detailCategoryGrandTotalExpression = computed(() => {
  return buildCategoryGrandTotalExpression(detailCategoryGroups.value);
});

const formatRate = (value) => {
  const rate = Number(value || 0);
  return rate > 0 ? `${rate}%` : "";
};

const formatPlainNumber = (value) => {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const formatPlayResult = (value) => {
  return toPlayResultNumber(value).toLocaleString("en-US");
};

const formatSignedPlayResult = (value) => {
  return toSignedPlayResultNumber(value).toLocaleString("en-US");
};

const getGrandTotalColorClass = (value) => {
  return Number(value || 0) >= 0 ? "text-blue-600" : "text-red-600";
};

const formatNumberType = (value) => {
  const number = Number(value || 0);
  return number > 0 ? number : "";
};

/* --------------------------------------------------------------------------
 * Display helpers
 * -------------------------------------------------------------------------- */

const getCategoryName = (play) => {
  const rows = getPlayRows(play);
  const legacyCategoryId = getLegacyCategoryId(play);

  const names = rows
    .map((row) => getRowCategoryName(row, legacyCategoryId))
    .filter((name) => name && name !== "-");

  const uniqueNames = Array.from(new Set(names));

  if (uniqueNames.length) {
    return uniqueNames.join(", ");
  }

  const legacyIds = normalizeSelectedIds(
    play?.categoryIds,
    play?.categoryId || play?.category,
  );

  return (
    legacyIds
      .map((categoryId) => findCategoryById(categoryId)?.name || "")
      .filter(Boolean)
      .join(", ") || "-"
  );
};

const getProductName = (play) => {
  const values =
    Array.isArray(play?.productIds) && play.productIds.length
      ? play.productIds
      : [play?.productId || play?.product].filter(Boolean);

  const names = values
    .map((value) => {
      if (value && typeof value === "object") {
        return value.name || "";
      }

      return findProductById(value)?.name || "";
    })
    .filter(Boolean);

  return names.join(", ") || "-";
};

const getCustomerName = (play) => {
  const value = play?.customerId || play?.customer;
  if (!value) return "-";

  if (typeof value === "object") {
    return getCustomerUsername(value) || "-";
  }

  return getCustomerUsername(findCustomerById(value)) || "-";
};

/* --------------------------------------------------------------------------
 * Reference data
 * -------------------------------------------------------------------------- */

const fetchCategories = async () => {
  const response = await api.get("/categories", {
    params: { page: 1, limit: 500, status: true },
  });

  categories.value = extractArrayData(response, [
    "categories",
    "items",
    "results",
  ]);
};

const fetchProducts = async () => {
  const response = await api.get("/products", {
    params: { page: 1, limit: 500, status: true },
  });

  products.value = extractArrayData(response, ["products", "items", "results"]);
};

const fetchCustomers = async () => {
  const response = await api.get("/customers", {
    params: { page: 1, limit: 500, status: true },
  });

  customers.value = extractArrayData(response, [
    "customers",
    "items",
    "results",
  ]);
};

const fetchRates = async () => {
  try {
    const response = await api.get("/rates", {
      params: { page: 1, limit: 500, status: true },
    });

    rates.value = extractArrayData(response, ["rates", "items", "results"]);
  } catch (error) {
    console.warn("Fetch rates warning:", error);
    rates.value = [];
  }
};

const loadReferenceData = async ({ force = false } = {}) => {
  if (
    !force &&
    categories.value.length &&
    products.value.length &&
    customers.value.length
  ) {
    return;
  }

  try {
    referenceLoading.value = true;

    const results = await Promise.allSettled([
      fetchCategories(),
      fetchProducts(),
      fetchCustomers(),
      fetchRates(),
    ]);

    const failed = results.filter((result) => result.status === "rejected");

    failed.forEach((result) => {
      console.error("Reference data error:", result.reason);
    });

    if (failed.length) {
      errorMessage.value =
        failed[0].reason?.response?.data?.message || t("invoice.errors.fetch");
    }
  } finally {
    referenceLoading.value = false;
  }
};

/* --------------------------------------------------------------------------
 * Invoice listing and filters
 * -------------------------------------------------------------------------- */

const fetchLotteryPlays = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const range = Array.isArray(filterDateRange.value)
      ? filterDateRange.value
      : [];
    const startDate = range[0] || null;
    const endDate = range[1] || range[0] || null;

    const params = {
      page: page.value,
      limit: limit.value,
    };

    if (startDate) params.dateFrom = formatDateForApi(startDate);
    if (endDate) params.dateTo = formatDateForApi(endDate);
    if (search.value.trim()) params.search = search.value.trim();
    if (filterCategoryId.value) {
      params.categoryId = filterCategoryId.value;
    }
    if (filterProductId.value) {
      params.productId = filterProductId.value;
    }

    const response = await api.get("/lottery-plays", { params });

    lotteryPlays.value = extractArrayData(response, [
      "lotteryPlays",
      "plays",
      "items",
      "results",
    ]);

    totalRecords.value = Number(
      response.data?.pagination?.total ??
        response.data?.data?.pagination?.total ??
        lotteryPlays.value.length,
    );
  } catch (error) {
    console.error("Fetch invoices error:", error);
    lotteryPlays.value = [];
    totalRecords.value = 0;
    errorMessage.value =
      error.response?.data?.message || t("invoice.errors.fetch");
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  page.value = 1;
  mobileFiltersVisible.value = false;
  fetchLotteryPlays();
};

const clearFilter = () => {
  search.value = "";
  filterCategoryId.value = null;
  filterProductId.value = null;
  filterDateRange.value = createDefaultDateRange();
  page.value = 1;
  mobileFiltersVisible.value = false;
  fetchLotteryPlays();
};

const onFilterCategoryChange = () => {
  filterProductId.value = null;
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;
  fetchLotteryPlays();
};

const goToPreviousPage = () => {
  if (loading.value || page.value <= 1) return;
  page.value -= 1;
  fetchLotteryPlays();
};

const goToNextPage = () => {
  if (loading.value || page.value >= totalPages.value) return;
  page.value += 1;
  fetchLotteryPlays();
};

/* --------------------------------------------------------------------------
 * Create and edit dialogs
 * -------------------------------------------------------------------------- */

const openCreateDialog = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  await loadReferenceData();
  resetPlayForm();

  isEditMode.value = false;
  dialogVisible.value = true;
};

const openEditDialog = async (play) => {
  errorMessage.value = "";
  successMessage.value = "";

  await loadReferenceData();

  const legacyCategoryId = getLegacyCategoryId(play);

  playForm.value = {
    id: play.id || play._id,
    title: play.title || "",
    productIds: normalizeSelectedIds(
      play.productIds,
      play.productId || play.product,
    ),
    customerId: toIdString(play.customerId || play.customer),
    playDate: parseDatePickerValue(play.playDate || play.createdAt),
    twoDigitRate: normalizeRateNumber(play.twoDigitRate),
    threeDigitRate: normalizeRateNumber(play.threeDigitRate),
  };

  playRows.value = getPlayRows(play).map((row) => ({
    localId: makeLocalId(),
    rowTitle: row.rowTitle || row.title || "",
    categoryId: getRowCategoryId(row, legacyCategoryId),
    twoDigitNumber: row.twoDigitNumber ?? null,
    threeDigitNumber: row.threeDigitNumber ?? null,
    winTwoNumberType: row.winTwoNumberType ?? null,
    winThreeNumberType: row.winThreeNumberType ?? null,
    isTwoNumber: Boolean(row.isTwoNumber),
    isThreeNumber: Boolean(row.isThreeNumber),
  }));

  if (!playRows.value.length) {
    playRows.value = [createEmptyPlayRow()];
  }

  synchronizeProductsWithRows({ clearDisabled: false });

  isEditMode.value = true;
  dialogVisible.value = true;
};

const validatePlayForm = () => {
  if (!playForm.value.title.trim()) {
    return t("invoice.errors.titleRequired");
  }

  if (!playForm.value.productIds.length) {
    return t("invoice.errors.productRequired");
  }

  if (!playForm.value.customerId) {
    return t("invoice.errors.customerRequired");
  }

  if (!playForm.value.playDate) {
    return t("invoice.errors.dateRequired");
  }

  const unknownProduct = selectedProducts.value.find(
    (product) => !getProductKind(product),
  );

  if (unknownProduct) {
    return locale.value === "km"
      ? `ផលិតផល "${unknownProduct.name}" មិនទាន់កំណត់ជា 2 លេខ ឬ 3 លេខ`
      : `Product "${unknownProduct.name}" is not configured as 2D or 3D`;
  }

  if (
    hasTwoDigitProduct.value &&
    !isAvailableRate(playForm.value.twoDigitRate)
  ) {
    return t("invoice.errors.invalidTwoDigitRate");
  }

  if (
    hasThreeDigitProduct.value &&
    !isAvailableRate(playForm.value.threeDigitRate)
  ) {
    return t("invoice.errors.invalidThreeDigitRate");
  }

  if (!playRows.value.length) {
    return t("invoice.errors.atLeastOneRow");
  }

  for (let index = 0; index < playRows.value.length; index += 1) {
    const row = playRows.value[index];
    const rowNumber = index + 1;

    if (!row.categoryId) {
      return locale.value === "km"
        ? `ជួរទី ${rowNumber}: សូមជ្រើសប្រភេទ`
        : `Row ${rowNumber}: Please select a category`;
    }

    if (!row.rowTitle.trim()) {
      return t("invoice.errors.rowNameRequired", { row: rowNumber });
    }

    if (!row.isTwoNumber && !row.isThreeNumber) {
      return locale.value === "km"
        ? `ជួរទី ${rowNumber}: សូមបើក 2D ឬ 3D យ៉ាងហោចណាស់មួយ`
        : `Row ${rowNumber}: Please enable 2D or 3D`;
    }

    if (row.isTwoNumber && !hasTwoDigitProduct.value) {
      return locale.value === "km"
        ? `ជួរទី ${rowNumber}: សូមជ្រើសផលិតផល 2 លេខ មុនពេលបើក 2D`
        : `Row ${rowNumber}: Select a 2D product first`;
    }

    if (row.isThreeNumber && !hasThreeDigitProduct.value) {
      return locale.value === "km"
        ? `ជួរទី ${rowNumber}: សូមជ្រើសផលិតផល 3 លេខ មុនពេលបើក 3D`
        : `Row ${rowNumber}: Select a 3D product first`;
    }

    if (row.isTwoNumber) {
      const value = Number(row.twoDigitNumber);

      if (
        row.twoDigitNumber === null ||
        row.twoDigitNumber === undefined ||
        row.twoDigitNumber === ""
      ) {
        return t("invoice.errors.twoDigitRequired", { row: rowNumber });
      }

      if (!Number.isFinite(value) || value < 0) {
        return locale.value === "km"
          ? `ជួរទី ${rowNumber}: តម្លៃ 2D មិនត្រឹមត្រូវ`
          : `Row ${rowNumber}: 2D number must be valid and non-negative`;
      }
    }

    if (row.isThreeNumber) {
      const value = Number(row.threeDigitNumber);

      if (
        row.threeDigitNumber === null ||
        row.threeDigitNumber === undefined ||
        row.threeDigitNumber === ""
      ) {
        return t("invoice.errors.threeDigitRequired", {
          row: rowNumber,
        });
      }

      if (!Number.isFinite(value) || value < 0) {
        return locale.value === "km"
          ? `ជួរទី ${rowNumber}: តម្លៃ 3D មិនត្រឹមត្រូវ`
          : `Row ${rowNumber}: 3D number must be valid and non-negative`;
      }
    }
  }

  return "";
};

const buildPayload = () => ({
  title: playForm.value.title.trim(),
  productIds: playForm.value.productIds.map(String),
  customerId: String(playForm.value.customerId),
  playDate: formatDateForApi(playForm.value.playDate),
  twoDigitRate: Number(
    playForm.value.twoDigitRate ||
      getPreferredRate(TWO_DIGIT_RATE) ||
      TWO_DIGIT_RATE,
  ),
  threeDigitRate: Number(
    playForm.value.threeDigitRate ||
      getPreferredRate(THREE_DIGIT_RATE) ||
      THREE_DIGIT_RATE,
  ),
  rows: playRows.value.map((row) => ({
    rowTitle: row.rowTitle.trim(),
    categoryId: String(row.categoryId),
    twoDigitNumber: row.isTwoNumber ? Number(row.twoDigitNumber) : null,
    threeDigitNumber: row.isThreeNumber ? Number(row.threeDigitNumber) : null,
    winTwoNumberType: row.isTwoNumber ? Number(row.winTwoNumberType || 0) : 0,
    winThreeNumberType: row.isThreeNumber
      ? Number(row.winThreeNumberType || 0)
      : 0,
    isTwoNumber: Boolean(row.isTwoNumber),
    isThreeNumber: Boolean(row.isThreeNumber),
    checkedStatus: false,
  })),
});

const saveLotteryPlay = async () => {
  try {
    errorMessage.value = "";
    successMessage.value = "";

    synchronizeProductsWithRows({
      clearDisabled: false,
      applyDefaultRates: true,
    });

    const validationError = validatePlayForm();
    if (validationError) {
      errorMessage.value = validationError;
      return;
    }

    saving.value = true;
    const payload = buildPayload();

    if (isEditMode.value) {
      await api.put(`/lottery-plays/${playForm.value.id}`, payload);
      successMessage.value = t("invoice.messages.updated");
    } else {
      await api.post("/lottery-plays", payload);
      successMessage.value = t("invoice.messages.created");
    }

    dialogVisible.value = false;
    await fetchLotteryPlays();
  } catch (error) {
    console.error("Save invoice error:", error);
    errorMessage.value =
      error.response?.data?.message || t("invoice.errors.save");
  } finally {
    saving.value = false;
  }
};

/* --------------------------------------------------------------------------
 * Detail and delete
 * -------------------------------------------------------------------------- */

const openDetailDialog = async (play) => {
  try {
    detailDialogVisible.value = true;
    detailLoading.value = true;
    selectedDetailPlay.value = play;
    detailRows.value = getPlayRows(play);

    const playId = play.id || play._id;
    if (!playId) return;

    const response = await api.get(`/lottery-plays/${playId}`);
    const freshPlay = response.data?.data || play;

    selectedDetailPlay.value = freshPlay;
    detailRows.value = getPlayRows(freshPlay);
  } catch (error) {
    console.error("Fetch invoice detail error:", error);
    errorMessage.value =
      error.response?.data?.message || t("invoice.errors.detail");
  } finally {
    detailLoading.value = false;
  }
};

const openDeleteDialog = (play) => {
  errorMessage.value = "";
  successMessage.value = "";
  selectedDeletePlay.value = play;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) return;

  deleteDialogVisible.value = false;
  selectedDeletePlay.value = null;
};

const confirmDeleteLotteryPlay = async () => {
  if (!selectedDeletePlay.value) return;

  try {
    deleting.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    const playId = selectedDeletePlay.value.id || selectedDeletePlay.value._id;

    await api.delete(`/lottery-plays/${playId}`);

    successMessage.value = t("invoice.messages.deleted");
    deleteDialogVisible.value = false;
    selectedDeletePlay.value = null;

    if (lotteryPlays.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }

    await fetchLotteryPlays();
  } catch (error) {
    console.error("Delete invoice error:", error);
    errorMessage.value =
      error.response?.data?.message || t("invoice.errors.delete");
  } finally {
    deleting.value = false;
  }
};

/* --------------------------------------------------------------------------
 * Printing
 * -------------------------------------------------------------------------- */

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const buildPrintHtml = (play) => {
  const rows = getPlayRows(play);
  const legacyCategoryId = getLegacyCategoryId(play);

  const groups = getCategoryCalculationGroups(
    rows,
    play?.twoDigitRate || 100,
    play?.threeDigitRate || 100,
    legacyCategoryId,
  );

  const invoiceGrandTotal = getCategoryGroupsGrandTotal(groups);
  const invoiceGrandTotalExpression = buildCategoryGrandTotalExpression(groups);
  const invoiceGrandTotalColor = invoiceGrandTotal >= 0 ? "#2563eb" : "#dc2626";

  const categorySections = groups
    .map((group, groupIndex) => {
      const bodyRows = group.rows
        .map((row, rowIndex) => {
          return `
            <tr>
              <td class="center">(${rowIndex + 1})</td>
              <td class="left">${escapeHtml(row.rowTitle || "")}</td>
              <td class="center">${row.isTwoNumber ? escapeHtml(formatPlainNumber(row.twoDigitNumber)) : ""}</td>
              <td class="center">${row.isThreeNumber ? escapeHtml(formatPlainNumber(row.threeDigitNumber)) : ""}</td>
              <td class="center">${row.isTwoNumber ? escapeHtml(formatNumberType(row.winTwoNumberType)) : ""}</td>
              <td class="center">${row.isThreeNumber ? escapeHtml(formatNumberType(row.winThreeNumberType)) : ""}</td>
              <td class="check">✓</td>
            </tr>
          `;
        })
        .join("");

      const calculation = group.calculation;
      const result = group.result;
      const totalColor = result.grandTotal >= 0 ? "#2563eb" : "#dc2626";

      return `
        <section class="category-section ${groupIndex > 0 ? "category-section-next" : ""}">
          <table>
            <thead>
              <tr>
                <th class="category-column">${escapeHtml(group.categoryName)}</th>
                <th class="row-title-column">${escapeHtml(t("invoice.print.rowTitle"))}</th>
                <th>${escapeHtml(t("invoice.print.twoDigit"))}</th>
                <th>${escapeHtml(t("invoice.print.threeDigit"))}</th>
                <th>${escapeHtml(t("invoice.print.correctTwoDigit"))}</th>
                <th>${escapeHtml(t("invoice.print.correctThreeDigit"))}</th>
                <th class="check-column"></th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>

          <div class="summary">
            ${
              calculation.twoDigitBaseTotal > 0
                ? `
              <div class="line">
                <span>${escapeHtml(t("invoice.print.twoDigit"))}</span>
                <span>${formatPlayResult(calculation.twoDigitBaseTotal)} × ${formatRate(calculation.twoDigitRate)} = ${formatPlayResult(result.twoDigitResult)}</span>
              </div>
            `
                : ""
            }

            ${
              calculation.threeDigitBaseTotal > 0
                ? `
              <div class="line">
                <span>${escapeHtml(t("invoice.print.threeDigit"))}</span>
                <span>${formatPlayResult(calculation.threeDigitBaseTotal)} × ${formatRate(calculation.threeDigitRate)} = ${formatPlayResult(result.threeDigitResult)}</span>
              </div>
            `
                : ""
            }

            ${
              calculation.twoDigitCorrectTotal > 0
                ? `
              <div class="line deduction">
                <span>${escapeHtml(t("invoice.print.correctTwoDigit"))}</span>
                <span>${formatPlayResult(calculation.twoDigitCorrectTotal)} × ${TWO_DIGIT_WIN_MULTIPLIER} = -${formatPlayResult(result.twoDigitCorrectResult)}</span>
              </div>
            `
                : ""
            }

            ${
              calculation.threeDigitCorrectTotal > 0
                ? `
              <div class="line deduction">
                <span>${escapeHtml(t("invoice.print.correctThreeDigit"))}</span>
                <span>${formatPlayResult(calculation.threeDigitCorrectTotal)} × ${THREE_DIGIT_WIN_MULTIPLIER} = -${formatPlayResult(result.threeDigitCorrectResult)}</span>
              </div>
            `
                : ""
            }

            <div class="subtotal" style="color:${totalColor}">
              <span>${escapeHtml(t("invoice.print.total"))}:</span>
              <span>${formatSignedPlayResult(result.grandTotal)}</span>
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
  <html lang="${locale.value === "km" ? "km" : "en"}">
    <head>
      <meta charset="utf-8" />
      <title>&#8203;</title>
      <style>
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:#fff}
        body{padding:12px;font-family:Inter,"Noto Sans Khmer","Khmer OS Battambang",Arial,sans-serif;color:#111827}
        .invoice{max-width:820px;margin:auto}
        .invoice-header{text-align:center;margin-bottom:8px}
        .invoice-title{margin:0;font-size:16px;font-weight:800}
        .invoice-meta{margin-top:3px;font-size:12px;font-weight:600}
        .category-section{border:1px solid #d7dccf;border-radius:8px;padding:7px;background:#fff;break-inside:avoid;page-break-inside:avoid}
        .category-section-next{margin-top:8px}
        table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
        th,td{border:1px solid #d8dde3;padding:4px 6px;text-align:center;vertical-align:middle;height:30px}
        th{font-weight:800;background:#fff}
        .category-column{width:88px;font-weight:900;word-break:break-word}
        .row-title-column{width:170px}
        .check-column{width:40px}
        .left{text-align:left;font-weight:700}
        .center{text-align:center}
        .check{color:#22c55e;font-size:16px;font-weight:900}
        .summary{margin-top:5px;padding:0 5px 3px;font-size:13px;font-weight:700}
        .line{display:grid;grid-template-columns:64px 1fr;gap:8px;margin:1px 0}
        .deduction{color:#111827}
        .subtotal{display:flex;gap:16px;align-items:center;width:290px;max-width:100%;margin-top:5px;padding-top:4px;border-top:1px solid #9ca3af;font-size:15px;font-weight:900}
        .invoice-grand-total{margin-top:12px;border:2px solid #cbd5e1;border-radius:8px;padding:10px 12px;background:#f8fafc;break-inside:avoid;page-break-inside:avoid}
        .invoice-grand-total-title{text-align:center;font-size:14px;font-weight:900;color:#111827;margin-bottom:6px}
        .invoice-grand-total-expression{text-align:center;font-size:13px;font-weight:800;line-height:1.6;word-break:break-word;color:#374151}
        .invoice-grand-total-value{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:6px;padding-top:6px;border-top:1px solid #94a3b8;font-size:20px;font-weight:900}
        @media print{body{padding:0}.invoice{max-width:none}.category-section,.invoice-grand-total{break-inside:avoid;page-break-inside:avoid}@page{size:portrait;margin:6mm}}
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="invoice-header">
          <div class="invoice-title">${escapeHtml(play?.title || "")}</div>
          <div class="invoice-meta">${escapeHtml(getCustomerName(play))} — ${escapeHtml(formatDateOnly(play?.playDate || play?.createdAt))}</div>
        </div>
        ${categorySections || `<div>${escapeHtml(t("invoice.noRows"))}</div>`}

        ${
          groups.length
            ? `
          <section class="invoice-grand-total">
            <div class="invoice-grand-total-title">
              ${escapeHtml(getInvoiceGrandTotalLabel())}
            </div>

            <div class="invoice-grand-total-expression">
              ${escapeHtml(invoiceGrandTotalExpression)}
            </div>

            <div class="invoice-grand-total-value" style="color:${invoiceGrandTotalColor}">
              <span>=</span>
              <span>${formatSignedPlayResult(invoiceGrandTotal)}</span>
            </div>
          </section>
        `
            : ""
        }
      </div>
    </body>
  </html>`;
};

const printLotteryPlay = async (play) => {
  if (!play) return;

  const playId = play.id || play._id;
  const printWindow = window.open("", "_blank", "width=900,height=750");

  if (!printWindow) {
    errorMessage.value = t("invoice.errors.popupBlocked");
    return;
  }

  try {
    printingPlayId.value = playId;
    let freshPlay = play;

    if (playId) {
      const response = await api.get(`/lottery-plays/${playId}`);
      freshPlay = response.data?.data || play;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(freshPlay));
    printWindow.document.close();
    printWindow.focus();

    const startPrint = () => {
      setTimeout(() => printWindow.print(), 250);
    };

    if (printWindow.document.readyState === "complete") {
      startPrint();
    } else {
      printWindow.onload = startPrint;
    }
  } catch (error) {
    console.error("Print invoice error:", error);
    printWindow.close();
    errorMessage.value =
      error.response?.data?.message || t("invoice.errors.print");
  } finally {
    printingPlayId.value = null;
  }
};

/* --------------------------------------------------------------------------
 * Initial load
 * -------------------------------------------------------------------------- */

onMounted(async () => {
  await loadReferenceData({ force: true });
  await fetchLotteryPlays();
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6">
    <Card>
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
            >
              <i class="pi pi-file"></i>
            </div>

            <h1 class="truncate text-xl font-bold sm:text-2xl">
              {{ t("invoice.title") }}
            </h1>
          </div>

          <Button
            type="button"
            :label="t('invoice.addInvoice')"
            icon="pi pi-plus"
            size="small"
            class="shrink-0"
            :loading="referenceLoading"
            @click="openCreateDialog"
          />
        </div>
      </template>

      <template #content>
        <Message
          v-if="errorMessage && !dialogVisible"
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

        <!-- Mobile filters -->
        <section class="mb-4 md:hidden">
          <div class="flex gap-2">
            <InputText
              v-model="search"
              :placeholder="t('invoice.searchInvoices')"
              class="min-w-0 flex-1"
              @keyup.enter="applyFilter"
            />

            <Button
              type="button"
              icon="pi pi-search"
              :aria-label="t('invoice.search')"
              @click="applyFilter"
            />

            <Button
              type="button"
              icon="pi pi-filter"
              severity="secondary"
              outlined
              :aria-label="t('invoice.showFilters')"
              :class="{ 'border-primary text-primary': hasActiveFilters }"
              @click="mobileFiltersVisible = !mobileFiltersVisible"
            />
          </div>

          <div
            v-if="mobileFiltersVisible"
            class="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
          >
            <Select
              v-model="filterCategoryId"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('invoice.allCategories')"
              appendTo="body"
              :baseZIndex="OVERLAY_Z_INDEX"
              class="w-full"
              showClear
              @change="onFilterCategoryChange"
            />

            <Select
              v-model="filterProductId"
              :options="filterProductOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('invoice.allProducts')"
              appendTo="body"
              :baseZIndex="OVERLAY_Z_INDEX"
              class="w-full"
              showClear
              filter
            />

            <DatePicker
              v-model="filterDateRange"
              selectionMode="range"
              dateFormat="yy-mm-dd"
              :placeholder="t('invoice.selectDateRange')"
              appendTo="body"
              :baseZIndex="OVERLAY_Z_INDEX"
              class="w-full"
              input-class="w-full"
              showIcon
              iconDisplay="input"
              showButtonBar
              :manualInput="false"
            />

            <div class="grid grid-cols-2 gap-2">
              <Button
                type="button"
                :label="t('invoice.reset')"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                @click="clearFilter"
              />

              <Button
                type="button"
                :label="t('invoice.apply')"
                icon="pi pi-check"
                @click="applyFilter"
              />
            </div>
          </div>
        </section>

        <!-- Desktop filters -->
        <section
          class="mb-4 hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_180px_280px_auto]"
        >
          <InputText
            v-model="search"
            :placeholder="t('invoice.searchInvoiceOrRow')"
            class="w-full"
            @keyup.enter="applyFilter"
          />

          <Select
            v-model="filterCategoryId"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="t('invoice.fields.category')"
            appendTo="body"
            :baseZIndex="OVERLAY_Z_INDEX"
            class="w-full"
            showClear
            @change="onFilterCategoryChange"
          />

          <Select
            v-model="filterProductId"
            :options="filterProductOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="t('invoice.fields.product')"
            appendTo="body"
            :baseZIndex="OVERLAY_Z_INDEX"
            class="w-full"
            showClear
            filter
          />

          <DatePicker
            v-model="filterDateRange"
            selectionMode="range"
            dateFormat="yy-mm-dd"
            :placeholder="t('invoice.invoiceDateRange')"
            appendTo="body"
            :baseZIndex="OVERLAY_Z_INDEX"
            class="w-full"
            input-class="w-full"
            showIcon
            iconDisplay="input"
            showButtonBar
            :manualInput="false"
          />

          <div class="flex gap-2">
            <Button
              type="button"
              :label="t('invoice.search')"
              icon="pi pi-search"
              class="flex-1"
              @click="applyFilter"
            />

            <Button
              type="button"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :aria-label="t('invoice.resetFilters')"
              @click="clearFilter"
            />
          </div>
        </section>

        <!-- Mobile invoice list -->
        <section class="md:hidden">
          <div v-if="loading" class="py-12 text-center">
            <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
            <p class="mt-2 text-sm text-gray-500">
              {{ t("invoice.loadingInvoices") }}
            </p>
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="invoice in lotteryPlays"
              :key="invoice.id || invoice._id"
              class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold text-gray-900">
                    {{ invoice.title || "-" }}
                  </h2>

                  <div class="mt-1 text-xs text-gray-500">
                    {{ formatDateOnly(invoice.playDate || invoice.createdAt) }}
                  </div>
                </div>

                <span
                  class="max-w-32 shrink-0 truncate rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                >
                  {{ getCategoryName(invoice) }}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div class="min-w-0 rounded-lg bg-gray-50 p-2">
                  <div class="text-xs text-gray-500">
                    {{ t("invoice.fields.customer") }}
                  </div>
                  <div class="mt-1 truncate font-semibold">
                    {{ getCustomerName(invoice) }}
                  </div>
                </div>

                <div class="min-w-0 rounded-lg bg-gray-50 p-2">
                  <div class="text-xs text-gray-500">
                    {{ t("invoice.fields.product") }}
                  </div>
                  <div class="mt-1 truncate font-semibold">
                    {{ getProductName(invoice) }}
                  </div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  :label="t('invoice.view')"
                  icon="pi pi-eye"
                  severity="help"
                  outlined
                  @click="openDetailDialog(invoice)"
                />

                <Button
                  type="button"
                  :label="t('invoice.printButton')"
                  icon="pi pi-print"
                  severity="secondary"
                  outlined
                  :loading="printingPlayId === (invoice.id || invoice._id)"
                  @click="printLotteryPlay(invoice)"
                />

                <Button
                  type="button"
                  :label="t('invoice.edit')"
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  @click="openEditDialog(invoice)"
                />

                <Button
                  type="button"
                  :label="t('invoice.delete')"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="openDeleteDialog(invoice)"
                />
              </div>
            </article>

            <div
              v-if="!lotteryPlays.length"
              class="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500"
            >
              {{ t("invoice.noInvoices") }}
            </div>

            <div
              v-if="totalRecords > 0"
              class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-2"
            >
              <Button
                type="button"
                icon="pi pi-chevron-left"
                severity="secondary"
                text
                rounded
                :disabled="page <= 1 || loading"
                @click="goToPreviousPage"
              />

              <span class="text-sm font-medium text-gray-600">
                {{ t("invoice.pageOf", { page, total: totalPages }) }}
              </span>

              <Button
                type="button"
                icon="pi pi-chevron-right"
                severity="secondary"
                text
                rounded
                :disabled="page >= totalPages || loading"
                @click="goToNextPage"
              />
            </div>
          </div>
        </section>

        <!-- Desktop invoice table -->
        <section class="hidden md:block">
          <DataTable
            :value="lotteryPlays"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="_id"
            :rows="limit"
            :first="(page - 1) * limit"
            :totalRecords="totalRecords"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 1080px"
            @page="onPageChange"
          >
            <Column
              :header="t('invoice.columns.invoiceName')"
              style="min-width: 210px"
            >
              <template #body="{ data }">
                <div class="font-semibold">{{ data.title || "-" }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(data.createdAt) }}
                </div>
              </template>
            </Column>

            <Column
              :header="t('invoice.columns.category')"
              style="min-width: 150px"
            >
              <template #body="{ data }">{{ getCategoryName(data) }}</template>
            </Column>

            <Column
              :header="t('invoice.columns.product')"
              style="min-width: 150px"
            >
              <template #body="{ data }">{{ getProductName(data) }}</template>
            </Column>

            <Column
              :header="t('invoice.columns.customer')"
              style="min-width: 180px"
            >
              <template #body="{ data }">{{ getCustomerName(data) }}</template>
            </Column>

            <Column
              :header="t('invoice.columns.invoiceDate')"
              style="min-width: 130px"
            >
              <template #body="{ data }">
                {{ formatDateOnly(data.playDate || data.createdAt) }}
              </template>
            </Column>

            <Column
              :header="t('invoice.columns.action')"
              frozen
              alignFrozen="right"
              style="min-width: 205px"
            >
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-eye"
                    size="small"
                    severity="help"
                    @click="openDetailDialog(data)"
                  />
                  <Button
                    type="button"
                    icon="pi pi-print"
                    size="small"
                    severity="secondary"
                    :loading="printingPlayId === (data.id || data._id)"
                    @click="printLotteryPlay(data)"
                  />
                  <Button
                    type="button"
                    icon="pi pi-pencil"
                    size="small"
                    severity="info"
                    @click="openEditDialog(data)"
                  />
                  <Button
                    type="button"
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
                {{ t("invoice.noInvoices") }}
              </div>
            </template>
          </DataTable>
        </section>
      </template>
    </Card>

    <!-- Create / edit invoice dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      appendTo="body"
      modal
      position="center"
      :autoZIndex="true"
      :baseZIndex="20000"
      :header="
        isEditMode
          ? t('invoice.dialogs.editTitle')
          : t('invoice.dialogs.createTitle')
      "
      :style="{
        width: 'calc(100vw - 24px)',
        maxWidth: '1180px',
        maxHeight: 'calc(100dvh - 24px)',
      }"
      :closable="!saving"
      :closeOnEscape="!saving"
      :draggable="false"
      :dismissableMask="false"
      :blockScroll="true"
      class="invoice-form-dialog"
    >
      <div class="space-y-4">
        <Message
          v-if="errorMessage"
          severity="error"
          closable
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </Message>

        <section class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <h2 class="mb-3 text-base font-bold text-gray-900">
            {{ t("invoice.sections.information") }}
          </h2>

          <div
            class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t("invoice.fields.invoiceName") }}
              </label>
              <InputText
                v-model="playForm.title"
                class="w-full"
                :placeholder="t('invoice.placeholders.invoiceName')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t("invoice.fields.invoiceDate") }}
              </label>
              <DatePicker
                v-model="playForm.playDate"
                appendTo="body"
                :baseZIndex="OVERLAY_Z_INDEX"
                class="w-full"
                input-class="w-full"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                :manualInput="false"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t("invoice.fields.customer") }}
              </label>
              <Select
                v-model="playForm.customerId"
                :options="customerOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.customer')"
                appendTo="body"
                :baseZIndex="OVERLAY_Z_INDEX"
                class="w-full"
                showClear
                filter
                :loading="referenceLoading"
                :emptyMessage="t('customer.noCustomers')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t("invoice.fields.product") }}
              </label>
              <MultiSelect
                v-model="playForm.productIds"
                :options="productOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.product')"
                appendTo="body"
                :baseZIndex="OVERLAY_Z_INDEX"
                class="w-full"
                display="chip"
                showClear
                filter
                :loading="referenceLoading"
                :selectionLimit="2"
                :maxSelectedLabels="2"
                @change="onProductSelectionChange"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t("invoice.fields.twoDigitRate") }}
              </label>
              <Select
                v-model="playForm.twoDigitRate"
                :options="twoDigitRateOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.twoDigitRate')"
                appendTo="body"
                :baseZIndex="OVERLAY_Z_INDEX"
                class="w-full"
                :disabled="!hasTwoDigitProduct"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t("invoice.fields.threeDigitRate") }}
              </label>
              <Select
                v-model="playForm.threeDigitRate"
                :options="threeDigitRateOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.threeDigitRate')"
                appendTo="body"
                :baseZIndex="OVERLAY_Z_INDEX"
                class="w-full"
                :disabled="!hasThreeDigitProduct"
              />
            </div>
          </div>
        </section>

        <section>
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-gray-900">
                {{ t("invoice.sections.rows") }}
              </h2>
              <p class="text-xs text-gray-500">{{ t("invoice.rowsHint") }}</p>
            </div>

            <Button
              type="button"
              :label="t('invoice.addRow')"
              icon="pi pi-plus"
              size="small"
              @click="addPlayRow"
            />
          </div>

          <div class="space-y-3">
            <article
              v-for="(row, index) in playRows"
              :key="row.localId"
              class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4"
            >
              <div class="mb-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="font-bold text-gray-900">{{
                    t("invoice.invoiceRow")
                  }}</span>
                </div>

                <div class="flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-copy"
                    size="small"
                    severity="secondary"
                    outlined
                    rounded
                    @click="duplicatePlayRow(index)"
                  />
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    outlined
                    rounded
                    @click="removePlayRow(index)"
                  />
                </div>
              </div>

              <div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-semibold text-gray-700">
                    {{ t("invoice.fields.rowName") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    v-model="row.rowTitle"
                    class="w-full"
                    :placeholder="t('invoice.placeholders.rowName')"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-semibold text-gray-700">
                    {{ t("invoice.fields.category") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <Select
                    v-model="row.categoryId"
                    :options="categoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="t('invoice.placeholders.category')"
                    appendTo="body"
                    :baseZIndex="OVERLAY_Z_INDEX"
                    class="w-full"
                    showClear
                    filter
                    :loading="referenceLoading"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <section
                  :class="[
                    'rounded-xl border p-3 sm:p-4',
                    row.isTwoNumber
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-200 bg-gray-50',
                  ]"
                >
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-gray-900">2D</div>
                      <div class="text-xs text-gray-500">
                        {{ t("invoice.enableTwoDigit") }}
                      </div>
                    </div>
                    <ToggleSwitch
                      v-model="row.isTwoNumber"
                      :disabled="!hasTwoDigitProduct"
                    />
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        class="mb-1 block text-xs font-semibold text-gray-600"
                        >{{ t("invoice.fields.twoDigitNumber") }}</label
                      >
                      <InputNumber
                        v-model="row.twoDigitNumber"
                        class="w-full"
                        input-class="w-full"
                        :min="0"
                        :disabled="!row.isTwoNumber"
                        :useGrouping="false"
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1 block text-xs font-semibold text-gray-600"
                        >{{ t("invoice.fields.correctTwoDigit") }}</label
                      >
                      <InputNumber
                        v-model="row.winTwoNumberType"
                        class="w-full"
                        input-class="w-full"
                        :min="0"
                        :disabled="!row.isTwoNumber"
                        :useGrouping="false"
                      />
                    </div>
                  </div>
                </section>

                <section
                  :class="[
                    'rounded-xl border p-3 sm:p-4',
                    row.isThreeNumber
                      ? 'border-violet-300 bg-violet-50/50'
                      : 'border-gray-200 bg-gray-50',
                  ]"
                >
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-gray-900">3D</div>
                      <div class="text-xs text-gray-500">
                        {{ t("invoice.enableThreeDigit") }}
                      </div>
                    </div>
                    <ToggleSwitch
                      v-model="row.isThreeNumber"
                      :disabled="!hasThreeDigitProduct"
                    />
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        class="mb-1 block text-xs font-semibold text-gray-600"
                        >{{ t("invoice.fields.threeDigitNumber") }}</label
                      >
                      <InputNumber
                        v-model="row.threeDigitNumber"
                        class="w-full"
                        input-class="w-full"
                        :min="0"
                        :disabled="!row.isThreeNumber"
                        :useGrouping="false"
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1 block text-xs font-semibold text-gray-600"
                        >{{ t("invoice.fields.correctThreeDigit") }}</label
                      >
                      <InputNumber
                        v-model="row.winThreeNumberType"
                        class="w-full"
                        input-class="w-full"
                        :min="0"
                        :disabled="!row.isThreeNumber"
                        :useGrouping="false"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </article>
          </div>
        </section>

        <section class="space-y-3">
          <div class="text-sm font-bold text-gray-900">
            Category calculations
          </div>

          <article
            v-for="group in formCategoryGroups"
            :key="group.categoryId || group.categoryName"
            class="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <div class="font-bold text-gray-900">
                {{ group.categoryName }}
              </div>
              <div
                class="text-xl font-extrabold"
                :class="getGrandTotalColorClass(group.result.grandTotal)"
              >
                {{ formatSignedPlayResult(group.result.grandTotal) }}
              </div>
            </div>

            <div class="space-y-1 text-sm">
              <div
                v-if="group.calculation.twoDigitBaseTotal > 0"
                class="flex justify-between gap-3"
              >
                <span class="font-semibold">{{
                  t("invoice.print.twoDigit")
                }}</span>
                <span
                  >{{
                    formatPlainNumber(group.calculation.twoDigitBaseTotal)
                  }}
                  × {{ formatRate(group.calculation.twoDigitRate) }} =
                  {{ formatPlayResult(group.result.twoDigitResult) }}</span
                >
              </div>
              <div
                v-if="group.calculation.threeDigitBaseTotal > 0"
                class="flex justify-between gap-3"
              >
                <span class="font-semibold">{{
                  t("invoice.print.threeDigit")
                }}</span>
                <span
                  >{{
                    formatPlainNumber(group.calculation.threeDigitBaseTotal)
                  }}
                  × {{ formatRate(group.calculation.threeDigitRate) }} =
                  {{ formatPlayResult(group.result.threeDigitResult) }}</span
                >
              </div>
              <div
                v-if="group.calculation.twoDigitCorrectTotal > 0"
                class="flex justify-between gap-3 text-red-600"
              >
                <span>{{ t("invoice.print.correctTwoDigit") }}</span>
                <span
                  >{{
                    formatPlainNumber(group.calculation.twoDigitCorrectTotal)
                  }}
                  × {{ TWO_DIGIT_WIN_MULTIPLIER }} = -{{
                    formatPlayResult(group.result.twoDigitCorrectResult)
                  }}</span
                >
              </div>
              <div
                v-if="group.calculation.threeDigitCorrectTotal > 0"
                class="flex justify-between gap-3 text-red-600"
              >
                <span>{{ t("invoice.print.correctThreeDigit") }}</span>
                <span
                  >{{
                    formatPlainNumber(group.calculation.threeDigitCorrectTotal)
                  }}
                  × {{ THREE_DIGIT_WIN_MULTIPLIER }} = -{{
                    formatPlayResult(group.result.threeDigitCorrectResult)
                  }}</span
                >
              </div>
            </div>
          </article>

          <div
            v-if="formCategoryGroups.length"
            class="rounded-xl border-2 border-slate-300 bg-slate-50 p-4"
          >
            <div class="text-center text-sm font-extrabold text-gray-900">
              {{ getInvoiceGrandTotalLabel() }}
            </div>

            <div class="mt-2 text-center text-sm font-semibold text-gray-600">
              {{ formCategoryGrandTotalExpression }}
            </div>

            <div
              class="mt-3 border-t border-slate-300 pt-3 text-center text-2xl font-extrabold"
              :class="getGrandTotalColorClass(formCategoryGrandTotal)"
            >
              = {{ formatSignedPlayResult(formCategoryGrandTotal) }}
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            type="button"
            :label="t('invoice.cancel')"
            severity="secondary"
            outlined
            :disabled="saving"
            @click="dialogVisible = false"
          />
          <Button
            type="button"
            :label="
              isEditMode
                ? t('invoice.updateInvoice')
                : t('invoice.createInvoice')
            "
            icon="pi pi-save"
            :loading="saving"
            @click="saveLotteryPlay"
          />
        </div>
      </template>
    </Dialog>

    <!-- Detail dialog -->
    <Dialog
      v-model:visible="detailDialogVisible"
      appendTo="body"
      modal
      :autoZIndex="true"
      :baseZIndex="20000"
      :header="selectedDetailPlay?.title || t('invoice.dialogs.detailsTitle')"
      :style="{
        width: 'calc(100vw - 24px)',
        maxWidth: '760px',
        maxHeight: 'calc(100dvh - 24px)',
      }"
      :draggable="false"
      :blockScroll="true"
      class="invoice-detail-dialog"
    >
      <div class="space-y-4">
        <Message v-if="detailLoading" severity="info">{{
          t("invoice.loadingInvoice")
        }}</Message>

        <div
          v-if="selectedDetailPlay"
          class="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-sm"
        >
          <div>
            <div class="text-xs text-gray-500">
              {{ t("invoice.fields.customer") }}
            </div>
            <div class="mt-1 font-semibold">
              {{ getCustomerName(selectedDetailPlay) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">
              {{ t("invoice.fields.date") }}
            </div>
            <div class="mt-1 font-semibold">
              {{
                formatDateOnly(
                  selectedDetailPlay.playDate || selectedDetailPlay.createdAt,
                )
              }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">
              {{ t("invoice.fields.product") }}
            </div>
            <div class="mt-1 font-semibold">
              {{ getProductName(selectedDetailPlay) }}
            </div>
          </div>
        </div>

        <div
          v-if="!detailCategoryGroups.length"
          class="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500"
        >
          {{ t("invoice.noRows") }}
        </div>

        <section
          v-for="group in detailCategoryGroups"
          :key="group.categoryId || group.categoryName"
          class="rounded-xl border border-gray-200 bg-white p-2 sm:p-3"
        >
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr class="text-center font-bold">
                  <th class="border px-3 py-2 min-w-[110px]">
                    {{ group.categoryName }}
                  </th>
                  <th class="border px-3 py-2 min-w-[160px]">
                    {{ t("invoice.print.rowTitle") }}
                  </th>
                  <th class="border px-3 py-2">
                    {{ t("invoice.print.twoDigit") }}
                  </th>
                  <th class="border px-3 py-2">
                    {{ t("invoice.print.threeDigit") }}
                  </th>
                  <th class="border px-3 py-2">
                    {{ t("invoice.print.correctTwoDigit") }}
                  </th>
                  <th class="border px-3 py-2">
                    {{ t("invoice.print.correctThreeDigit") }}
                  </th>
                  <th class="border px-3 py-2 w-10"></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, rowIndex) in group.rows"
                  :key="
                    row._id || row.localId || `${group.categoryId}-${rowIndex}`
                  "
                  class="text-center"
                >
                  <td class="border px-3 py-2">({{ rowIndex + 1 }})</td>
                  <td class="border px-3 py-2 text-left font-medium">
                    {{ row.rowTitle || row.title || "" }}
                  </td>
                  <td class="border px-3 py-2">
                    {{
                      row.isTwoNumber
                        ? formatPlainNumber(row.twoDigitNumber)
                        : ""
                    }}
                  </td>
                  <td class="border px-3 py-2">
                    {{
                      row.isThreeNumber
                        ? formatPlainNumber(row.threeDigitNumber)
                        : ""
                    }}
                  </td>
                  <td class="border px-3 py-2">
                    {{
                      row.isTwoNumber
                        ? formatNumberType(row.winTwoNumberType)
                        : ""
                    }}
                  </td>
                  <td class="border px-3 py-2">
                    {{
                      row.isThreeNumber
                        ? formatNumberType(row.winThreeNumberType)
                        : ""
                    }}
                  </td>
                  <td class="border px-3 py-2 font-bold text-green-500">✓</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-3 max-w-md space-y-1 px-2 text-sm">
            <div
              v-if="group.calculation.twoDigitBaseTotal > 0"
              class="flex justify-between gap-3"
            >
              <span class="font-semibold">{{
                t("invoice.print.twoDigit")
              }}</span>
              <span
                >{{ formatPlainNumber(group.calculation.twoDigitBaseTotal) }} ×
                {{ formatRate(group.calculation.twoDigitRate) }} =
                {{ formatPlayResult(group.result.twoDigitResult) }}</span
              >
            </div>

            <div
              v-if="group.calculation.threeDigitBaseTotal > 0"
              class="flex justify-between gap-3"
            >
              <span class="font-semibold">{{
                t("invoice.print.threeDigit")
              }}</span>
              <span
                >{{
                  formatPlainNumber(group.calculation.threeDigitBaseTotal)
                }}
                × {{ formatRate(group.calculation.threeDigitRate) }} =
                {{ formatPlayResult(group.result.threeDigitResult) }}</span
              >
            </div>

            <div
              v-if="group.calculation.twoDigitCorrectTotal > 0"
              class="flex justify-between gap-3"
            >
              <span class="font-semibold">{{
                t("invoice.print.correctTwoDigit")
              }}</span>
              <span
                >{{
                  formatPlainNumber(group.calculation.twoDigitCorrectTotal)
                }}
                × {{ TWO_DIGIT_WIN_MULTIPLIER }} = -{{
                  formatPlayResult(group.result.twoDigitCorrectResult)
                }}</span
              >
            </div>

            <div
              v-if="group.calculation.threeDigitCorrectTotal > 0"
              class="flex justify-between gap-3"
            >
              <span class="font-semibold">{{
                t("invoice.print.correctThreeDigit")
              }}</span>
              <span
                >{{
                  formatPlainNumber(group.calculation.threeDigitCorrectTotal)
                }}
                × {{ THREE_DIGIT_WIN_MULTIPLIER }} = -{{
                  formatPlayResult(group.result.threeDigitCorrectResult)
                }}</span
              >
            </div>

            <div
              class="mt-2 flex justify-between border-t border-gray-300 pt-2 text-lg font-extrabold"
              :class="getGrandTotalColorClass(group.result.grandTotal)"
            >
              <span>{{ t("invoice.print.total") }}</span>
              <span>{{ formatSignedPlayResult(group.result.grandTotal) }}</span>
            </div>
          </div>
        </section>

        <section
          v-if="detailCategoryGroups.length"
          class="rounded-xl border-2 border-slate-300 bg-slate-50 p-4"
        >
          <div class="text-center text-sm font-extrabold text-gray-900">
            {{ getInvoiceGrandTotalLabel() }}
          </div>

          <div class="mt-2 text-center text-sm font-semibold text-gray-600">
            {{ detailCategoryGrandTotalExpression }}
          </div>

          <div
            class="mt-3 border-t border-slate-300 pt-3 text-center text-2xl font-extrabold"
            :class="getGrandTotalColorClass(detailCategoryGrandTotal)"
          >
            = {{ formatSignedPlayResult(detailCategoryGrandTotal) }}
          </div>
        </section>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            type="button"
            :label="t('invoice.close')"
            severity="secondary"
            outlined
            @click="detailDialogVisible = false"
          />
          <Button
            type="button"
            :label="t('invoice.printButton')"
            icon="pi pi-print"
            :loading="
              printingPlayId ===
              (selectedDetailPlay?.id || selectedDetailPlay?._id)
            "
            @click="printLotteryPlay(selectedDetailPlay)"
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      appendTo="body"
      modal
      :autoZIndex="true"
      :baseZIndex="20000"
      :header="t('invoice.dialogs.deleteTitle')"
      :style="{ width: 'calc(100vw - 24px)', maxWidth: '420px' }"
      :closable="!deleting"
      :draggable="false"
    >
      <div>
        <div class="font-semibold text-gray-900">
          {{ t("invoice.deleteQuestion") }}
        </div>
        <div class="mt-2 text-sm text-gray-500">
          {{ selectedDeletePlay?.title }}
        </div>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            type="button"
            :label="t('invoice.cancel')"
            severity="secondary"
            outlined
            :disabled="deleting"
            @click="closeDeleteDialog"
          />
          <Button
            type="button"
            :label="t('invoice.delete')"
            icon="pi pi-trash"
            severity="danger"
            :loading="deleting"
            @click="confirmDeleteLotteryPlay"
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

:deep(.p-card-caption) {
  margin-bottom: 0.875rem;
}

:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-multiselect),
:deep(.p-inputnumber),
:deep(.p-datepicker) {
  min-height: 44px;
}

:deep(.p-button) {
  min-height: 42px;
}

:deep(.p-inputnumber),
:deep(.p-datepicker),
:deep(.p-select),
:deep(.p-multiselect) {
  width: 100%;
}

:deep(.p-multiselect-label) {
  display: flex;
  min-height: 44px;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

:deep(.p-multiselect-chip) {
  max-width: 100%;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 1.5rem;
  }
}
</style>

<style>
/* Keep dialogs above the application layout. */
.p-dialog-mask {
  z-index: 20000 !important;
}

.p-dialog-mask .p-dialog {
  z-index: 20001 !important;
}

/* Keep Select, MultiSelect, and DatePicker panels above the dialog mask. */
.p-select-overlay,
.p-multiselect-overlay,
.p-datepicker-panel {
  z-index: 30000 !important;
  pointer-events: auto !important;
}

.invoice-form-dialog.p-dialog,
.invoice-detail-dialog.p-dialog {
  display: flex !important;
  max-height: calc(100dvh - 24px) !important;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.3);
}

.invoice-form-dialog .p-dialog-header,
.invoice-detail-dialog .p-dialog-header {
  flex: 0 0 auto;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.invoice-form-dialog .p-dialog-content,
.invoice-detail-dialog .p-dialog-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #ffffff;
}

.invoice-form-dialog .p-dialog-footer,
.invoice-detail-dialog .p-dialog-footer {
  flex: 0 0 auto;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

@media (max-width: 639px) {
  .invoice-form-dialog.p-dialog,
  .invoice-detail-dialog.p-dialog {
    width: 100vw !important;
    height: 100dvh !important;
    max-width: none !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .invoice-form-dialog .p-dialog-header,
  .invoice-detail-dialog .p-dialog-header {
    padding: 0.875rem;
  }

  .invoice-form-dialog .p-dialog-content,
  .invoice-detail-dialog .p-dialog-content {
    padding: 0.75rem;
  }

  .invoice-form-dialog .p-dialog-footer,
  .invoice-detail-dialog .p-dialog-footer {
    padding: 0.75rem;
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }

  .p-select-overlay,
  .p-multiselect-overlay,
  .p-datepicker-panel {
    max-width: calc(100vw - 1rem) !important;
  }
}
</style>
