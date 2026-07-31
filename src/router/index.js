import {
  createRouter,
  createWebHistory
} from "vue-router";

import { useAuthStore } from "../stores/auth";

import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashboardView from "../views/DashboardView.vue";
import ProductCreateView from "../views/ProductCreateView.vue";
import PlayTable from "../views/PlayTable.vue";
import RateView from "../views/RateView.vue";
import ProfileView from "../views/ProfileView.vue";
import CategoryView from "../views/CategoryView.vue";
import CustomerView from "../views/CustomerView.vue";
import User from "../views/User.vue";


const routes = [
  /*
  |--------------------------------------------------------------------------
  | Root
  |--------------------------------------------------------------------------
  */

  {
    path: "/",
    redirect: "/dashboard",
  },


  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  {
    path: "/login",
    name: "login",
    component: LoginView,

    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/register",
    name: "register",
    component: RegisterView,

    meta: {
      guestOnly: true,
    },
  },


  /*
  |--------------------------------------------------------------------------
  | Profile
  |--------------------------------------------------------------------------
  */

  {
    path: "/profile",
    name: "profile",
    component: ProfileView,

    meta: {
      requiresAuth: true,
    },
  },


  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,

    meta: {
      requiresAuth: true,
    },

    children: [
      /*
      |--------------------------------------------------------------------------
      | Invoice
      |--------------------------------------------------------------------------
      */

      {
        path: "playtable",
        name: "playtable",
        component: PlayTable,

        meta: {
          requiresAuth: true,
        },
      },


      /*
      |--------------------------------------------------------------------------
      | Customer
      |--------------------------------------------------------------------------
      */

      {
        path: "customer",
        name: "customer",
        component: CustomerView,

        meta: {
          requiresAuth: true,
        },
      },


      /*
      |--------------------------------------------------------------------------
      | Product
      |--------------------------------------------------------------------------
      */

      {
        path: "create",
        name: "create",
        component: ProductCreateView,

        meta: {
          requiresAuth: true,
        },
      },


      /*
      |--------------------------------------------------------------------------
      | Category
      |--------------------------------------------------------------------------
      */

      {
        path: "category",
        name: "category",
        component: CategoryView,

        meta: {
          requiresAuth: true,
        },
      },


      /*
      |--------------------------------------------------------------------------
      | Rate
      |--------------------------------------------------------------------------
      */

      {
        path: "rate",
        name: "rate",
        component: RateView,

        meta: {
          requiresAuth: true,
        },
      },


      /*
      |--------------------------------------------------------------------------
      | User Management
      | Admin only
      |--------------------------------------------------------------------------
      */

      {
        path: "user",
        name: "user",
        component: User,

        meta: {
          requiresAuth: true,
          roles: ["admin"],
        },
      },
    ],
  },


  /*
  |--------------------------------------------------------------------------
  | Catch All / Invalid Route
  |--------------------------------------------------------------------------
  |
  | Examples:
  |
  | /abc
  | /hello
  | /dashboard/testing
  | /something/123
  |
  | All invalid paths will first redirect to /dashboard.
  |
  | Then the authentication guard below decides:
  |
  | Logged in     -> Dashboard
  | Not logged in -> Login
  |
  */

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    redirect: "/dashboard",
  },
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});


/*
|--------------------------------------------------------------------------
| Global Route Guard
|--------------------------------------------------------------------------
*/

router.beforeEach((to) => {
  const auth = useAuthStore();


  /*
  |--------------------------------------------------------------------------
  | Check Authentication Requirement
  |--------------------------------------------------------------------------
  */

  const requiresAuth = to.matched.some(
    (record) =>
      record.meta.requiresAuth
  );


  /*
  |--------------------------------------------------------------------------
  | Check Guest-Only Pages
  |--------------------------------------------------------------------------
  */

  const guestOnly = to.matched.some(
    (record) =>
      record.meta.guestOnly
  );


  /*
  |--------------------------------------------------------------------------
  | Get Required Roles
  |--------------------------------------------------------------------------
  */

  const roleRecord = to.matched.find(
    (record) =>
      Array.isArray(record.meta.roles) &&
      record.meta.roles.length > 0
  );

  const requiredRoles =
    roleRecord?.meta?.roles || [];


  /*
  |--------------------------------------------------------------------------
  | User Is Not Logged In
  |--------------------------------------------------------------------------
  */

  if (
    requiresAuth &&
    !auth.isAuthenticated
  ) {
    return {
      name: "login",

      query: {
        redirect: to.fullPath,
      },
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Logged-In User Opens Login / Register
  |--------------------------------------------------------------------------
  */

  if (
    guestOnly &&
    auth.isAuthenticated
  ) {
    return {
      name: "dashboard",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Role Validation
  |--------------------------------------------------------------------------
  */

  if (
    requiredRoles.length > 0
  ) {
    /*
     * Support both possible auth-store structures:
     *
     * auth.user
     * auth.currentUser
     */

    const currentUser =
      auth.user ||
      auth.currentUser ||
      null;

    const currentRole =
      currentUser?.role ||
      null;


    /*
     * User must be logged in first.
     */

    if (!auth.isAuthenticated) {
      return {
        name: "login",

        query: {
          redirect: to.fullPath,
        },
      };
    }


    /*
     * User does not have permission.
     */

    if (
      !currentRole ||
      !requiredRoles.includes(
        currentRole
      )
    ) {
      return {
        name: "dashboard",
      };
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Allow Navigation
  |--------------------------------------------------------------------------
  */

  return true;
});


export default router;