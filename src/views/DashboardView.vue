<script setup>
import { computed } from "vue";

import { useRouter } from "vue-router";

import { useI18n } from "vue-i18n";

import { useAuthStore } from "../stores/auth";

/*
|--------------------------------------------------------------------------
| Router / Auth
|--------------------------------------------------------------------------
*/

const router = useRouter();

const auth = useAuthStore();

/*
|--------------------------------------------------------------------------
| Translation
|--------------------------------------------------------------------------
|
| Local translation only for this dashboard.
|
| Your global language selector can continue changing locale between:
| - en
| - km
|
*/

const { t } = useI18n({
  useScope: "local",

  inheritLocale: true,

  messages: {
    en: {
      dashboard: {
        title: "Dashboard",

        cards: {
          invoices: "Invoices",

          customers: "Customers",

          products: "Products",

          categories: "Categories",

          rates: "Rates",

          users: "Users",

          report: "Customer Loan / Deposit Report",
        },
      },
    },

    km: {
      dashboard: {
        title: "ផ្ទាំងគ្រប់គ្រង",

        cards: {
          invoices: "បញ្ជីវិក្កយបត្រ",

          customers: "បញ្ជីអតិថិជន",

          products: "បញ្ជីផលិតផល",

          categories: "បញ្ជីប្រភេទ",

          rates: "បញ្ជីអត្រា",

          users: "បញ្ជីអ្នកប្រើប្រាស់",

          report: "របាយការណ៍ប្រាក់កម្ចី / ប្រាក់ដាក់",
        },
      },
    },
  },
});

/*
|--------------------------------------------------------------------------
| Current user role
|--------------------------------------------------------------------------
*/

const currentRole = computed(() => {
  return auth.user?.role || "";
});

const isAdmin = computed(() => {
  return currentRole.value === "admin";
});

/*
|--------------------------------------------------------------------------
| Dashboard cards
|--------------------------------------------------------------------------
|
| Existing cards:
|
| 1. Invoice
| 2. Customer
| 3. Product
| 4. Category
| 5. Rate
| 6. User
|
| New:
|
| 7. Customer Loan / Deposit Report
|
| User + Report are admin-only because your router currently marks them
| adminOnly.
|
*/

const allCards = computed(() => [
  {
    key: "invoices",

    title: t("dashboard.cards.invoices"),

    icon: "pi pi-file",

    iconWrapperClass: "dashboard-icon-blue",

    routeName: "playtable",

    adminOnly: false,
  },

  {
    key: "customers",

    title: t("dashboard.cards.customers"),

    icon: "pi pi-users",

    iconWrapperClass: "dashboard-icon-green",

    routeName: "customer",

    adminOnly: false,
  },

  {
    key: "products",

    title: t("dashboard.cards.products"),

    icon: "pi pi-box",

    iconWrapperClass: "dashboard-icon-orange",

    routeName: "create",

    adminOnly: false,
  },

  {
    key: "categories",

    title: t("dashboard.cards.categories"),

    icon: "pi pi-tags",

    iconWrapperClass: "dashboard-icon-purple",

    routeName: "category",

    adminOnly: false,
  },

  {
    key: "rates",

    title: t("dashboard.cards.rates"),

    icon: "pi pi-percentage",

    iconWrapperClass: "dashboard-icon-red",

    routeName: "rate",

    adminOnly: false,
  },

  {
    key: "users",

    title: t("dashboard.cards.users"),

    icon: "pi pi-user-edit",

    iconWrapperClass: "dashboard-icon-cyan",

    routeName: "user",

    adminOnly: true,
  },

  /*
    |--------------------------------------------------------------------------
    | New report card
    |--------------------------------------------------------------------------
    |
    | This card contains NO report summary and makes NO API request.
    |
    | It only opens:
    |
    | /reports/customer-deposits
    |
    */

  {
    key: "report",

    title: t("dashboard.cards.report"),

    icon: "pi pi-chart-bar",

    iconWrapperClass: "dashboard-icon-amber",

    routeName: "customer-deposit-report",

    adminOnly: true,
  },
]);

/*
|--------------------------------------------------------------------------
| Visible cards
|--------------------------------------------------------------------------
*/

const dashboardCards = computed(() => {
  return allCards.value.filter((card) => {
    if (!card.adminOnly) {
      return true;
    }

    return isAdmin.value;
  });
});

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const openCard = (card) => {
  if (!card?.routeName) {
    return;
  }

  router.push({
    name: card.routeName,
  });
};
</script>

<template>
  <main class="dashboard-page">
    <div class="dashboard-container">
      <!--
      ========================================================================
      Title
      ========================================================================
      -->

      <h1 class="dashboard-title">
        {{ t("dashboard.title") }}
      </h1>

      <!--
      ========================================================================
      Cards
      ========================================================================
      -->

      <section class="dashboard-grid">
        <button
          v-for="card in dashboardCards"
          :key="card.key"
          type="button"
          class="dashboard-card"
          @click="openCard(card)"
        >
          <!-- Icon -->

          <div :class="['dashboard-card-icon', card.iconWrapperClass]">
            <i :class="card.icon"></i>
          </div>

          <!-- Name -->

          <div class="dashboard-card-title">
            {{ card.title }}
          </div>
        </button>
      </section>
    </div>
  </main>
</template>

<style scoped>
/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

.dashboard-page {
  min-height: calc(100vh - 64px);

  background: #f8fafc;
}

.dashboard-container {
  width: 100%;

  max-width: 1450px;

  margin: 0 auto;

  padding: 48px 44px 72px;
}

/*
|--------------------------------------------------------------------------
| Title
|--------------------------------------------------------------------------
*/

.dashboard-title {
  margin: 0 0 32px;

  color: #0f172a;

  font-size: 34px;

  line-height: 1.3;

  font-weight: 800;
}

/*
|--------------------------------------------------------------------------
| Grid
|--------------------------------------------------------------------------
|
| Desktop:
| 3 cards per row
|
| With 7 cards:
|
| 1 2 3
| 4 5 6
| 7
|
*/

.dashboard-grid {
  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 20px;
}

/*
|--------------------------------------------------------------------------
| Card
|--------------------------------------------------------------------------
*/

.dashboard-card {
  width: 100%;

  min-height: 200px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 28px 24px;

  border: 1px solid #dbe1e8;

  border-radius: 18px;

  background: #ffffff;

  color: inherit;

  cursor: pointer;

  box-shadow: 0 2px 5px rgb(15 23 42 / 0.12);

  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.dashboard-card:hover {
  border-color: #22d3ee;

  background: #ecfeff;

  box-shadow: 0 8px 22px rgb(15 23 42 / 0.12);

  transform: translateY(-2px);
}

.dashboard-card:focus-visible {
  outline: 3px solid rgb(34 211 238 / 0.35);

  outline-offset: 3px;
}

/*
|--------------------------------------------------------------------------
| Icon
|--------------------------------------------------------------------------
*/

.dashboard-card-icon {
  width: 70px;

  height: 70px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 15px;

  font-size: 20px;
}

.dashboard-icon-blue {
  background: #dbeafe;

  color: #2563eb;
}

.dashboard-icon-green {
  background: #d1fae5;

  color: #059669;
}

.dashboard-icon-orange {
  background: #ffedd5;

  color: #f97316;
}

.dashboard-icon-purple {
  background: #f3e8ff;

  color: #9333ea;
}

.dashboard-icon-red {
  background: #ffe4e6;

  color: #e11d48;
}

.dashboard-icon-cyan {
  background: #cffafe;

  color: #0891b2;
}

.dashboard-icon-amber {
  background: #fef3c7;

  color: #d97706;
}

/*
|--------------------------------------------------------------------------
| Card title
|--------------------------------------------------------------------------
*/

.dashboard-card-title {
  max-width: 100%;

  margin-top: 20px;

  color: #0f172a;

  text-align: center;

  font-size: 18px;

  line-height: 1.5;

  font-weight: 700;

  overflow-wrap: anywhere;
}

/*
|--------------------------------------------------------------------------
| Responsive
|--------------------------------------------------------------------------
*/

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard-container {
    padding: 28px 16px 48px;
  }

  .dashboard-title {
    margin-bottom: 22px;

    font-size: 28px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;

    gap: 14px;
  }

  .dashboard-card {
    min-height: 155px;

    padding: 22px 18px;
  }

  .dashboard-card-icon {
    width: 60px;

    height: 60px;

    border-radius: 14px;
  }

  .dashboard-card-title {
    margin-top: 14px;

    font-size: 17px;
  }
}
</style>
