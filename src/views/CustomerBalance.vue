<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from "vue";

import {
  useRouter,
} from "vue-router";

import {
  useI18n,
} from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";

import api from "../services/api";
import { useAuthStore } from "../stores/auth";

/*
|--------------------------------------------------------------------------
| Local translations
|--------------------------------------------------------------------------
|
| Khmer is the default language for this component.
|
*/

const messages = {
  km: {
    customerBalance: {
      title: "សមតុល្យអតិថិជន",
      availableBalance: "សមតុល្យដែលអាចប្រើបាន",

      refresh: "ធ្វើបច្ចុប្បន្នភាព",
      logout: "ចាកចេញ",
      language: "ភាសា",
      khmer: "ខ្មែរ",
      english: "English",

      invoices: "វិក្កយបត្ររបស់ខ្ញុំ",
      invoiceCount: "{count} វិក្កយបត្រ",

      searchPlaceholder:
        "ស្វែងរកវិក្កយបត្រ ឬចំណងជើងជួរ",

      datePlaceholder:
        "ជ្រើសរើសចន្លោះកាលបរិច្ឆេទ",

      search: "ស្វែងរក",
      today: "ថ្ងៃនេះ",
      clear: "សម្អាត",

      invoice: "វិក្កយបត្រ",
      date: "កាលបរិច្ឆេទ",
      customer: "អតិថិជន",
      category: "ប្រភេទ",
      product: "ផលិតផល",
      total: "សរុប",
      actions: "សកម្មភាព",

      view: "មើល",
      print: "បោះពុម្ព",
      close: "បិទ",

      noInvoices:
        "មិនមានវិក្កយបត្រដែលបានកំណត់ឱ្យអតិថិជននេះទេ។",

      pageOf:
        "ទំព័រ {page} នៃ {total}",

      loading:
        "កំពុងទាញយកទិន្នន័យ...",

      loadingDetails:
        "កំពុងទាញយកព័ត៌មានលម្អិតវិក្កយបត្រ...",

      invoiceDetails:
        "ព័ត៌មានលម្អិតវិក្កយបត្រ",

      number: "ល.រ",
      rowTitle: "ចំណងជើងជួរ",
      twoDigit: "២ លេខ",
      threeDigit: "៣ លេខ",
      correctTwoDigit: "ត្រូវ ២ លេខ",
      correctThreeDigit: "ត្រូវ ៣ លេខ",

      unknownInvoice: "វិក្កយបត្រ",
      noCategory: "-",
      noProduct: "-",

      errors: {
        fetchInvoices:
          "មិនអាចទាញយកវិក្កយបត្របានទេ។",

        fetchDetails:
          "មិនអាចទាញយកព័ត៌មានលម្អិតវិក្កយបត្របានទេ។",

        invoiceIdMissing:
          "រកមិនឃើញលេខសម្គាល់វិក្កយបត្រ។",

        printPopupBlocked:
          "កម្មវិធីរុករកបានរារាំងផ្ទាំងបោះពុម្ព។ សូមអនុញ្ញាត Popup ហើយព្យាយាមម្តងទៀត។",

        printFailed:
          "មិនអាចរៀបចំវិក្កយបត្រសម្រាប់បោះពុម្ពបានទេ។",
      },
    },
  },

  en: {
    customerBalance: {
      title: "Customer Balance",
      availableBalance: "Available balance",

      refresh: "Refresh",
      logout: "Logout",
      language: "Language",
      khmer: "Khmer",
      english: "English",

      invoices: "My Invoices",
      invoiceCount: "{count} invoice(s)",

      searchPlaceholder:
        "Search invoice or row title",

      datePlaceholder:
        "Select date range",

      search: "Search",
      today: "Today",
      clear: "Clear",

      invoice: "Invoice",
      date: "Date",
      customer: "Customer",
      category: "Category",
      product: "Product",
      total: "Total",
      actions: "Actions",

      view: "View",
      print: "Print",
      close: "Close",

      noInvoices:
        "No invoices were assigned to this customer.",

      pageOf:
        "Page {page} of {total}",

      loading:
        "Loading data...",

      loadingDetails:
        "Loading invoice details...",

      invoiceDetails:
        "Invoice details",

      number: "No.",
      rowTitle: "Row title",
      twoDigit: "2 digit",
      threeDigit: "3 digit",
      correctTwoDigit: "Correct 2D",
      correctThreeDigit: "Correct 3D",

      unknownInvoice: "Invoice",
      noCategory: "-",
      noProduct: "-",

      errors: {
        fetchInvoices:
          "Could not fetch invoices.",

        fetchDetails:
          "Could not fetch invoice details.",

        invoiceIdMissing:
          "Invoice ID was not found.",

        printPopupBlocked:
          "The print popup was blocked. Please allow popups and try again.",

        printFailed:
          "Could not prepare the invoice for printing.",
      },
    },
  },
};

/*
|--------------------------------------------------------------------------
| Services
|--------------------------------------------------------------------------
*/

const router =
  useRouter();

const auth =
  useAuthStore();

/*
|--------------------------------------------------------------------------
| Local i18n
|--------------------------------------------------------------------------
|
| Khmer is used when no saved language exists.
|
*/

const savedLanguage =
  localStorage.getItem(
    "customerBalanceLanguage"
  );

const {
  t,
  locale,
} = useI18n({
  useScope: "local",
  inheritLocale: false,

  locale:
    savedLanguage === "en"
      ? "en"
      : "km",

  fallbackLocale: "en",

  messages,
});

watch(
  locale,
  (
    value
  ) => {
    localStorage.setItem(
      "customerBalanceLanguage",
      value
    );
  }
);

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const TWO_DIGIT_RATE =
  100;

const THREE_DIGIT_RATE =
  65;

const TWO_DIGIT_WIN_MULTIPLIER =
  100;

const THREE_DIGIT_WIN_MULTIPLIER =
  600;

/*
|--------------------------------------------------------------------------
| Current-day date range
|--------------------------------------------------------------------------
*/

const createTodayRange = () => {
  const now =
    new Date();

  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  return [
    new Date(today),
    new Date(today),
  ];
};

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const customer =
  ref(
    auth.customer ||
      null
  );

const invoices =
  ref([]);

const loading =
  ref(false);

const detailLoading =
  ref(false);

const printingInvoiceId =
  ref(null);

const detailDialogVisible =
  ref(false);

const selectedInvoice =
  ref(null);

const detailRows =
  ref([]);

const errorMessage =
  ref("");

const search =
  ref("");

/*
 * Current day is selected by default.
 */
const filterDateRange =
  ref(
    createTodayRange()
  );

const page =
  ref(1);

const limit =
  ref(10);

const totalRecords =
  ref(0);

/*
|--------------------------------------------------------------------------
| Language selector
|--------------------------------------------------------------------------
*/

const languageOptions =
  computed(() => {
    return [
      {
        label:
          t(
            "customerBalance.khmer"
          ),

        value: "km",
      },

      {
        label:
          t(
            "customerBalance.english"
          ),

        value: "en",
      },
    ];
  });

/*
|--------------------------------------------------------------------------
| Balance
|--------------------------------------------------------------------------
*/

const balance =
  computed(() => {
    return Number(
      customer.value
        ?.balance ||
        0
    );
  });

const numberLocale =
  computed(() => {
    return locale.value ===
      "km"
      ? "km-KH"
      : "en-US";
  });

const dateLocale =
  computed(() => {
    return locale.value ===
      "km"
      ? "km-KH"
      : "en-GB";
  });

const formattedBalance =
  computed(() => {
    return balance.value
      .toLocaleString(
        numberLocale.value,
        {
          minimumFractionDigits:
            0,

          maximumFractionDigits:
            2,
        }
      );
  });

const totalPages =
  computed(() => {
    const total =
      Number(
        totalRecords.value ||
        0
      );

    const pageSize =
      Number(
        limit.value ||
        10
      );

    return Math.max(
      Math.ceil(
        total /
          pageSize
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

  for (
    const key of keys
  ) {
    if (
      Array.isArray(
        response.data?.data?.[
          key
        ]
      )
    ) {
      return response.data.data[
        key
      ];
    }

    if (
      Array.isArray(
        response.data?.[
          key
        ]
      )
    ) {
      return response.data[
        key
      ];
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| General helpers
|--------------------------------------------------------------------------
*/

const getId = (
  value
) => {
  if (!value) {
    return null;
  }

  if (
    typeof value ===
    "object"
  ) {
    return (
      value.id ||
      value._id ||
      null
    );
  }

  return value;
};

const formatDateOnly = (
  value
) => {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    dateLocale.value,
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );
};

const formatDateForApi = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};

const formatPlainNumber = (
  value
) => {
  return Number(
    value ||
    0
  ).toLocaleString(
    numberLocale.value,
    {
      maximumFractionDigits:
        2,
    }
  );
};

const toPlayResultNumber = (
  value
) => {
  return Math.trunc(
    Math.abs(
      Number(
        value ||
        0
      )
    )
  );
};

const toSignedPlayResultNumber = (
  value
) => {
  const result =
    Math.trunc(
      Number(
        value ||
        0
      )
    );

  return Object.is(
    result,
    -0
  )
    ? 0
    : result;
};

const formatPlayResult = (
  value
) => {
  return toPlayResultNumber(
    value
  ).toLocaleString(
    numberLocale.value
  );
};

const formatSignedPlayResult = (
  value
) => {
  return toSignedPlayResultNumber(
    value
  ).toLocaleString(
    numberLocale.value
  );
};

const formatRate = (
  value
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "";
  }

  return `${number}%`;
};

const getTotalColorClass = (
  value
) => {
  return Number(
    value ||
    0
  ) >= 0
    ? "text-blue-600"
    : "text-red-600";
};

const escapeHtml = (
  value
) => {
  return String(
    value ??
    ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
};

/*
|--------------------------------------------------------------------------
| Invoice helpers
|--------------------------------------------------------------------------
*/

const getInvoiceRows = (
  invoice
) => {
  return Array.isArray(
    invoice?.rows
  )
    ? invoice.rows
    : [];
};

const getCustomerName = (
  invoice
) => {
  const value =
    invoice?.customerId ||
    invoice?.customer;

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return (
      value.username ||
      customer.value
        ?.username ||
      "-"
    );
  }

  return (
    customer.value
      ?.username ||
    "-"
  );
};

const getCategoryName = (
  invoice
) => {
  const values =
    Array.isArray(
      invoice?.categoryIds
    ) &&
    invoice.categoryIds.length
      ? invoice.categoryIds
      : [
          invoice?.categoryId ||
            invoice?.category,
        ].filter(
          Boolean
        );

  const names =
    values
      .map(
        (
          value
        ) => {
          if (
            value &&
            typeof value ===
              "object"
          ) {
            return (
              value.name ||
              ""
            );
          }

          return "";
        }
      )
      .filter(
        Boolean
      );

  return (
    names.join(", ") ||
    t(
      "customerBalance.noCategory"
    )
  );
};

const getProductName = (
  invoice
) => {
  const values =
    Array.isArray(
      invoice?.productIds
    ) &&
    invoice.productIds.length
      ? invoice.productIds
      : [
          invoice?.productId ||
            invoice?.product,
        ].filter(
          Boolean
        );

  const names =
    values
      .map(
        (
          value
        ) => {
          if (
            value &&
            typeof value ===
              "object"
          ) {
            return (
              value.name ||
              ""
            );
          }

          return "";
        }
      )
      .filter(
        Boolean
      );

  return (
    names.join(", ") ||
    t(
      "customerBalance.noProduct"
    )
  );
};

/*
|--------------------------------------------------------------------------
| Invoice calculation
|--------------------------------------------------------------------------
*/

const calculateAmountWithRate = (
  amount,
  rate
) => {
  return (
    Number(
      amount ||
      0
    ) *
    Number(
      rate ||
      0
    )
  ) / 100;
};

const calculateInvoice = (
  invoice
) => {
  const rows =
    getInvoiceRows(
      invoice
    );

  const twoDigitRate =
    Number(
      invoice?.twoDigitRate ??
        TWO_DIGIT_RATE
    );

  const threeDigitRate =
    Number(
      invoice?.threeDigitRate ??
        THREE_DIGIT_RATE
    );

  let twoDigitBaseTotal =
    0;

  let threeDigitBaseTotal =
    0;

  let twoDigitCorrectTotal =
    0;

  let threeDigitCorrectTotal =
    0;

  for (
    const row of rows
  ) {
    if (
      row.isTwoNumber
    ) {
      twoDigitBaseTotal +=
        Number(
          row.twoDigitNumber ||
            0
        );

      twoDigitCorrectTotal +=
        Number(
          row.winTwoNumberType ||
            0
        );
    }

    if (
      row.isThreeNumber
    ) {
      threeDigitBaseTotal +=
        Number(
          row.threeDigitNumber ||
            0
        );

      threeDigitCorrectTotal +=
        Number(
          row.winThreeNumberType ||
            0
        );
    }
  }

  const twoDigitResult =
    toPlayResultNumber(
      calculateAmountWithRate(
        twoDigitBaseTotal,
        twoDigitRate
      )
    );

  const threeDigitResult =
    toPlayResultNumber(
      calculateAmountWithRate(
        threeDigitBaseTotal,
        threeDigitRate
      )
    );

  const twoDigitCorrectResult =
    toPlayResultNumber(
      twoDigitCorrectTotal *
        TWO_DIGIT_WIN_MULTIPLIER
    );

  const threeDigitCorrectResult =
    toPlayResultNumber(
      threeDigitCorrectTotal *
        THREE_DIGIT_WIN_MULTIPLIER
    );

  return {
    twoDigitBaseTotal,
    threeDigitBaseTotal,

    twoDigitCorrectTotal,
    threeDigitCorrectTotal,

    twoDigitRate,
    threeDigitRate,

    twoDigitResult,
    threeDigitResult,

    twoDigitCorrectResult,
    threeDigitCorrectResult,

    grandTotal:
      twoDigitResult +
      threeDigitResult -
      twoDigitCorrectResult -
      threeDigitCorrectResult,
  };
};

const getInvoiceGrandTotal = (
  invoice
) => {
  return calculateInvoice(
    invoice
  ).grandTotal;
};

const detailCalculation =
  computed(() => {
    return calculateInvoice(
      selectedInvoice.value
    );
  });

const detailDisplayRows =
  computed(() => {
    return detailRows.value.map(
      (
        row,
        index
      ) => {
        return {
          index:
            index + 1,

          rowTitle:
            row.rowTitle ||
            row.title ||
            "",

          twoDigitNumber:
            row.isTwoNumber
              ? Number(
                  row.twoDigitNumber ||
                    0
                )
              : null,

          threeDigitNumber:
            row.isThreeNumber
              ? Number(
                  row.threeDigitNumber ||
                    0
                )
              : null,

          twoDigitCorrect:
            row.isTwoNumber &&
            Number(
              row.winTwoNumberType ||
                0
            ) > 0
              ? Number(
                  row.winTwoNumberType
                )
              : "",

          threeDigitCorrect:
            row.isThreeNumber &&
            Number(
              row.winThreeNumberType ||
                0
            ) > 0
              ? Number(
                  row.winThreeNumberType
                )
              : "",
        };
      }
    );
  });

/*
|--------------------------------------------------------------------------
| Save balance locally
|--------------------------------------------------------------------------
*/

const updateCustomerBalanceLocally = (
  value
) => {
  customer.value = {
    ...customer.value,
    ...value,
  };

  auth.customer =
    customer.value;

  localStorage.setItem(
    "customer",
    JSON.stringify(
      customer.value
    )
  );
};

/*
|--------------------------------------------------------------------------
| Fetch current customer's invoices
|--------------------------------------------------------------------------
*/

const fetchInvoices =
  async () => {
    try {
      loading.value =
        true;

      errorMessage.value =
        "";

      const params = {
        page:
          page.value,

        limit:
          limit.value,
      };

      const searchValue =
        search.value.trim();

      if (searchValue) {
        params.search =
          searchValue;
      }

      const range =
        Array.isArray(
          filterDateRange.value
        )
          ? filterDateRange.value
          : [];

      const startDate =
        range[0] ||
        null;

      const endDate =
        range[1] ||
        range[0] ||
        null;

      if (startDate) {
        params.dateFrom =
          formatDateForApi(
            startDate
          );
      }

      if (endDate) {
        params.dateTo =
          formatDateForApi(
            endDate
          );
      }

      const response =
        await api.get(
          "/customer-invoices",
          {
            params,
          }
        );

      invoices.value =
        extractArrayData(
          response,
          [
            "invoices",
            "lotteryPlays",
            "plays",
            "items",
            "results",
          ]
        );

      totalRecords.value =
        Number(
          response.data
            ?.pagination
            ?.total ??
          response.data
            ?.data
            ?.pagination
            ?.total ??
          invoices.value.length
        );

      const customerData =
        response.data
          ?.customer ||
        response.data
          ?.data?.customer ||
        null;

      if (
        customerData
      ) {
        updateCustomerBalanceLocally(
          customerData
        );
      }
    } catch (error) {
      console.error(
        "Fetch customer invoices error:",
        error
      );

      invoices.value = [];

      totalRecords.value =
        0;

      errorMessage.value =
        error.response
          ?.data?.message ||
        t(
          "customerBalance.errors.fetchInvoices"
        );
    } finally {
      loading.value =
        false;
    }
  };

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const applyFilter = () => {
  page.value = 1;

  fetchInvoices();
};

const resetToToday = () => {
  search.value = "";

  filterDateRange.value =
    createTodayRange();

  page.value = 1;

  fetchInvoices();
};

const clearAllDates = () => {
  search.value = "";

  filterDateRange.value =
    null;

  page.value = 1;

  fetchInvoices();
};

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

const onPageChange = (
  event
) => {
  page.value =
    event.page + 1;

  limit.value =
    event.rows;

  fetchInvoices();
};

const goToPreviousPage = () => {
  if (
    loading.value ||
    page.value <= 1
  ) {
    return;
  }

  page.value -= 1;

  fetchInvoices();
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

  fetchInvoices();
};

/*
|--------------------------------------------------------------------------
| Invoice details
|--------------------------------------------------------------------------
*/

const openDetailDialog =
  async (
    invoice
  ) => {
    try {
      errorMessage.value =
        "";

      selectedInvoice.value =
        invoice;

      detailRows.value =
        getInvoiceRows(
          invoice
        );

      detailDialogVisible.value =
        true;

      detailLoading.value =
        true;

      const invoiceId =
        getId(invoice);

      if (!invoiceId) {
        throw new Error(
          t(
            "customerBalance.errors.invoiceIdMissing"
          )
        );
      }

      const response =
        await api.get(
          `/customer-invoices/${invoiceId}`
        );

      const freshInvoice =
        response.data?.data ||
        invoice;

      selectedInvoice.value =
        freshInvoice;

      detailRows.value =
        getInvoiceRows(
          freshInvoice
        );
    } catch (error) {
      console.error(
        "Fetch invoice details error:",
        error
      );

      errorMessage.value =
        error.response
          ?.data?.message ||
        error.message ||
        t(
          "customerBalance.errors.fetchDetails"
        );
    } finally {
      detailLoading.value =
        false;
    }
  };

/*
|--------------------------------------------------------------------------
| Print HTML
|--------------------------------------------------------------------------
*/

const buildPrintHtml = (
  invoice
) => {
  const rows =
    getInvoiceRows(
      invoice
    );

  const calculation =
    calculateInvoice(
      invoice
    );

  const printedRows =
    rows
      .map(
        (
          row,
          index
        ) => {
          const twoDigit =
            row.isTwoNumber
              ? formatPlainNumber(
                  row.twoDigitNumber
                )
              : "";

          const threeDigit =
            row.isThreeNumber
              ? formatPlainNumber(
                  row.threeDigitNumber
                )
              : "";

          const correctTwo =
            row.isTwoNumber &&
            Number(
              row.winTwoNumberType ||
                0
            ) > 0
              ? formatPlainNumber(
                  row.winTwoNumberType
                )
              : "";

          const correctThree =
            row.isThreeNumber &&
            Number(
              row.winThreeNumberType ||
                0
            ) > 0
              ? formatPlainNumber(
                  row.winThreeNumberType
                )
              : "";

          return `
            <tr>
              <td class="center">
                ${index + 1}
              </td>

              <td>
                ${escapeHtml(
                  row.rowTitle ||
                    row.title ||
                    ""
                )}
              </td>

              <td class="center">
                ${escapeHtml(
                  twoDigit
                )}
              </td>

              <td class="center">
                ${escapeHtml(
                  threeDigit
                )}
              </td>

              <td class="center">
                ${escapeHtml(
                  correctTwo
                )}
              </td>

              <td class="center">
                ${escapeHtml(
                  correctThree
                )}
              </td>
            </tr>
          `;
        }
      )
      .join("");

  const correctTwoLine =
    calculation
      .twoDigitCorrectTotal >
    0
      ? `
        <div class="calculation-row deduction">
          <strong>
            ${escapeHtml(
              t(
                "customerBalance.correctTwoDigit"
              )
            )}
          </strong>

          <span>
            ${formatPlayResult(
              calculation
                .twoDigitCorrectTotal
            )}
            ×
            ${TWO_DIGIT_WIN_MULTIPLIER}
            =
            -${formatPlayResult(
              calculation
                .twoDigitCorrectResult
            )}
          </span>
        </div>
      `
      : "";

  const correctThreeLine =
    calculation
      .threeDigitCorrectTotal >
    0
      ? `
        <div class="calculation-row deduction">
          <strong>
            ${escapeHtml(
              t(
                "customerBalance.correctThreeDigit"
              )
            )}
          </strong>

          <span>
            ${formatPlayResult(
              calculation
                .threeDigitCorrectTotal
            )}
            ×
            ${THREE_DIGIT_WIN_MULTIPLIER}
            =
            -${formatPlayResult(
              calculation
                .threeDigitCorrectResult
            )}
          </span>
        </div>
      `
      : "";

  const totalColor =
    calculation.grandTotal >=
    0
      ? "#2563eb"
      : "#dc2626";

  return `
    <!DOCTYPE html>

    <html lang="${locale.value}">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>&#8203;</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 18px;
            color: #111827;
            font-family:
              "Noto Sans Khmer",
              Inter,
              Arial,
              sans-serif;
          }

          .invoice {
            width: 780px;
            max-width: 100%;
            margin: 0 auto;
          }

          h1 {
            margin: 0 0 14px;
            font-size: 22px;
          }

          .meta {
            display: grid;
            grid-template-columns:
              1fr 1fr;
            gap: 8px;
            margin-bottom: 14px;
          }

          .meta-item {
            padding: 8px;
            border-radius: 6px;
            background: #f8fafc;
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 13px;
          }

          th,
          td {
            padding: 7px;
            border:
              1px solid #cbd5e1;
            vertical-align: middle;
          }

          th {
            text-align: center;
            font-weight: 800;
          }

          .center {
            text-align: center;
          }

          .calculation {
            margin-top: 14px;
            font-size: 15px;
          }

          .calculation-row {
            display: flex;
            justify-content:
              space-between;
            gap: 12px;
            margin-bottom: 7px;
          }

          .deduction {
            color: #dc2626;
          }

          .grand-total {
            display: flex;
            justify-content:
              space-between;
            margin-top: 12px;
            padding-top: 12px;
            border-top:
              1px solid #94a3b8;
            color: ${totalColor};
            font-size: 21px;
            font-weight: 900;
          }

          @media print {
            body {
              padding: 0;
            }

            .invoice {
              width: 100%;
            }

            @page {
              margin: 10mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="invoice">
          <h1>
            ${escapeHtml(
              invoice.title ||
                t(
                  "customerBalance.unknownInvoice"
                )
            )}
          </h1>

          <div class="meta">
            <div class="meta-item">
              <strong>
                ${escapeHtml(
                  t(
                    "customerBalance.customer"
                  )
                )}:
              </strong>

              ${escapeHtml(
                getCustomerName(
                  invoice
                )
              )}
            </div>

            <div class="meta-item">
              <strong>
                ${escapeHtml(
                  t(
                    "customerBalance.date"
                  )
                )}:
              </strong>

              ${escapeHtml(
                formatDateOnly(
                  invoice.playDate ||
                    invoice.createdAt
                )
              )}
            </div>

            <div class="meta-item">
              <strong>
                ${escapeHtml(
                  t(
                    "customerBalance.category"
                  )
                )}:
              </strong>

              ${escapeHtml(
                getCategoryName(
                  invoice
                )
              )}
            </div>

            <div class="meta-item">
              <strong>
                ${escapeHtml(
                  t(
                    "customerBalance.product"
                  )
                )}:
              </strong>

              ${escapeHtml(
                getProductName(
                  invoice
                )
              )}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 55px">
                  ${escapeHtml(
                    t(
                      "customerBalance.number"
                    )
                  )}
                </th>

                <th>
                  ${escapeHtml(
                    t(
                      "customerBalance.rowTitle"
                    )
                  )}
                </th>

                <th>
                  ${escapeHtml(
                    t(
                      "customerBalance.twoDigit"
                    )
                  )}
                </th>

                <th>
                  ${escapeHtml(
                    t(
                      "customerBalance.threeDigit"
                    )
                  )}
                </th>

                <th>
                  ${escapeHtml(
                    t(
                      "customerBalance.correctTwoDigit"
                    )
                  )}
                </th>

                <th>
                  ${escapeHtml(
                    t(
                      "customerBalance.correctThreeDigit"
                    )
                  )}
                </th>
              </tr>
            </thead>

            <tbody>
              ${printedRows}
            </tbody>
          </table>

          <div class="calculation">
            <div class="calculation-row">
              <strong>
                ${escapeHtml(
                  t(
                    "customerBalance.twoDigit"
                  )
                )}
              </strong>

              <span>
                ${formatPlayResult(
                  calculation
                    .twoDigitBaseTotal
                )}
                ×
                ${formatRate(
                  calculation
                    .twoDigitRate
                )}
                =
                ${formatPlayResult(
                  calculation
                    .twoDigitResult
                )}
              </span>
            </div>

            <div class="calculation-row">
              <strong>
                ${escapeHtml(
                  t(
                    "customerBalance.threeDigit"
                  )
                )}
              </strong>

              <span>
                ${formatPlayResult(
                  calculation
                    .threeDigitBaseTotal
                )}
                ×
                ${formatRate(
                  calculation
                    .threeDigitRate
                )}
                =
                ${formatPlayResult(
                  calculation
                    .threeDigitResult
                )}
              </span>
            </div>

            ${correctTwoLine}
            ${correctThreeLine}

            <div class="grand-total">
              <span>
                ${escapeHtml(
                  t(
                    "customerBalance.total"
                  )
                )}
              </span>

              <span>
                ${formatSignedPlayResult(
                  calculation
                    .grandTotal
                )}
              </span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

/*
|--------------------------------------------------------------------------
| Print invoice
|--------------------------------------------------------------------------
*/

const printInvoice =
  async (
    invoice
  ) => {
    errorMessage.value =
      "";

    const invoiceId =
      getId(invoice);

    if (!invoiceId) {
      errorMessage.value =
        t(
          "customerBalance.errors.invoiceIdMissing"
        );

      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=750"
      );

    if (!printWindow) {
      errorMessage.value =
        t(
          "customerBalance.errors.printPopupBlocked"
        );

      return;
    }

    try {
      printingInvoiceId.value =
        invoiceId;

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>
          <head>
            <meta charset="UTF-8" />
            <title>&#8203;</title>
          </head>

          <body
            style="
              padding: 30px;
              font-family: Arial, sans-serif;
            "
          >
            ${escapeHtml(
              t(
                "customerBalance.loading"
              )
            )}
          </body>
        </html>
      `);

      printWindow.document.close();

      const response =
        await api.get(
          `/customer-invoices/${invoiceId}`
        );

      const freshInvoice =
        response.data?.data ||
        invoice;

      printWindow.document.open();

      printWindow.document.write(
        buildPrintHtml(
          freshInvoice
        )
      );

      printWindow.document.close();

      printWindow.document.title =
        "\u200B";

      printWindow.focus();

      const startPrint = () => {
        setTimeout(
          () => {
            printWindow.print();
          },
          300
        );
      };

      if (
        printWindow.document
          .readyState ===
        "complete"
      ) {
        startPrint();
      } else {
        printWindow.onload =
          startPrint;
      }
    } catch (error) {
      console.error(
        "Print invoice error:",
        error
      );

      errorMessage.value =
        error.response
          ?.data?.message ||
        t(
          "customerBalance.errors.printFailed"
        );

      printWindow.close();
    } finally {
      printingInvoiceId.value =
        null;
    }
  };

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const logout =
  async () => {
    auth.logout();

    await router.replace({
      name: "login",
    });
  };

/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

onMounted(
  async () => {
    if (
      auth.user?.role !==
      "customer"
    ) {
      await router.replace({
        name: "dashboard",
      });

      return;
    }

    /*
     * The initial request automatically sends today's date.
     */
    await fetchInvoices();
  }
);
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 p-3 sm:p-6"
  >
    <div
      class="mx-auto w-full max-w-7xl space-y-4"
    >
      <!-- Header -->

      <Card>
        <template #content>
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div
              class="flex items-center gap-3"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"
              >
                <i
                  class="pi pi-wallet text-xl"
                ></i>
              </div>

              <h1
                class="text-xl font-bold text-slate-900 sm:text-2xl"
              >
                {{
                  t(
                    "customerBalance.title"
                  )
                }}
              </h1>
            </div>

            <div
              class="grid grid-cols-1 gap-2 sm:flex sm:items-center"
            >
              <Select
                v-model="locale"
                :options="
                  languageOptions
                "
                optionLabel="label"
                optionValue="value"
                class="w-full sm:w-36"
                :aria-label="
                  t(
                    'customerBalance.language'
                  )
                "
              />

              <div
                class="grid grid-cols-2 gap-2"
              >
                <Button
                  :label="
                    t(
                      'customerBalance.refresh'
                    )
                  "
                  icon="pi pi-refresh"
                  severity="secondary"
                  outlined
                  :loading="loading"
                  @click="
                    fetchInvoices
                  "
                />

                <Button
                  :label="
                    t(
                      'customerBalance.logout'
                    )
                  "
                  icon="pi pi-sign-out"
                  severity="danger"
                  outlined
                  @click="
                    logout
                  "
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

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

      <!-- Balance -->

      <Card>
        <template #content>
          <div
            class="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg sm:p-8"
          >
            <div
              class="flex items-start justify-between gap-3"
            >
              <div>
                <p
                  class="text-sm font-medium text-emerald-100"
                >
                  {{
                    t(
                      "customerBalance.availableBalance"
                    )
                  }}
                </p>

                <div
                  v-if="loading"
                  class="mt-4"
                >
                  <i
                    class="pi pi-spin pi-spinner text-3xl"
                  ></i>
                </div>

                <h2
                  v-else
                  class="mt-3 break-all text-4xl font-bold sm:text-5xl"
                >
                  {{
                    formattedBalance
                  }}
                </h2>
              </div>

              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
              >
                <i
                  class="pi pi-credit-card text-2xl"
                ></i>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Invoices -->

      <Card>
        <template #title>
          <div
            class="flex items-center gap-3"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
            >
              <i
                class="pi pi-file text-lg"
              ></i>
            </div>

            <div>
              <h2
                class="text-xl font-bold text-slate-900"
              >
                {{
                  t(
                    "customerBalance.invoices"
                  )
                }}
              </h2>

              <p
                class="text-sm font-normal text-slate-500"
              >
                {{
                  t(
                    "customerBalance.invoiceCount",
                    {
                      count:
                        totalRecords
                    }
                  )
                }}
              </p>
            </div>
          </div>
        </template>

        <template #content>
          <!-- Filters -->

          <div
            class="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_280px_auto]"
          >
            <InputText
              v-model="search"
              class="w-full"
              :placeholder="
                t(
                  'customerBalance.searchPlaceholder'
                )
              "
              @keyup.enter="
                applyFilter
              "
            />

            <DatePicker
              v-model="
                filterDateRange
              "
              selectionMode="range"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-full"
              :placeholder="
                t(
                  'customerBalance.datePlaceholder'
                )
              "
            />

            <div
              class="grid grid-cols-3 gap-2"
            >
              <Button
                :label="
                  t(
                    'customerBalance.search'
                  )
                "
                icon="pi pi-search"
                @click="
                  applyFilter
                "
              />

              <Button
                :label="
                  t(
                    'customerBalance.today'
                  )
                "
                icon="pi pi-calendar"
                severity="secondary"
                outlined
                @click="
                  resetToToday
                "
              />

              <Button
                :label="
                  t(
                    'customerBalance.clear'
                  )
                "
                icon="pi pi-times"
                severity="secondary"
                outlined
                @click="
                  clearAllDates
                "
              />
            </div>
          </div>

          <!-- Mobile -->

          <section
            class="space-y-3 md:hidden"
          >
            <div
              v-if="loading"
              class="py-10 text-center"
            >
              <i
                class="pi pi-spin pi-spinner text-3xl text-primary"
              ></i>
            </div>

            <template v-else>
              <article
                v-for="
                  invoice in invoices
                "
                :key="
                  getId(
                    invoice
                  )
                "
                class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div
                  class="flex items-start justify-between gap-3"
                >
                  <div
                    class="min-w-0"
                  >
                    <h3
                      class="truncate text-lg font-bold text-slate-900"
                    >
                      {{
                        invoice.title ||
                        t(
                          "customerBalance.unknownInvoice"
                        )
                      }}
                    </h3>

                    <p
                      class="mt-1 text-sm text-slate-500"
                    >
                      {{
                        formatDateOnly(
                          invoice.playDate ||
                            invoice.createdAt
                        )
                      }}
                    </p>
                  </div>

                  <div
                    class="text-right"
                  >
                    <div
                      class="text-xs text-slate-500"
                    >
                      {{
                        t(
                          "customerBalance.total"
                        )
                      }}
                    </div>

                    <div
                      class="mt-1 font-bold"
                      :class="
                        getTotalColorClass(
                          getInvoiceGrandTotal(
                            invoice
                          )
                        )
                      "
                    >
                      {{
                        formatSignedPlayResult(
                          getInvoiceGrandTotal(
                            invoice
                          )
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div
                  class="mt-3 rounded-lg bg-slate-50 p-3 text-sm"
                >
                  <div
                    class="flex justify-between gap-3"
                  >
                    <span
                      class="text-slate-500"
                    >
                      {{
                        t(
                          "customerBalance.category"
                        )
                      }}
                    </span>

                    <span
                      class="max-w-[65%] text-right font-medium"
                    >
                      {{
                        getCategoryName(
                          invoice
                        )
                      }}
                    </span>
                  </div>

                  <div
                    class="mt-2 flex justify-between gap-3"
                  >
                    <span
                      class="text-slate-500"
                    >
                      {{
                        t(
                          "customerBalance.product"
                        )
                      }}
                    </span>

                    <span
                      class="max-w-[65%] text-right font-medium"
                    >
                      {{
                        getProductName(
                          invoice
                        )
                      }}
                    </span>
                  </div>
                </div>

                <div
                  class="mt-3 grid grid-cols-2 gap-2"
                >
                  <Button
                    :label="
                      t(
                        'customerBalance.view'
                      )
                    "
                    icon="pi pi-eye"
                    severity="info"
                    outlined
                    @click="
                      openDetailDialog(
                        invoice
                      )
                    "
                  />

                  <Button
                    :label="
                      t(
                        'customerBalance.print'
                      )
                    "
                    icon="pi pi-print"
                    :loading="
                      printingInvoiceId ===
                      getId(
                        invoice
                      )
                    "
                    @click="
                      printInvoice(
                        invoice
                      )
                    "
                  />
                </div>
              </article>

              <div
                v-if="
                  !invoices.length
                "
                class="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500"
              >
                {{
                  t(
                    "customerBalance.noInvoices"
                  )
                }}
              </div>
            </template>

            <div
              v-if="
                totalRecords >
                0
              "
              class="flex items-center justify-between rounded-xl border border-slate-200 p-2"
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
                class="text-sm font-medium"
              >
                {{
                  t(
                    "customerBalance.pageOf",
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
          </section>

          <!-- Desktop -->

          <section
            class="hidden md:block"
          >
            <DataTable
              :value="invoices"
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
                  50
                ]
              "
              tableStyle="min-width: 900px"
              @page="
                onPageChange
              "
            >
              <Column
                field="title"
                :header="
                  t(
                    'customerBalance.invoice'
                  )
                "
                style="min-width: 190px"
              >
                <template #body="{ data }">
                  <span
                    class="font-semibold"
                  >
                    {{
                      data.title ||
                      t(
                        "customerBalance.unknownInvoice"
                      )
                    }}
                  </span>
                </template>
              </Column>

              <Column
                :header="
                  t(
                    'customerBalance.date'
                  )
                "
                style="min-width: 130px"
              >
                <template #body="{ data }">
                  {{
                    formatDateOnly(
                      data.playDate ||
                        data.createdAt
                    )
                  }}
                </template>
              </Column>

              <Column
                :header="
                  t(
                    'customerBalance.category'
                  )
                "
                style="min-width: 180px"
              >
                <template #body="{ data }">
                  {{
                    getCategoryName(
                      data
                    )
                  }}
                </template>
              </Column>

              <Column
                :header="
                  t(
                    'customerBalance.product'
                  )
                "
                style="min-width: 180px"
              >
                <template #body="{ data }">
                  {{
                    getProductName(
                      data
                    )
                  }}
                </template>
              </Column>

              <Column
                :header="
                  t(
                    'customerBalance.total'
                  )
                "
                style="min-width: 120px"
              >
                <template #body="{ data }">
                  <span
                    class="font-bold"
                    :class="
                      getTotalColorClass(
                        getInvoiceGrandTotal(
                          data
                        )
                      )
                    "
                  >
                    {{
                      formatSignedPlayResult(
                        getInvoiceGrandTotal(
                          data
                        )
                      )
                    }}
                  </span>
                </template>
              </Column>

              <Column
                :header="
                  t(
                    'customerBalance.actions'
                  )
                "
                frozen
                alignFrozen="right"
                style="min-width: 145px"
              >
                <template #body="{ data }">
                  <div
                    class="flex gap-2"
                  >
                    <Button
                      icon="pi pi-eye"
                      severity="info"
                      size="small"
                      :title="
                        t(
                          'customerBalance.view'
                        )
                      "
                      @click="
                        openDetailDialog(
                          data
                        )
                      "
                    />

                    <Button
                      icon="pi pi-print"
                      size="small"
                      :title="
                        t(
                          'customerBalance.print'
                        )
                      "
                      :loading="
                        printingInvoiceId ===
                        getId(
                          data
                        )
                      "
                      @click="
                        printInvoice(
                          data
                        )
                      "
                    />
                  </div>
                </template>
              </Column>

              <template #empty>
                <div
                  class="py-10 text-center text-slate-500"
                >
                  {{
                    t(
                      "customerBalance.noInvoices"
                    )
                  }}
                </div>
              </template>
            </DataTable>
          </section>
        </template>
      </Card>

      <!-- Invoice details -->

      <Dialog
        v-model:visible="
          detailDialogVisible
        "
        modal
        :header="
          selectedInvoice?.title ||
          t(
            'customerBalance.invoiceDetails'
          )
        "
        :style="{
          width: '96vw',
          maxWidth: '800px'
        }"
        :draggable="false"
        :blockScroll="true"
        class="customer-invoice-detail-dialog"
      >
        <div
          class="space-y-4"
        >
          <Message
            v-if="
              detailLoading
            "
            severity="info"
            :closable="false"
          >
            {{
              t(
                "customerBalance.loadingDetails"
              )
            }}
          </Message>

          <template
            v-if="
              selectedInvoice
            "
          >
            <div
              class="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"
            >
              <div>
                <div
                  class="text-xs text-slate-500"
                >
                  {{
                    t(
                      "customerBalance.customer"
                    )
                  }}
                </div>

                <div
                  class="mt-1 font-semibold"
                >
                  {{
                    getCustomerName(
                      selectedInvoice
                    )
                  }}
                </div>
              </div>

              <div>
                <div
                  class="text-xs text-slate-500"
                >
                  {{
                    t(
                      "customerBalance.date"
                    )
                  }}
                </div>

                <div
                  class="mt-1 font-semibold"
                >
                  {{
                    formatDateOnly(
                      selectedInvoice.playDate ||
                        selectedInvoice.createdAt
                    )
                  }}
                </div>
              </div>

              <div>
                <div
                  class="text-xs text-slate-500"
                >
                  {{
                    t(
                      "customerBalance.category"
                    )
                  }}
                </div>

                <div
                  class="mt-1 font-semibold"
                >
                  {{
                    getCategoryName(
                      selectedInvoice
                    )
                  }}
                </div>
              </div>

              <div>
                <div
                  class="text-xs text-slate-500"
                >
                  {{
                    t(
                      "customerBalance.product"
                    )
                  }}
                </div>

                <div
                  class="mt-1 font-semibold"
                >
                  {{
                    getProductName(
                      selectedInvoice
                    )
                  }}
                </div>
              </div>
            </div>

            <DataTable
              :value="
                detailDisplayRows
              "
              scrollable
              tableStyle="min-width: 680px"
            >
              <Column
                field="index"
                :header="
                  t(
                    'customerBalance.number'
                  )
                "
                style="width: 70px"
              />

              <Column
                field="rowTitle"
                :header="
                  t(
                    'customerBalance.rowTitle'
                  )
                "
                style="min-width: 180px"
              />

              <Column
                field="twoDigitNumber"
                :header="
                  t(
                    'customerBalance.twoDigit'
                  )
                "
                style="min-width: 100px"
              >
                <template #body="{ data }">
                  {{
                    data.twoDigitNumber ===
                    null
                      ? ""
                      : formatPlainNumber(
                          data.twoDigitNumber
                        )
                  }}
                </template>
              </Column>

              <Column
                field="threeDigitNumber"
                :header="
                  t(
                    'customerBalance.threeDigit'
                  )
                "
                style="min-width: 100px"
              >
                <template #body="{ data }">
                  {{
                    data.threeDigitNumber ===
                    null
                      ? ""
                      : formatPlainNumber(
                          data.threeDigitNumber
                        )
                  }}
                </template>
              </Column>

              <Column
                field="twoDigitCorrect"
                :header="
                  t(
                    'customerBalance.correctTwoDigit'
                  )
                "
                style="min-width: 110px"
              />

              <Column
                field="threeDigitCorrect"
                :header="
                  t(
                    'customerBalance.correctThreeDigit'
                  )
                "
                style="min-width: 110px"
              />
            </DataTable>

            <section
              class="rounded-xl border border-slate-200 p-4"
            >
              <div
                class="space-y-2 text-sm"
              >
                <div
                  class="flex items-center justify-between gap-3"
                >
                  <span class="font-semibold">
                    {{
                      t(
                        "customerBalance.twoDigit"
                      )
                    }}
                  </span>

                  <span class="text-right">
                    {{
                      formatPlainNumber(
                        detailCalculation.twoDigitBaseTotal
                      )
                    }}
                    ×
                    {{
                      formatRate(
                        detailCalculation.twoDigitRate
                      )
                    }}
                    =
                    {{
                      formatPlayResult(
                        detailCalculation.twoDigitResult
                      )
                    }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between gap-3"
                >
                  <span class="font-semibold">
                    {{
                      t(
                        "customerBalance.threeDigit"
                      )
                    }}
                  </span>

                  <span class="text-right">
                    {{
                      formatPlainNumber(
                        detailCalculation.threeDigitBaseTotal
                      )
                    }}
                    ×
                    {{
                      formatRate(
                        detailCalculation.threeDigitRate
                      )
                    }}
                    =
                    {{
                      formatPlayResult(
                        detailCalculation.threeDigitResult
                      )
                    }}
                  </span>
                </div>

                <div
                  v-if="
                    detailCalculation.twoDigitCorrectTotal >
                    0
                  "
                  class="flex items-center justify-between gap-3 text-red-600"
                >
                  <span class="font-semibold">
                    {{
                      t(
                        "customerBalance.correctTwoDigit"
                      )
                    }}
                  </span>

                  <span class="text-right">
                    {{
                      formatPlainNumber(
                        detailCalculation.twoDigitCorrectTotal
                      )
                    }}
                    ×
                    {{
                      TWO_DIGIT_WIN_MULTIPLIER
                    }}
                    =
                    -
                    {{
                      formatPlayResult(
                        detailCalculation.twoDigitCorrectResult
                      )
                    }}
                  </span>
                </div>

                <div
                  v-if="
                    detailCalculation.threeDigitCorrectTotal >
                    0
                  "
                  class="flex items-center justify-between gap-3 text-red-600"
                >
                  <span class="font-semibold">
                    {{
                      t(
                        "customerBalance.correctThreeDigit"
                      )
                    }}
                  </span>

                  <span class="text-right">
                    {{
                      formatPlainNumber(
                        detailCalculation.threeDigitCorrectTotal
                      )
                    }}
                    ×
                    {{
                      THREE_DIGIT_WIN_MULTIPLIER
                    }}
                    =
                    -
                    {{
                      formatPlayResult(
                        detailCalculation.threeDigitCorrectResult
                      )
                    }}
                  </span>
                </div>

                <div
                  class="my-3 border-t border-slate-200"
                ></div>

                <div
                  class="flex items-center justify-between text-xl font-bold"
                  :class="
                    getTotalColorClass(
                      detailCalculation.grandTotal
                    )
                  "
                >
                  <span>
                    {{
                      t(
                        "customerBalance.total"
                      )
                    }}
                  </span>

                  <span>
                    {{
                      formatSignedPlayResult(
                        detailCalculation.grandTotal
                      )
                    }}
                  </span>
                </div>
              </div>
            </section>
          </template>
        </div>

        <template #footer>
          <div
            class="grid w-full grid-cols-2 gap-2"
          >
            <Button
              :label="
                t(
                  'customerBalance.close'
                )
              "
              severity="secondary"
              outlined
              @click="
                detailDialogVisible = false
              "
            />

            <Button
              :label="
                t(
                  'customerBalance.print'
                )
              "
              icon="pi pi-print"
              :disabled="
                !selectedInvoice
              "
              :loading="
                printingInvoiceId ===
                getId(
                  selectedInvoice
                )
              "
              @click="
                printInvoice(
                  selectedInvoice
                )
              "
            />
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 1rem;
}

:deep(.p-card-content) {
  padding: 0;
}

:deep(.p-inputtext),
:deep(.p-datepicker),
:deep(.p-select),
:deep(.p-button) {
  min-height: 44px;
}

:deep(.p-select),
:deep(.p-datepicker) {
  width: 100%;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 1.5rem;
  }
}
</style>

<style>
.customer-invoice-detail-dialog {
  display: flex;
  max-height: 94vh;
  flex-direction: column;
}

.customer-invoice-detail-dialog
  .p-dialog-header {
  flex-shrink: 0;
  border-bottom: 1px solid #e2e8f0;
}

.customer-invoice-detail-dialog
  .p-dialog-content {
  flex: 1;
  overflow-y: auto;
}

.customer-invoice-detail-dialog
  .p-dialog-footer {
  flex-shrink: 0;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 639px) {
  .customer-invoice-detail-dialog {
    width: 100vw !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .customer-invoice-detail-dialog
    .p-dialog-header {
    padding: 0.875rem;
  }

  .customer-invoice-detail-dialog
    .p-dialog-content {
    padding: 0.75rem;
  }

  .customer-invoice-detail-dialog
    .p-dialog-footer {
    padding: 0.75rem;
    padding-bottom: max(
      0.75rem,
      env(safe-area-inset-bottom)
    );
  }
}
</style>