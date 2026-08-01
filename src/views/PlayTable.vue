<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import Message from 'primevue/message';
import DatePicker from 'primevue/datepicker';

import api from '../services/api';

const { t, locale } = useI18n();

const TWO_DIGIT_RATE_NUMBERS = [
  100,
  101,
  102,
  103,
  104,
  105,
  106,
  107,
  108,
  109
];

const THREE_DIGIT_RATE_NUMBERS = [
  65,
  70,
  75,
  80,
  85,
  90,
  95,
  100
];

const TWO_DIGIT_WIN_MULTIPLIER = 100;
const THREE_DIGIT_WIN_MULTIPLIER = 600;

const getTodayDate = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
};

const createDefaultDateRange = () => {
  const today = getTodayDate();

  return [
    today,
    new Date(today.getTime())
  ];
};

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const printingPlayId = ref(null);

const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const mobileFiltersVisible = ref(false);

const isEditMode = ref(false);

const errorMessage = ref('');
const successMessage = ref('');

const selectedDeletePlay = ref(null);

const detailLoading = ref(false);
const selectedDetailPlay = ref(null);
const detailRows = ref([]);

const lotteryPlays = ref([]);
const categories = ref([]);
const products = ref([]);
const customers = ref([]);
const rates = ref([]);

const totalRecords = ref(0);
const page = ref(1);
const limit = ref(10);

const search = ref('');
const filterCategoryId = ref(null);
const filterProductId = ref(null);

const filterDateRange = ref(
  createDefaultDateRange()
);

const playForm = ref({
  id: null,
  title: '',
  categoryId: null,
  productId: null,
  customerId: null,
  playDate: new Date(),
  twoDigitRate: 100,
  threeDigitRate: 100
});

const playRows = ref([]);

const totalPages = computed(() => {
  return Math.max(
    Math.ceil(
      Number(totalRecords.value || 0) /
      Number(limit.value || 10)
    ),
    1
  );
});

const isSameLocalDate = (
  firstDate,
  secondDate
) => {
  if (!firstDate || !secondDate) {
    return false;
  }

  const first = new Date(firstDate);
  const second = new Date(secondDate);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const hasActiveFilters = computed(() => {
  const selectedRange = Array.isArray(
    filterDateRange.value
  )
    ? filterDateRange.value
    : [];

  const startDate = selectedRange[0] || null;
  const endDate = selectedRange[1] || null;
  const today = getTodayDate();

  const dateRangeChanged =
    !startDate ||
    !endDate ||
    !isSameLocalDate(startDate, today) ||
    !isSameLocalDate(endDate, today);

  return Boolean(
    search.value.trim() ||
    filterCategoryId.value ||
    filterProductId.value ||
    dateRangeChanged
  );
});

const makeLocalId = () => {
  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
};

const extractArrayData = (
  response,
  keys = []
) => {
  if (Array.isArray(response.data?.data)) {
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

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value.id || value._id || null;
  }

  return value;
};

const getProductCategoryId = (product) => {
  if (!product) {
    return null;
  }

  return (
    getId(product.category) ||
    getId(product.categoryId) ||
    getId(product.category_id) ||
    null
  );
};

const findProductById = (productId) => {
  if (!productId) {
    return null;
  }

  return products.value.find((product) => {
    return (
      String(product.id || product._id) ===
      String(productId)
    );
  });
};

const findCategoryById = (categoryId) => {
  if (!categoryId) {
    return null;
  }

  return categories.value.find((category) => {
    return (
      String(category.id || category._id) ===
      String(categoryId)
    );
  });
};

const findCustomerById = (customerId) => {
  if (!customerId) {
    return null;
  }

  return customers.value.find((customer) => {
    return (
      String(customer.id || customer._id) ===
      String(customerId)
    );
  });
};

const formatCustomerLabel = (customer) => {
  if (!customer) {
    return '-';
  }

  return customer.username || '-';
};

const formatRate = (value) => {
  const rate = Number(value || 0);

  if (rate <= 0) {
    return '';
  }

  return `${rate}%`;
};

const formatPlainNumber = (value) => {
  return Number(value || 0).toLocaleString(
    'en-US',
    {
      maximumFractionDigits: 2
    }
  );
};

const toPlayResultNumber = (value) => {
  return Math.trunc(
    Math.abs(Number(value || 0))
  );
};

const toSignedPlayResultNumber = (value) => {
  const result = Math.trunc(
    Number(value || 0)
  );

  return Object.is(result, -0)
    ? 0
    : result;
};

const formatPlayResult = (value) => {
  return toPlayResultNumber(value).toLocaleString(
    'en-US'
  );
};

const formatSignedPlayResult = (value) => {
  return toSignedPlayResultNumber(
    value
  ).toLocaleString('en-US');
};

const getGrandTotalColorClass = (value) => {
  return Number(value || 0) >= 0
    ? 'text-blue-600'
    : 'text-red-600';
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString(
    locale.value === 'km'
      ? 'km-KH'
      : 'en-GB'
  );
};

const formatDateOnly = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString(
    locale.value === 'km'
      ? 'km-KH'
      : 'en-GB'
  );
};

const formatDateForApi = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  const localDate = new Date(
    date.getTime() - timezoneOffset
  );

  return localDate.toISOString().slice(0, 10);
};

const parseDatePickerValue = (value) => {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
};

const formatNumberType = (value) => {
  const numberType = Number(value || 0);

  if (numberType <= 0) {
    return '';
  }

  return numberType;
};

const buildRateOptions = (
  allowedNumbers
) => {
  const optionMap = new Map();

  allowedNumbers.forEach((number) => {
    optionMap.set(Number(number), {
      label: `${Number(number)}%`,
      value: Number(number)
    });
  });

  rates.value.forEach((rate) => {
    const number = Number(rate.number);

    if (allowedNumbers.includes(number)) {
      optionMap.set(number, {
        label:
          rate.name ||
          `${number}%`,
        value: number
      });
    }
  });

  return allowedNumbers.map((number) => {
    return optionMap.get(Number(number));
  });
};

const twoDigitRateOptions = computed(() => {
  return buildRateOptions(
    TWO_DIGIT_RATE_NUMBERS
  );
});

const threeDigitRateOptions = computed(() => {
  return buildRateOptions(
    THREE_DIGIT_RATE_NUMBERS
  );
});

const categoryOptions = computed(() => {
  return categories.value.map(
    (category) => ({
      label: category.name,
      value:
        category.id ||
        category._id
    })
  );
});

const productOptions = computed(() => {
  return products.value.map((product) => {
    const productCategoryId =
      getProductCategoryId(product);

    const category =
      findCategoryById(
        productCategoryId
      );

    return {
      label: category?.name
        ? `${product.name} (${category.name})`
        : product.name,

      value:
        product.id ||
        product._id
    };
  });
});

const customerOptions = computed(() => {
  return customers.value.map(
    (customer) => ({
      label:
        formatCustomerLabel(customer),

      value:
        customer.id ||
        customer._id
    })
  );
});

const filterProductOptions = computed(() => {
  let list = products.value;

  if (filterCategoryId.value) {
    list = list.filter((product) => {
      return (
        String(
          getProductCategoryId(product)
        ) ===
        String(filterCategoryId.value)
      );
    });
  }

  return list.map((product) => ({
    label: product.name,
    value:
      product.id ||
      product._id
  }));
});

const createEmptyPlayRow = () => {
  return {
    localId: makeLocalId(),
    rowTitle: '',
    twoDigitNumber: null,
    threeDigitNumber: null,
    winTwoNumberType: null,
    winThreeNumberType: null,
    twoDigitAmount: null,
    threeDigitAmount: null,
    isTwoNumber: false,
    isThreeNumber: false
  };
};

const resetPlayForm = () => {
  playForm.value = {
    id: null,
    title: '',
    categoryId: null,
    productId: null,
    customerId: null,
    playDate: new Date(),
    twoDigitRate: 100,
    threeDigitRate: 100
  };

  playRows.value = [
    createEmptyPlayRow()
  ];
};

const getRatePercent = (value) => {
  const rate = Number(value || 0);

  return rate > 0
    ? rate
    : 100;
};

const calculateAmountWithRate = (
  amount,
  rate
) => {
  return (
    Number(amount || 0) *
    getRatePercent(rate)
  ) / 100;
};

const getPlayRows = (play) => {
  if (
    Array.isArray(play?.rows) &&
    play.rows.length > 0
  ) {
    return play.rows;
  }

  return [];
};

const getPlayCalculation = (
  rows = [],
  twoDigitRate = 100,
  threeDigitRate = 100
) => {
  let twoDigitBaseTotal = 0;
  let threeDigitBaseTotal = 0;

  let twoDigitCorrectTotal = 0;
  let threeDigitCorrectTotal = 0;

  rows.forEach((row) => {
    if (row.isTwoNumber) {
      twoDigitBaseTotal += Number(
        row.twoDigitNumber || 0
      );

      twoDigitCorrectTotal += Number(
        row.winTwoNumberType || 0
      );
    }

    if (row.isThreeNumber) {
      threeDigitBaseTotal += Number(
        row.threeDigitNumber || 0
      );

      threeDigitCorrectTotal += Number(
        row.winThreeNumberType || 0
      );
    }
  });

  const twoDigitGrandTotal =
    calculateAmountWithRate(
      twoDigitBaseTotal,
      twoDigitRate
    );

  const threeDigitGrandTotal =
    calculateAmountWithRate(
      threeDigitBaseTotal,
      threeDigitRate
    );

  const twoDigitCorrectDeduction =
    twoDigitCorrectTotal *
    TWO_DIGIT_WIN_MULTIPLIER;

  const threeDigitCorrectDeduction =
    threeDigitCorrectTotal *
    THREE_DIGIT_WIN_MULTIPLIER;

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
      threeDigitCorrectDeduction
  };
};

const getPlayResultCalculation = (
  calculation
) => {
  const twoDigitResult =
    toPlayResultNumber(
      calculation.twoDigitGrandTotal
    );

  const threeDigitResult =
    toPlayResultNumber(
      calculation.threeDigitGrandTotal
    );

  const twoDigitCorrectResult =
    toPlayResultNumber(
      calculation.twoDigitCorrectDeduction
    );

  const threeDigitCorrectResult =
    toPlayResultNumber(
      calculation.threeDigitCorrectDeduction
    );

  const playResultTotal =
    twoDigitResult +
    threeDigitResult;

  const correctDeductionTotal =
    twoDigitCorrectResult +
    threeDigitCorrectResult;

  return {
    twoDigitResult,
    threeDigitResult,

    twoDigitCorrectResult,
    threeDigitCorrectResult,

    playResultTotal,
    correctDeductionTotal,

    grandTotal:
      playResultTotal -
      correctDeductionTotal
  };
};

const formCalculation = computed(() => {
  return getPlayCalculation(
    playRows.value,
    playForm.value.twoDigitRate,
    playForm.value.threeDigitRate
  );
});

const formResultCalculation = computed(() => {
  return getPlayResultCalculation(
    formCalculation.value
  );
});

const detailCalculation = computed(() => {
  return getPlayCalculation(
    detailRows.value,

    selectedDetailPlay.value
      ?.twoDigitRate || 100,

    selectedDetailPlay.value
      ?.threeDigitRate || 100
  );
});

const detailResultCalculation = computed(() => {
  return getPlayResultCalculation(
    detailCalculation.value
  );
});

const detailDisplayRows = computed(() => {
  return detailRows.value.map(
    (row, index) => ({
      sourceIndex: index + 1,
      rowTitle: row.rowTitle,

      twoDigitNumber:
        row.isTwoNumber
          ? Number(
              row.twoDigitNumber || 0
            )
          : null,

      threeDigitNumber:
        row.isThreeNumber
          ? Number(
              row.threeDigitNumber || 0
            )
          : null,

      twoDigitType:
        row.isTwoNumber
          ? formatNumberType(
              row.winTwoNumberType
            )
          : '',

      threeDigitType:
        row.isThreeNumber
          ? formatNumberType(
              row.winThreeNumberType
            )
          : ''
    })
  );
});

const getCategoryName = (row) => {
  if (
    row?.categoryId &&
    typeof row.categoryId === 'object'
  ) {
    return row.categoryId.name || '-';
  }

  if (
    row?.category &&
    typeof row.category === 'object'
  ) {
    return row.category.name || '-';
  }

  const categoryId = getId(
    row?.categoryId ||
    row?.category
  );

  const category =
    findCategoryById(categoryId);

  return category?.name || '-';
};

const getProductName = (row) => {
  if (
    row?.productId &&
    typeof row.productId === 'object'
  ) {
    return row.productId.name || '-';
  }

  if (
    row?.product &&
    typeof row.product === 'object'
  ) {
    return row.product.name || '-';
  }

  const productId = getId(
    row?.productId ||
    row?.product
  );

  const product =
    findProductById(productId);

  return product?.name || '-';
};

const getCustomerName = (row) => {
  const customerValue =
    row?.customerId ||
    row?.customer;

  if (!customerValue) {
    return '-';
  }

  if (
    typeof customerValue === 'object'
  ) {
    return (
      customerValue.username ||
      '-'
    );
  }

  const customer =
    findCustomerById(customerValue);

  if (customer) {
    return customer.username || '-';
  }

  return String(customerValue);
};
/*
|--------------------------------------------------------------------------
| Invoice print helpers
|--------------------------------------------------------------------------
*/

const escapeHtml = (value) => {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const getPrintTotalColor = (value) => {
  return Number(value || 0) >= 0
    ? '#2563eb'
    : '#dc2626';
};

const buildPrintHtml = (play) => {
  const rows = getPlayRows(play);

  const calculation = getPlayCalculation(
    rows,
    play?.twoDigitRate || 100,
    play?.threeDigitRate || 100
  );

  const resultCalculation =
    getPlayResultCalculation(calculation);

  const printedRows = rows
    .map((row, index) => {
      const twoDigitNumber = row.isTwoNumber
        ? formatPlainNumber(row.twoDigitNumber)
        : '';

      const threeDigitNumber = row.isThreeNumber
        ? formatPlainNumber(row.threeDigitNumber)
        : '';

      const twoDigitType =
        row.isTwoNumber &&
        Number(row.winTwoNumberType || 0) > 0
          ? formatPlainNumber(
              row.winTwoNumberType
            )
          : '';

      const threeDigitType =
        row.isThreeNumber &&
        Number(row.winThreeNumberType || 0) > 0
          ? formatPlainNumber(
              row.winThreeNumberType
            )
          : '';

      return `
        <tr>
          <td class="center">
            (${index + 1})
          </td>

          <td class="row-title">
            ${escapeHtml(row.rowTitle || '')}
          </td>

          <td class="center">
            ${escapeHtml(twoDigitNumber)}
          </td>

          <td class="center">
            ${escapeHtml(threeDigitNumber)}
          </td>

          <td class="center">
            ${escapeHtml(twoDigitType)}
          </td>

          <td class="center">
            ${escapeHtml(threeDigitType)}
          </td>

          <td class="check-column">
            ✓
          </td>
        </tr>
      `;
    })
    .join('');

  const twoDigitCorrectLine =
    calculation.twoDigitCorrectTotal > 0
      ? `
        <div class="calculation-row deduction-row">
          <div class="calculation-name">
            ${escapeHtml(
              t('invoice.print.correctTwoDigit')
            )}
          </div>

          <div class="calculation-value">
            ${formatPlayResult(
              calculation.twoDigitCorrectTotal
            )}
            x ${TWO_DIGIT_WIN_MULTIPLIER}
            =
            -${formatPlayResult(
              resultCalculation.twoDigitCorrectResult
            )}
          </div>
        </div>
      `
      : '';

  const threeDigitCorrectLine =
    calculation.threeDigitCorrectTotal > 0
      ? `
        <div class="calculation-row deduction-row">
          <div class="calculation-name">
            ${escapeHtml(
              t('invoice.print.correctThreeDigit')
            )}
          </div>

          <div class="calculation-value">
            ${formatPlayResult(
              calculation.threeDigitCorrectTotal
            )}
            x ${THREE_DIGIT_WIN_MULTIPLIER}
            =
            -${formatPlayResult(
              resultCalculation.threeDigitCorrectResult
            )}
          </div>
        </div>
      `
      : '';

  const totalColor = getPrintTotalColor(
    resultCalculation.grandTotal
  );

  return `
    <!DOCTYPE html>

    <html lang="${locale.value === 'km' ? 'km' : 'en'}">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>&#8203;</title>

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            padding: 16px;
            color: #111827;
            font-family:
              "Inter",
              "Noto Sans Khmer",
              "Khmer OS Battambang",
              "Khmer OS Siemreap",
              Arial,
              sans-serif;
          }

          .invoice {
            width: 760px;
            max-width: 100%;
            margin: 0 auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 14px;
          }

          th,
          td {
            height: 36px;
            border: 1px solid #cbd5e1;
            padding: 5px 7px;
            vertical-align: middle;
          }

          th {
            text-align: center;
            font-weight: 800;
            background: #ffffff;
          }

          .number-column {
            width: 68px;
          }

          .row-title-column {
            width: 225px;
          }

          .value-column {
            width: 110px;
          }

          .correct-column {
            width: 100px;
          }

          .status-column {
            width: 50px;
          }

          .center {
            text-align: center;
          }

          .row-title {
            text-align: left;
            font-weight: 700;
          }

          .check-column {
            text-align: center;
            color: #22c55e;
            font-size: 18px;
            font-weight: 900;
          }

          .calculation-container {
            margin-top: 12px;
            font-size: 16px;
            font-weight: 700;
          }

          .calculation-row {
            display: grid;
            grid-template-columns: 105px 1fr;
            align-items: center;
            margin-bottom: 4px;
          }

          .calculation-name {
            text-align: left;
            font-weight: 800;
          }

          .calculation-value {
            text-align: left;
            font-weight: 800;
          }

          .deduction-row {
            color: #dc2626;
          }

          .divider {
            margin: 14px 0 10px;
            border-top: 1px solid #9ca3af;
          }

          .grand-total {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 22px;
            color: ${totalColor};
            font-size: 22px;
            font-weight: 900;
          }

          @media print {
            html,
            body {
              width: 100%;
              margin: 0;
              padding: 0;
            }

            body {
              padding: 0;
            }

            .invoice {
              width: 100%;
              max-width: 100%;
              margin: 0;
            }

            @page {
              size: auto;
              margin: 10mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="invoice">
          <table>
            <thead>
              <tr>
                <th class="number-column">
                  ${escapeHtml(
                    t('invoice.print.serial')
                  )}
                </th>

                <th class="row-title-column">
                  ${escapeHtml(
                    t('invoice.print.rowTitle')
                  )}
                </th>

                <th class="value-column">
                  ${escapeHtml(
                    t('invoice.print.twoDigit')
                  )}
                </th>

                <th class="value-column">
                  ${escapeHtml(
                    t('invoice.print.threeDigit')
                  )}
                </th>

                <th class="correct-column">
                  ${escapeHtml(
                    t('invoice.print.correctTwoDigit')
                  )}
                </th>

                <th class="correct-column">
                  ${escapeHtml(
                    t('invoice.print.correctThreeDigit')
                  )}
                </th>

                <th class="status-column"></th>
              </tr>
            </thead>

            <tbody>
              ${printedRows}
            </tbody>
          </table>

          <div class="calculation-container">
            <div class="calculation-row">
              <div class="calculation-name">
                ${escapeHtml(
                  t('invoice.print.twoDigit')
                )}
              </div>

              <div class="calculation-value">
                ${formatPlayResult(
                  calculation.twoDigitBaseTotal
                )}
                x${formatRate(
                  calculation.twoDigitRate
                )}
                =
                ${formatPlayResult(
                  resultCalculation.twoDigitResult
                )}
              </div>
            </div>

            <div class="calculation-row">
              <div class="calculation-name">
                ${escapeHtml(
                  t('invoice.print.threeDigit')
                )}
              </div>

              <div class="calculation-value">
                ${formatPlayResult(
                  calculation.threeDigitBaseTotal
                )}
                x${formatRate(
                  calculation.threeDigitRate
                )}
                =
                ${formatPlayResult(
                  resultCalculation.threeDigitResult
                )}
              </div>
            </div>

            ${twoDigitCorrectLine}

            ${threeDigitCorrectLine}

            <div class="divider"></div>

            <div class="grand-total">
              <span>
                ${escapeHtml(
                  t('invoice.print.total')
                )}:
              </span>

              <span>
                ${formatSignedPlayResult(
                  resultCalculation.grandTotal
                )}
              </span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const printLotteryPlay = async (play) => {
  errorMessage.value = '';

  if (!play) {
    errorMessage.value =
      t('invoice.errors.dataNotFound');

    return;
  }

  const playId =
    play?.id ||
    play?._id;

  const printWindow = window.open(
    '',
    '_blank',
    'width=900,height=750'
  );

  if (!printWindow) {
    errorMessage.value =
      t('invoice.errors.popupBlocked');

    return;
  }

  try {
    printingPlayId.value = playId;

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
            margin: 0;
            padding: 30px;
            font-family:
              Inter,
              Arial,
              sans-serif;
          "
        >
          ${escapeHtml(
            t('invoice.print.preparing')
          )}
        </body>
      </html>
    `);

    printWindow.document.close();

    let freshPlay = play;

    if (playId) {
      const response = await api.get(
        `/lottery-plays/${playId}`
      );

      freshPlay =
        response.data?.data ||
        play;
    }

    const html = buildPrintHtml(
      freshPlay
    );

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.document.title = '\u200B';
    printWindow.focus();

    const startPrint = () => {
      printWindow.document.title = '\u200B';

      setTimeout(() => {
        printWindow.print();
      }, 300);
    };

    if (
      printWindow.document.readyState ===
      'complete'
    ) {
      startPrint();
    } else {
      printWindow.onload = startPrint;
    }
  } catch (error) {
    console.error(
      'Print invoice error:',
      error
    );

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
            margin: 0;
            padding: 30px;
            font-family:
              Inter,
              Arial,
              sans-serif;
            color: #dc2626;
          "
        >
          ${escapeHtml(
            t('invoice.print.prepareError')
          )}
        </body>
      </html>
    `);

    printWindow.document.close();

    errorMessage.value =
      error.response?.data?.message ||
      t('invoice.errors.print');
  } finally {
    printingPlayId.value = null;
  }
};

const fetchCategories = async () => {
  const response = await api.get(
    '/categories',
    {
      params: {
        page: 1,
        limit: 100,
        status: true
      }
    }
  );

  categories.value =
    extractArrayData(
      response,
      [
        'categories',
        'items',
        'results'
      ]
    );
};

const fetchProducts = async () => {
  const response = await api.get(
    '/products',
    {
      params: {
        page: 1,
        limit: 100,
        status: true
      }
    }
  );

  products.value =
    extractArrayData(
      response,
      [
        'products',
        'items',
        'results'
      ]
    );
};

const fetchCustomers = async () => {
  try {
    const response = await api.get(
      '/customers',
      {
        params: {
          page: 1,
          limit: 500,
          status: true
        }
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
  } catch (error) {
    console.warn(
      'Fetch customers warning:',
      error
    );

    customers.value = [];
  }
};

const fetchRates = async () => {
  try {
    const response = await api.get(
      '/rates',
      {
        params: {
          page: 1,
          limit: 100,
          status: true
        }
      }
    );

    rates.value =
      extractArrayData(
        response,
        [
          'rates',
          'items',
          'results'
        ]
      );
  } catch (error) {
    console.warn(
      'Fetch rates warning:',
      error
    );

    rates.value = [];
  }
};

const fetchLotteryPlays = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const selectedRange = Array.isArray(
      filterDateRange.value
    )
      ? filterDateRange.value
      : [];

    const startDate = selectedRange[0] || null;
    const endDate =
      selectedRange[1] ||
      selectedRange[0] ||
      null;

    const params = {
      page: page.value,
      limit: limit.value
    };

    if (startDate) {
      params.dateFrom =
        formatDateForApi(startDate);
    }

    if (endDate) {
      params.dateTo =
        formatDateForApi(endDate);
    }

    if (search.value.trim()) {
      params.search =
        search.value.trim();
    }

    if (filterCategoryId.value) {
      params.categoryId =
        filterCategoryId.value;
    }

    if (filterProductId.value) {
      params.productId =
        filterProductId.value;
    }

    const response = await api.get(
      '/lottery-plays',
      {
        params
      }
    );

    lotteryPlays.value =
      extractArrayData(
        response,
        [
          'lotteryPlays',
          'plays',
          'items',
          'results'
        ]
      );

    totalRecords.value =
      response.data?.pagination?.total ??
      response.data?.data?.pagination
        ?.total ??
      lotteryPlays.value.length;
  } catch (error) {
    console.error(
      'Fetch invoices error:',
      error
    );

    lotteryPlays.value = [];

    errorMessage.value =
      error.response?.data?.message ||
      t('invoice.errors.fetch');
  } finally {
    loading.value = false;
  }
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  limit.value = event.rows;

  fetchLotteryPlays();
};

const goToPreviousPage = () => {
  if (
    loading.value ||
    page.value <= 1
  ) {
    return;
  }

  page.value -= 1;

  fetchLotteryPlays();
};

const goToNextPage = () => {
  if (
    loading.value ||
    page.value >= totalPages.value
  ) {
    return;
  }

  page.value += 1;

  fetchLotteryPlays();
};

const applyFilter = () => {
  page.value = 1;
  mobileFiltersVisible.value = false;

  fetchLotteryPlays();
};

const clearFilter = () => {
  search.value = '';
  filterCategoryId.value = null;
  filterProductId.value = null;
  filterDateRange.value =
    createDefaultDateRange();

  page.value = 1;
  mobileFiltersVisible.value = false;

  fetchLotteryPlays();
};

const onFilterCategoryChange = () => {
  filterProductId.value = null;
};

const onProductChange = () => {
  if (!playForm.value.productId) {
    return;
  }

  const selectedProduct =
    findProductById(
      playForm.value.productId
    );

  if (!selectedProduct) {
    return;
  }

  const productCategoryId =
    getProductCategoryId(
      selectedProduct
    );

  if (productCategoryId) {
    playForm.value.categoryId =
      productCategoryId;
  }
};

const addPlayRow = () => {
  errorMessage.value = '';

  playRows.value.push(
    createEmptyPlayRow()
  );
};

const removePlayRow = (index) => {
  if (playRows.value.length === 1) {
    errorMessage.value =
      t('invoice.errors.atLeastOneRow');

    return;
  }

  playRows.value.splice(index, 1);
};

const duplicatePlayRow = (index) => {
  const row = playRows.value[index];

  playRows.value.splice(
    index + 1,
    0,
    {
      ...row,
      localId: makeLocalId(),

      rowTitle: row.rowTitle
        ? `${row.rowTitle} ${t(
            'invoice.copySuffix'
          )}`
        : ''
    }
  );
};

const openCreateDialog = () => {
  errorMessage.value = '';
  successMessage.value = '';

  resetPlayForm();

  isEditMode.value = false;
  dialogVisible.value = true;
};

const openEditDialog = (play) => {
  errorMessage.value = '';
  successMessage.value = '';

  playForm.value = {
    id:
      play.id ||
      play._id,

    title:
      play.title || '',

    categoryId: getId(
      play.categoryId ||
      play.category
    ),

    productId: getId(
      play.productId ||
      play.product
    ),

    customerId: getId(
      play.customerId ||
      play.customer
    ),

    playDate:
      parseDatePickerValue(
        play.playDate ||
        play.createdAt
      ),

    twoDigitRate:
      getRatePercent(
        play.twoDigitRate || 100
      ),

    threeDigitRate:
      getRatePercent(
        play.threeDigitRate || 100
      )
  };

  playRows.value =
    getPlayRows(play).map(
      (row) => ({
        localId: makeLocalId(),

        rowTitle:
          row.rowTitle ||
          row.title ||
          '',

        twoDigitNumber:
          row.twoDigitNumber,

        threeDigitNumber:
          row.threeDigitNumber,

        winTwoNumberType:
          row.winTwoNumberType ||
          null,

        winThreeNumberType:
          row.winThreeNumberType ||
          null,

        twoDigitAmount:
          row.twoDigitAmount ||
          null,

        threeDigitAmount:
          row.threeDigitAmount ||
          null,

        isTwoNumber:
          Boolean(
            row.isTwoNumber
          ),

        isThreeNumber:
          Boolean(
            row.isThreeNumber
          )
      })
    );

  if (!playRows.value.length) {
    playRows.value = [
      createEmptyPlayRow()
    ];
  }

  isEditMode.value = true;
  dialogVisible.value = true;
};

const openDetailDialog = async (play) => {
  try {
    detailDialogVisible.value = true;
    detailLoading.value = true;

    selectedDetailPlay.value = play;
    detailRows.value =
      getPlayRows(play);

    const playId =
      play.id ||
      play._id;

    if (!playId) {
      return;
    }

    const response = await api.get(
      `/lottery-plays/${playId}`
    );

    const freshPlay =
      response.data?.data ||
      play;

    selectedDetailPlay.value =
      freshPlay;

    detailRows.value =
      getPlayRows(freshPlay);
  } catch (error) {
    console.error(
      'Fetch invoice detail error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      t('invoice.errors.detail');
  } finally {
    detailLoading.value = false;
  }
};

const validatePlayForm = () => {
  if (
    !playForm.value.title ||
    !playForm.value.title.trim()
  ) {
    return t('invoice.errors.titleRequired');
  }

  if (!playForm.value.categoryId) {
    return t('invoice.errors.categoryRequired');
  }

  if (!playForm.value.productId) {
    return t('invoice.errors.productRequired');
  }

  if (!playForm.value.customerId) {
    return t('invoice.errors.customerRequired');
  }

  if (!playForm.value.playDate) {
    return t('invoice.errors.dateRequired');
  }

  if (
    !TWO_DIGIT_RATE_NUMBERS.includes(
      Number(
        playForm.value.twoDigitRate
      )
    )
  ) {
    return t('invoice.errors.invalidTwoDigitRate');
  }

  if (
    !THREE_DIGIT_RATE_NUMBERS.includes(
      Number(
        playForm.value.threeDigitRate
      )
    )
  ) {
    return t('invoice.errors.invalidThreeDigitRate');
  }

  const selectedProduct =
    findProductById(
      playForm.value.productId
    );

  if (!selectedProduct) {
    return t('invoice.errors.selectedProductInvalid');
  }

  const productCategoryId =
    getProductCategoryId(
      selectedProduct
    );

  if (
    productCategoryId &&
    String(productCategoryId) !==
      String(
        playForm.value.categoryId
      )
  ) {
    playForm.value.categoryId =
      productCategoryId;
  }

  if (!playRows.value.length) {
    return t('invoice.errors.atLeastOneRow');
  }

  for (
    let index = 0;
    index < playRows.value.length;
    index += 1
  ) {
    const row =
      playRows.value[index];

    const rowNumber = index + 1;

    if (
      !row.rowTitle ||
      !row.rowTitle.trim()
    ) {
      return t(
        'invoice.errors.rowNameRequired',
        {
          row: rowNumber
        }
      );
    }

    if (row.isTwoNumber) {
      if (
        row.twoDigitNumber === null ||
        row.twoDigitNumber ===
          undefined
      ) {
        return t(
          'invoice.errors.twoDigitRequired',
          {
            row: rowNumber
          }
        );
      }

      if (
        Number(
          row.twoDigitNumber
        ) < 0 ||
        Number(
          row.twoDigitNumber
        ) > 99
      ) {
        return t(
          'invoice.errors.twoDigitRange',
          {
            row: rowNumber
          }
        );
      }

      if (
        Number(
          row.twoDigitAmount || 0
        ) < 0
      ) {
        return t(
          'invoice.errors.twoDigitAmountNegative',
          {
            row: rowNumber
          }
        );
      }

      if (
        Number(
          row.winTwoNumberType || 0
        ) < 0
      ) {
        return t(
          'invoice.errors.twoDigitTypeNegative',
          {
            row: rowNumber
          }
        );
      }
    }

    if (row.isThreeNumber) {
      if (
        row.threeDigitNumber ===
          null ||
        row.threeDigitNumber ===
          undefined
      ) {
        return t(
          'invoice.errors.threeDigitRequired',
          {
            row: rowNumber
          }
        );
      }

      if (
        Number(
          row.threeDigitNumber
        ) < 0 ||
        Number(
          row.threeDigitNumber
        ) > 999
      ) {
        return t(
          'invoice.errors.threeDigitRange',
          {
            row: rowNumber
          }
        );
      }

      if (
        Number(
          row.threeDigitAmount || 0
        ) < 0
      ) {
        return t(
          'invoice.errors.threeDigitAmountNegative',
          {
            row: rowNumber
          }
        );
      }

      if (
        Number(
          row.winThreeNumberType || 0
        ) < 0
      ) {
        return t(
          'invoice.errors.threeDigitTypeNegative',
          {
            row: rowNumber
          }
        );
      }
    }
  }

  return '';
};

const buildPayload = () => {
  return {
    title:
      playForm.value.title.trim(),

    categoryId:
      playForm.value.categoryId,

    productId:
      playForm.value.productId,

    customerId:
      playForm.value.customerId,

    playDate: formatDateForApi(
      playForm.value.playDate
    ),

    twoDigitRate: Number(
      playForm.value.twoDigitRate ||
      100
    ),

    threeDigitRate: Number(
      playForm.value.threeDigitRate ||
      100
    ),

    rows: playRows.value.map(
      (row) => ({
        rowTitle:
          row.rowTitle.trim(),

        twoDigitNumber:
          row.isTwoNumber
            ? Number(
                row.twoDigitNumber
              )
            : null,

        threeDigitNumber:
          row.isThreeNumber
            ? Number(
                row.threeDigitNumber
              )
            : null,

        winTwoNumberType:
          row.isTwoNumber
            ? Number(
                row.winTwoNumberType ||
                0
              )
            : 0,

        winThreeNumberType:
          row.isThreeNumber
            ? Number(
                row.winThreeNumberType ||
                0
              )
            : 0,

        twoDigitAmount:
          row.isTwoNumber
            ? Number(
                row.twoDigitAmount ||
                0
              )
            : 0,

        threeDigitAmount:
          row.isThreeNumber
            ? Number(
                row.threeDigitAmount ||
                0
              )
            : 0,

        isTwoNumber:
          Boolean(
            row.isTwoNumber
          ),

        isThreeNumber:
          Boolean(
            row.isThreeNumber
          ),

        checkedStatus: false
      })
    )
  };
};

const saveLotteryPlay = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';

    const validationError =
      validatePlayForm();

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
        `/lottery-plays/${playForm.value.id}`,
        payload
      );

      successMessage.value =
        t('invoice.messages.updated');
    } else {
      await api.post(
        '/lottery-plays',
        payload
      );

      successMessage.value =
        t('invoice.messages.created');
    }

    dialogVisible.value = false;

    await fetchLotteryPlays();
  } catch (error) {
    console.error(
      'Save invoice error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      t('invoice.errors.save');
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (play) => {
  errorMessage.value = '';
  successMessage.value = '';

  selectedDeletePlay.value = play;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  if (deleting.value) {
    return;
  }

  deleteDialogVisible.value = false;
  selectedDeletePlay.value = null;
};

const confirmDeleteLotteryPlay = async () => {
  if (!selectedDeletePlay.value) {
    return;
  }

  try {
    deleting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const playId =
      selectedDeletePlay.value.id ||
      selectedDeletePlay.value._id;

    await api.delete(
      `/lottery-plays/${playId}`
    );

    successMessage.value =
      t('invoice.messages.deleted');

    deleteDialogVisible.value = false;
    selectedDeletePlay.value = null;

    if (
      lotteryPlays.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1;
    }

    await fetchLotteryPlays();
  } catch (error) {
    console.error(
      'Delete invoice error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      t('invoice.errors.delete');
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.all([
      fetchCategories(),
      fetchProducts(),
      fetchCustomers(),
      fetchRates()
    ]);
  } catch (error) {
    console.error(
      'Initial reference data load error:',
      error
    );
  }

  await fetchLotteryPlays();
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl p-2 sm:p-4 lg:p-6">
    <Card class="overflow-hidden">
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
            >
              <i class="pi pi-file"></i>
            </div>

            <h1 class="truncate text-xl font-bold sm:text-2xl">
              {{ t('invoice.title') }}
            </h1>
          </div>

          <Button
            :label="t('invoice.addInvoice')"
            icon="pi pi-plus"
            size="small"
            class="shrink-0"
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

        <!-- Mobile search and filters -->
        <section class="mb-4 md:hidden">
          <div class="flex gap-2">
            <InputText
              v-model="search"
              :placeholder="t('invoice.searchInvoices')"
              class="min-w-0 flex-1"
              @keyup.enter="applyFilter"
            />

            <Button
              icon="pi pi-search"
              :aria-label="t('invoice.search')"
              @click="applyFilter"
            />

            <Button
              icon="pi pi-filter"
              severity="secondary"
              outlined
              :aria-label="t('invoice.showFilters')"
              :class="{
                'border-primary text-primary': hasActiveFilters
              }"
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
              class="w-full"
              showClear
              filter
            />

            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-600">
                {{ t('invoice.invoiceDateRange') }}
              </label>

              <DatePicker
                v-model="filterDateRange"
                selectionMode="range"
                dateFormat="yy-mm-dd"
                :placeholder="t('invoice.selectDateRange')"
                class="w-full"
                input-class="w-full"
                showIcon
                iconDisplay="input"
                showButtonBar
                fluid
                :manualInput="false"
                :numberOfMonths="1"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <Button
                :label="t('invoice.reset')"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                @click="clearFilter"
              />

              <Button
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
            class="w-full"
            showClear
            filter
          />

          <DatePicker
            v-model="filterDateRange"
            selectionMode="range"
            dateFormat="yy-mm-dd"
            :placeholder="t('invoice.invoiceDateRange')"
            class="w-full"
            input-class="w-full"
            showIcon
            iconDisplay="input"
            showButtonBar
            fluid
            :manualInput="false"
            :numberOfMonths="1"
          />

          <div class="flex gap-2">
            <Button
              :label="t('invoice.search')"
              icon="pi pi-search"
              class="flex-1"
              @click="applyFilter"
            />

            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :aria-label="t('invoice.resetFilters')"
              @click="clearFilter"
            />
          </div>
        </section>

        <!-- Mobile list -->
        <section class="md:hidden">
          <div v-if="loading" class="py-12 text-center">
            <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
            <p class="mt-2 text-sm text-gray-500">
              {{ t('invoice.loadingInvoices') }}
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
                    {{ invoice.title || '-' }}
                  </h2>

                  <div class="mt-1 text-xs text-gray-500">
                    {{
                      formatDateOnly(
                        invoice.playDate || invoice.createdAt
                      )
                    }}
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
                    {{ t('invoice.fields.customer') }}
                  </div>
                  <div class="mt-1 truncate font-semibold">
                    {{ getCustomerName(invoice) }}
                  </div>
                </div>

                <div class="min-w-0 rounded-lg bg-gray-50 p-2">
                  <div class="text-xs text-gray-500">
                    {{ t('invoice.fields.product') }}
                  </div>
                  <div class="mt-1 truncate font-semibold">
                    {{ getProductName(invoice) }}
                  </div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <Button
                  :label="t('invoice.view')"
                  icon="pi pi-eye"
                  severity="help"
                  outlined
                  class="w-full"
                  @click="openDetailDialog(invoice)"
                />

                <Button
                  :label="t('invoice.printButton')"
                  icon="pi pi-print"
                  severity="secondary"
                  outlined
                  class="w-full"
                  :loading="
                    printingPlayId === (invoice.id || invoice._id)
                  "
                  @click="printLotteryPlay(invoice)"
                />

                <Button
                  :label="t('invoice.edit')"
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  class="w-full"
                  @click="openEditDialog(invoice)"
                />

                <Button
                  :label="t('invoice.delete')"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  class="w-full"
                  @click="openDeleteDialog(invoice)"
                />
              </div>
            </article>

            <div
              v-if="!lotteryPlays.length"
              class="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500"
            >
              {{ t('invoice.noInvoices') }}
            </div>

            <div
              v-if="totalRecords > 0"
              class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-2"
            >
              <Button
                icon="pi pi-chevron-left"
                severity="secondary"
                text
                rounded
                :aria-label="t('invoice.previousPage')"
                :disabled="page <= 1 || loading"
                @click="goToPreviousPage"
              />

              <span class="text-sm font-medium text-gray-600">
                {{
                  t('invoice.pageOf', {
                    page,
                    total: totalPages
                  })
                }}
              </span>

              <Button
                icon="pi pi-chevron-right"
                severity="secondary"
                text
                rounded
                :aria-label="t('invoice.nextPage')"
                :disabled="page >= totalPages || loading"
                @click="goToNextPage"
              />
            </div>
          </div>
        </section>

        <!-- Desktop table -->
        <section class="hidden md:block">
          <DataTable
            :value="lotteryPlays"
            :loading="loading"
            lazy
            paginator
            scrollable
            dataKey="id"
            :rows="limit"
            :first="(page - 1) * limit"
            :totalRecords="totalRecords"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 1080px"
            @page="onPageChange"
          >
            <Column :header="t('invoice.columns.invoiceName')" style="min-width: 210px">
              <template #body="{ data }">
                <div class="font-semibold">{{ data.title || '-' }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(data.createdAt) }}
                </div>
              </template>
            </Column>

            <Column :header="t('invoice.columns.category')" style="min-width: 150px">
              <template #body="{ data }">
                {{ getCategoryName(data) }}
              </template>
            </Column>

            <Column :header="t('invoice.columns.product')" style="min-width: 150px">
              <template #body="{ data }">
                {{ getProductName(data) }}
              </template>
            </Column>

            <Column :header="t('invoice.columns.customer')" style="min-width: 180px">
              <template #body="{ data }">
                {{ getCustomerName(data) }}
              </template>
            </Column>

            <Column :header="t('invoice.columns.invoiceDate')" style="min-width: 130px">
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
                    icon="pi pi-eye"
                    size="small"
                    severity="help"
                    :title="t('invoice.view')"
                    @click="openDetailDialog(data)"
                  />

                  <Button
                    icon="pi pi-print"
                    size="small"
                    severity="secondary"
                    :title="t('invoice.printButton')"
                    :loading="
                      printingPlayId === (data.id || data._id)
                    "
                    @click="printLotteryPlay(data)"
                  />

                  <Button
                    icon="pi pi-pencil"
                    size="small"
                    severity="info"
                    :title="t('invoice.edit')"
                    @click="openEditDialog(data)"
                  />

                  <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    :title="t('invoice.delete')"
                    @click="openDeleteDialog(data)"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="py-8 text-center text-gray-500">
                {{ t('invoice.noInvoices') }}
              </div>
            </template>
          </DataTable>
        </section>
      </template>
    </Card>

    <!-- Create / edit invoice -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="
        isEditMode
          ? t('invoice.dialogs.editTitle')
          : t('invoice.dialogs.createTitle')
      "
      :style="{
        width: '96vw',
        maxWidth: '1180px'
      }"
      :breakpoints="{
        '960px': '98vw',
        '640px': '100vw'
      }"
      :closable="!saving"
      :draggable="false"
      :dismissableMask="false"
      :blockScroll="true"
      class="invoice-form-dialog"
    >
      <div class="invoice-form-content space-y-4">
        <Message
          v-if="errorMessage"
          severity="error"
          closable
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </Message>

        <!-- Invoice information -->
        <section class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <h2 class="mb-3 text-base font-bold text-gray-900">
            {{ t('invoice.sections.information') }}
          </h2>

          <div
            class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <div class="sm:col-span-2 lg:col-span-2">
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.invoiceName') }}
              </label>

              <InputText
                v-model="playForm.title"
                class="w-full"
                :placeholder="t('invoice.placeholders.invoiceName')"
                autocomplete="off"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.invoiceDate') }}
              </label>

              <DatePicker
                v-model="playForm.playDate"
                class="w-full"
                input-class="w-full"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                fluid
                :manualInput="false"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.customer') }}
              </label>

              <Select
                v-model="playForm.customerId"
                :options="customerOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.customer')"
                class="w-full"
                showClear
                filter
                :filterPlaceholder="t('invoice.placeholders.searchCustomer')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.category') }}
              </label>

              <Select
                v-model="playForm.categoryId"
                :options="categoryOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.category')"
                class="w-full"
                showClear
              />
            </div>

            <div class="sm:col-span-2 lg:col-span-1">
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.product') }}
              </label>

              <Select
                v-model="playForm.productId"
                :options="productOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.product')"
                class="w-full"
                showClear
                filter
                :filterPlaceholder="t('invoice.placeholders.searchProduct')"
                @change="onProductChange"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.twoDigitRate') }}
              </label>

              <Select
                v-model="playForm.twoDigitRate"
                :options="twoDigitRateOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.twoDigitRate')"
                class="w-full"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-gray-700">
                {{ t('invoice.fields.threeDigitRate') }}
              </label>

              <Select
                v-model="playForm.threeDigitRate"
                :options="threeDigitRateOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('invoice.placeholders.threeDigitRate')"
                class="w-full"
              />
            </div>
          </div>
        </section>

        <!-- Invoice rows -->
        <section>
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-gray-900">
                {{ t('invoice.sections.rows') }}
              </h2>
              <p class="text-xs text-gray-500">
                {{ t('invoice.rowsHint') }}
              </p>
            </div>

            <Button
              :label="t('invoice.addRow')"
              icon="pi pi-plus"
              size="small"
              class="shrink-0"
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

                  <span class="font-bold text-gray-900">
                    {{ t('invoice.invoiceRow') }}
                  </span>
                </div>

                <div class="flex gap-2">
                  <Button
                    icon="pi pi-copy"
                    size="small"
                    severity="secondary"
                    outlined
                    rounded
                    :aria-label="t('invoice.duplicateRow')"
                    :title="t('invoice.duplicateRow')"
                    @click="duplicatePlayRow(index)"
                  />

                  <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    outlined
                    rounded
                    :aria-label="t('invoice.removeRow')"
                    :title="t('invoice.removeRow')"
                    @click="removePlayRow(index)"
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="mb-1 block text-sm font-semibold text-gray-700">
                  {{ t('invoice.fields.rowName') }}
                </label>

                <InputText
                  v-model="row.rowTitle"
                  class="w-full"
                  :placeholder="t('invoice.placeholders.rowName')"
                  autocomplete="off"
                />
              </div>

              <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <!-- 2D card -->
                <section
                  :class="[
                    'rounded-xl border p-3 transition sm:p-4',
                    row.isTwoNumber
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-200 bg-gray-50'
                  ]"
                >
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-gray-900">2D</div>
                      <div class="text-xs text-gray-500">
                        {{ t('invoice.enableTwoDigit') }}
                      </div>
                    </div>

                    <ToggleSwitch v-model="row.isTwoNumber" />
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label class="mb-1 block text-xs font-semibold text-gray-600">
                        {{ t('invoice.fields.twoDigitNumber') }}
                      </label>

                      <InputNumber
                        v-model="row.twoDigitNumber"
                        class="w-full"
                        input-class="w-full"
                        placeholder="0 - 99"
                        :min="0"
                        :max="99"
                        :disabled="!row.isTwoNumber"
                        :useGrouping="false"
                        :inputProps="{
                          inputmode: 'numeric'
                        }"
                      />
                    </div>

                    <div>
                      <label class="mb-1 block text-xs font-semibold text-gray-600">
                        {{ t('invoice.fields.twoDigitAmount') }}
                      </label>

                      <InputNumber
                        v-model="row.twoDigitAmount"
                        class="w-full"
                        input-class="w-full"
                        :placeholder="t('invoice.placeholders.amount')"
                        :min="0"
                        :disabled="!row.isTwoNumber"
                        :inputProps="{
                          inputmode: 'decimal'
                        }"
                      />
                    </div>

                    <div>
                      <label class="mb-1 block text-xs font-semibold text-gray-600">
                        {{ t('invoice.fields.correctTwoDigit') }}
                      </label>

                      <InputNumber
                        v-model="row.winTwoNumberType"
                        class="w-full"
                        input-class="w-full"
                        :placeholder="t('invoice.placeholders.type')"
                        :min="0"
                        :disabled="!row.isTwoNumber"
                        :useGrouping="false"
                        :inputProps="{
                          inputmode: 'numeric'
                        }"
                      />
                    </div>
                  </div>
                </section>

                <!-- 3D card -->
                <section
                  :class="[
                    'rounded-xl border p-3 transition sm:p-4',
                    row.isThreeNumber
                      ? 'border-violet-300 bg-violet-50/50'
                      : 'border-gray-200 bg-gray-50'
                  ]"
                >
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-gray-900">3D</div>
                      <div class="text-xs text-gray-500">
                        {{ t('invoice.enableThreeDigit') }}
                      </div>
                    </div>

                    <ToggleSwitch v-model="row.isThreeNumber" />
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label class="mb-1 block text-xs font-semibold text-gray-600">
                        {{ t('invoice.fields.threeDigitNumber') }}
                      </label>

                      <InputNumber
                        v-model="row.threeDigitNumber"
                        class="w-full"
                        input-class="w-full"
                        placeholder="0 - 999"
                        :min="0"
                        :max="999"
                        :disabled="!row.isThreeNumber"
                        :useGrouping="false"
                        :inputProps="{
                          inputmode: 'numeric'
                        }"
                      />
                    </div>

                    <div>
                      <label class="mb-1 block text-xs font-semibold text-gray-600">
                        {{ t('invoice.fields.threeDigitAmount') }}
                      </label>

                      <InputNumber
                        v-model="row.threeDigitAmount"
                        class="w-full"
                        input-class="w-full"
                        :placeholder="t('invoice.placeholders.amount')"
                        :min="0"
                        :disabled="!row.isThreeNumber"
                        :inputProps="{
                          inputmode: 'decimal'
                        }"
                      />
                    </div>

                    <div>
                      <label class="mb-1 block text-xs font-semibold text-gray-600">
                        {{ t('invoice.fields.correctThreeDigit') }}
                      </label>

                      <InputNumber
                        v-model="row.winThreeNumberType"
                        class="w-full"
                        input-class="w-full"
                        :placeholder="t('invoice.placeholders.type')"
                        :min="0"
                        :disabled="!row.isThreeNumber"
                        :useGrouping="false"
                        :inputProps="{
                          inputmode: 'numeric'
                        }"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </article>
          </div>
        </section>

        <!-- Total -->
        <section
          class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center sm:flex sm:items-center sm:justify-between sm:text-left"
        >
          <div>
            <div class="text-sm font-medium text-gray-500">
              {{ t('invoice.fields.grandTotal') }}
            </div>
            <div class="text-xs text-gray-400">
              {{ t('invoice.calculatedAutomatically') }}
            </div>
          </div>

          <div
            class="mt-2 text-3xl font-extrabold sm:mt-0"
            :class="
              getGrandTotalColorClass(
                formResultCalculation.grandTotal
              )
            "
          >
            {{
              formatSignedPlayResult(
                formResultCalculation.grandTotal
              )
            }}
          </div>
        </section>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            :label="t('invoice.cancel')"
            severity="secondary"
            outlined
            :disabled="saving"
            @click="dialogVisible = false"
          />

          <Button
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

    <!-- Invoice details -->
    <Dialog
      v-model:visible="detailDialogVisible"
      modal
      :header="
        selectedDetailPlay?.title ||
        t('invoice.dialogs.detailsTitle')
      "
      :style="{
        width: '96vw',
        maxWidth: '760px'
      }"
      :breakpoints="{
        '640px': '100vw'
      }"
      :draggable="false"
      :blockScroll="true"
      class="invoice-detail-dialog"
    >
      <div class="space-y-4">
        <Message v-if="detailLoading" severity="info">
          {{ t('invoice.loadingInvoice') }}
        </Message>

        <div
          v-if="selectedDetailPlay"
          class="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-sm"
        >
          <div class="min-w-0">
            <div class="text-xs text-gray-500">
              {{ t('invoice.fields.customer') }}
            </div>
            <div class="mt-1 truncate font-semibold">
              {{ getCustomerName(selectedDetailPlay) }}
            </div>
          </div>

          <div class="min-w-0">
            <div class="text-xs text-gray-500">
              {{ t('invoice.fields.date') }}
            </div>
            <div class="mt-1 font-semibold">
              {{
                formatDateOnly(
                  selectedDetailPlay.playDate ||
                    selectedDetailPlay.createdAt
                )
              }}
            </div>
          </div>

          <div class="min-w-0">
            <div class="text-xs text-gray-500">
              {{ t('invoice.fields.category') }}
            </div>
            <div class="mt-1 truncate font-semibold">
              {{ getCategoryName(selectedDetailPlay) }}
            </div>
          </div>

          <div class="min-w-0">
            <div class="text-xs text-gray-500">
              {{ t('invoice.fields.product') }}
            </div>
            <div class="mt-1 truncate font-semibold">
              {{ getProductName(selectedDetailPlay) }}
            </div>
          </div>
        </div>

        <!-- Mobile detail rows -->
        <div class="space-y-2 sm:hidden">
          <article
            v-for="row in detailDisplayRows"
            :key="row.sourceIndex"
            class="rounded-xl border border-gray-200 p-3"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-sm text-gray-500">
                {{ t('invoice.rowNumber', { number: row.sourceIndex }) }}
              </span>
              <span class="truncate font-semibold">{{ row.rowTitle }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">2D</div>
                <div class="mt-1 text-lg font-bold">
                  {{
                    row.twoDigitNumber !== null
                      ? formatPlainNumber(row.twoDigitNumber)
                      : '-'
                  }}
                </div>
              </div>

              <div class="rounded-lg bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">3D</div>
                <div class="mt-1 text-lg font-bold">
                  {{
                    row.threeDigitNumber !== null
                      ? formatPlainNumber(row.threeDigitNumber)
                      : '-'
                  }}
                </div>
              </div>

              <div class="rounded-lg bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">
                  {{ t('invoice.fields.correctTwoDigit') }}
                </div>
                <div class="mt-1 font-semibold">
                  {{ row.twoDigitType || '-' }}
                </div>
              </div>

              <div class="rounded-lg bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">
                  {{ t('invoice.fields.correctThreeDigit') }}
                </div>
                <div class="mt-1 font-semibold">
                  {{ row.threeDigitType || '-' }}
                </div>
              </div>
            </div>
          </article>

          <div
            v-if="!detailDisplayRows.length"
            class="rounded-xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500"
          >
            {{ t('invoice.noRows') }}
          </div>
        </div>

        <!-- Desktop detail rows -->
        <div
          class="hidden overflow-x-auto rounded-xl border border-gray-200 sm:block"
        >
          <table class="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr class="text-center font-bold">
                <th class="border-b border-gray-200 px-3 py-2">
                  {{ t('invoice.columns.number') }}
                </th>
                <th class="border-b border-gray-200 px-3 py-2">
                  {{ t('invoice.print.rowTitle') }}
                </th>
                <th class="border-b border-gray-200 px-3 py-2">
                  {{ t('invoice.print.twoDigit') }}
                </th>
                <th class="border-b border-gray-200 px-3 py-2">
                  {{ t('invoice.print.threeDigit') }}
                </th>
                <th class="border-b border-gray-200 px-3 py-2">
                  {{ t('invoice.print.correctTwoDigit') }}
                </th>
                <th class="border-b border-gray-200 px-3 py-2">
                  {{ t('invoice.print.correctThreeDigit') }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="row in detailDisplayRows"
                :key="row.sourceIndex"
                class="border-b border-gray-200 text-center last:border-b-0"
              >
                <td class="px-3 py-2 font-medium">({{ row.sourceIndex }})</td>
                <td class="px-3 py-2 font-medium">{{ row.rowTitle }}</td>
                <td class="px-3 py-2 font-semibold">
                  <span v-if="row.twoDigitNumber !== null">
                    {{ formatPlainNumber(row.twoDigitNumber) }}
                  </span>
                </td>
                <td class="px-3 py-2 font-semibold">
                  <span v-if="row.threeDigitNumber !== null">
                    {{ formatPlainNumber(row.threeDigitNumber) }}
                  </span>
                </td>
                <td class="px-3 py-2">{{ row.twoDigitType }}</td>
                <td class="px-3 py-2">{{ row.threeDigitType }}</td>
              </tr>

              <tr v-if="!detailDisplayRows.length">
                <td colspan="6" class="px-3 py-6 text-center text-gray-500">
                  {{ t('invoice.noRows') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section class="rounded-xl border border-gray-200 p-3 sm:p-4">
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="font-semibold">
                {{ t('invoice.print.twoDigit') }}
              </span>
              <span class="text-right">
                {{ formatPlainNumber(detailCalculation.twoDigitBaseTotal) }}
                × {{ formatRate(detailCalculation.twoDigitRate) }} =
                {{ formatPlayResult(detailResultCalculation.twoDigitResult) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="font-semibold">
                {{ t('invoice.print.threeDigit') }}
              </span>
              <span class="text-right">
                {{ formatPlainNumber(detailCalculation.threeDigitBaseTotal) }}
                × {{ formatRate(detailCalculation.threeDigitRate) }} =
                {{ formatPlayResult(detailResultCalculation.threeDigitResult) }}
              </span>
            </div>

            <div
              v-if="detailCalculation.twoDigitCorrectTotal > 0"
              class="flex items-center justify-between gap-3"
            >
              <span class="font-semibold">
                {{ t('invoice.print.correctTwoDigit') }}
              </span>
              <span class="text-right text-red-600">
                {{ formatPlainNumber(detailCalculation.twoDigitCorrectTotal) }}
                × {{ TWO_DIGIT_WIN_MULTIPLIER }} = -
                {{
                  formatPlayResult(
                    detailResultCalculation.twoDigitCorrectResult
                  )
                }}
              </span>
            </div>

            <div
              v-if="detailCalculation.threeDigitCorrectTotal > 0"
              class="flex items-center justify-between gap-3"
            >
              <span class="font-semibold">
                {{ t('invoice.print.correctThreeDigit') }}
              </span>
              <span class="text-right text-red-600">
                {{
                  formatPlainNumber(
                    detailCalculation.threeDigitCorrectTotal
                  )
                }}
                × {{ THREE_DIGIT_WIN_MULTIPLIER }} = -
                {{
                  formatPlayResult(
                    detailResultCalculation.threeDigitCorrectResult
                  )
                }}
              </span>
            </div>

            <div class="my-3 border-t border-gray-200"></div>

            <div
              class="flex items-center justify-between text-xl font-bold"
              :class="
                getGrandTotalColorClass(
                  detailResultCalculation.grandTotal
                )
              "
            >
              <span>{{ t('invoice.print.total') }}</span>
              <span>
                {{
                  formatSignedPlayResult(
                    detailResultCalculation.grandTotal
                  )
                }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            :label="t('invoice.close')"
            severity="secondary"
            outlined
            @click="detailDialogVisible = false"
          />

          <Button
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

    <!-- Delete invoice -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      :header="t('invoice.dialogs.deleteTitle')"
      :style="{
        width: '94vw',
        maxWidth: '420px'
      }"
      :closable="!deleting"
      :draggable="false"
    >
      <div>
        <div class="font-semibold text-gray-900">
          {{ t('invoice.deleteQuestion') }}
        </div>
        <div class="mt-2 text-sm text-gray-500">
          {{ selectedDeletePlay?.title }}
        </div>
      </div>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            :label="t('invoice.cancel')"
            severity="secondary"
            outlined
            :disabled="deleting"
            @click="closeDeleteDialog"
          />

          <Button
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
:deep(.p-inputnumber),
:deep(.p-datepicker) {
  min-height: 44px;
}

:deep(.p-button) {
  min-height: 42px;
}

:deep(.p-inputnumber),
:deep(.p-datepicker),
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
.invoice-form-dialog,
.invoice-detail-dialog {
  display: flex;
  max-height: 94vh;
  flex-direction: column;
}

.invoice-form-dialog .p-dialog-header,
.invoice-detail-dialog .p-dialog-header {
  flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;
}

.invoice-form-dialog .p-dialog-content,
.invoice-detail-dialog .p-dialog-content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.invoice-form-dialog .p-dialog-footer,
.invoice-detail-dialog .p-dialog-footer {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

@media (max-width: 639px) {
  .invoice-form-dialog,
  .invoice-detail-dialog {
    width: 100vw !important;
    height: 100dvh !important;
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
  .p-datepicker-panel {
    max-width: calc(100vw - 1rem);
  }
}
</style>
