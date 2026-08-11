import { createRouter, createWebHistory } from "vue-router";

import { useAuthStore } from "../stores/auth";

import CategoryView from "../views/CategoryView.vue";
import CustomerBalance from "../views/CustomerBalance.vue";
import CustomerInvoices from "../views/CustomerInvoices.vue";
import CustomerProfile from "../views/CustomerProfile.vue";
import CustomerReport from "../views/CustomerReport.vue";
import CustomerView from "../views/CustomerView.vue";
import DashboardView from "../views/DashboardView.vue";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import PlayTable from "../views/PlayTable.vue";
import ProductCreateView from "../views/ProductCreateView.vue";
import ProfileView from "../views/ProfileView.vue";
import RateView from "../views/RateView.vue";
import SuperAdmin from "../views/SuperAdmin.vue";
import User from "../views/User.vue";
import CustomerDepositReport from "../views/CustomerDepositReport.vue";

const customerPortalMeta = {
  requiresAuth: true,
  allowedRoles: ["customer"],
  customerPortal: true,
  hideNavBar: true,
};

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      publicRoute: true,
      hideNavBar: true,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Customer portal
  |--------------------------------------------------------------------------
  |
  | Bottom navigation order:
  | Report -> Invoice -> Home -> Profile
  |
  */
  {
    path: "/customer/home",
    name: "customer-home",
    component: CustomerBalance,
    meta: customerPortalMeta,
  },
  {
    path: "/customer/report",
    name: "customer-report",
    component: CustomerReport,
    meta: customerPortalMeta,
  },
  {
    path: "/customer/invoices",
    name: "customer-invoices",
    component: CustomerInvoices,
    meta: customerPortalMeta,
  },
  {
    path: "/customer/profile",
    name: "customer-profile",
    component: CustomerProfile,
    meta: customerPortalMeta,
  },

  /* Keep old customer URL and route name working. */
  {
    path: "/customer-balance",
    name: "customer-balance",
    redirect: { name: "customer-home" },
    meta: customerPortalMeta,
  },

  {
    path: "/admin-register",
    name: "admin-register",
    component: SuperAdmin,
    meta: {
      publicRoute: true,
      alwaysAllow: true,
      hideNavBar: true,
    },
  },

  {
    path: "/",
    redirect: { name: "dashboard" },
  },

  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },

  {
    path: "/home",
    name: "home",
    component: HomeView,
    meta: { requiresAuth: true },
  },

  {
    path: "/categories",
    alias: "/category",
    name: "category",
    component: CategoryView,
    meta: { requiresAuth: true },
  },

  {
    path: "/customers",
    alias: "/customer",
    name: "customer",
    component: CustomerView,
    meta: { requiresAuth: true },
  },

  {
    path: "/products/create",
    alias: "/products",
    name: "create",
    component: ProductCreateView,
    meta: { requiresAuth: true },
  },

  {
    path: "/invoices",
    alias: "/lottery-plays",
    name: "playtable",
    component: PlayTable,
    meta: { requiresAuth: true },
  },

  {
    path: "/rates",
    alias: "/rate",
    name: "rate",
    component: RateView,
    meta: { requiresAuth: true },
  },

  {
    path: "/profile",
    name: "profile",
    component: ProfileView,
    meta: { requiresAuth: true },
  },

  {
    path: "/reports/customer-deposits",
    name: "customer-deposit-report",
    component: CustomerDepositReport,
    meta: {
      requiresAuth: true,
      adminOnly: true,
    },
  },

  {
    path: "/users",
    alias: "/user",
    name: "user",
    component: User,
    meta: {
      requiresAuth: true,
      adminOnly: true,
    },
  },

  {
    path: "/register",
    redirect: { name: "login" },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    redirect: { name: "dashboard" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const storedToken = localStorage.getItem("token");
  const hasToken = Boolean(auth.token || storedToken);

  if (hasToken && !auth.user && typeof auth.fetchCurrentUser === "function") {
    try {
      await auth.fetchCurrentUser();
    } catch (error) {
      console.error("Restore user error:", error);
      auth.logout();

      if (to.meta.alwaysAllow === true) {
        return true;
      }

      return {
        name: "login",
        query: { redirect: to.fullPath },
      };
    }
  }

  const isAuthenticated = Boolean(auth.token && auth.user);
  const role = auth.user?.role || null;

  if (to.meta.alwaysAllow === true) {
    return true;
  }

  if (to.name === "login") {
    if (!isAuthenticated) {
      return true;
    }

    return role === "customer"
      ? { name: "customer-home" }
      : { name: "dashboard" };
  }

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth === true,
  );

  if (requiresAuth && !isAuthenticated) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  const isCustomerPortalRoute = to.matched.some(
    (record) => record.meta.customerPortal === true,
  );

  /* Customers stay inside the four-page customer portal. */
  if (isAuthenticated && role === "customer" && !isCustomerPortalRoute) {
    return { name: "customer-home" };
  }

  /* Admin/user accounts cannot open customer-only portal pages. */
  if (isAuthenticated && role !== "customer" && isCustomerPortalRoute) {
    return { name: "dashboard" };
  }

  const allowedRoles = to.matched.flatMap((record) =>
    Array.isArray(record.meta.allowedRoles) ? record.meta.allowedRoles : [],
  );

  if (
    isAuthenticated &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return role === "customer"
      ? { name: "customer-home" }
      : { name: "dashboard" };
  }

  const adminOnly = to.matched.some((record) => record.meta.adminOnly === true);

  if (adminOnly && role !== "admin") {
    return role === "customer"
      ? { name: "customer-home" }
      : { name: "dashboard" };
  }

  return true;
});

export default router;
