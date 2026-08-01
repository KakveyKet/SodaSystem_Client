<script setup>
import {
  computed,
  ref
} from "vue";

import {
  useRoute,
  useRouter
} from "vue-router";

import { useI18n } from "vue-i18n";

import Button from "primevue/button";

import { useAuthStore } from "../stores/auth";

import LanguageSwitcher from "./LanguageSwitcher.vue";

const router = useRouter();
const route = useRoute();

const auth = useAuthStore();

const { t } = useI18n();

const loggingOut = ref(false);

const currentUser = computed(() => {
  return (
    auth.user ||
    auth.currentUser ||
    null
  );
});

const currentUserName = computed(() => {
  return (
    currentUser.value?.name ||
    currentUser.value?.username ||
    currentUser.value?.email ||
    "User"
  );
});

const currentUserRole = computed(() => {
  return (
    currentUser.value?.role ||
    "user"
  );
});

const isDashboardActive = computed(() => {
  return (
    route.path === "/dashboard"
  );
});

const isProfileActive = computed(() => {
  return (
    route.path === "/profile"
  );
});

const goToDashboard = () => {
  router.push({
    name: "dashboard",
  });
};

const goToProfile = () => {
  router.push({
    name: "profile",
  });
};

const handleLogout = async () => {
  if (loggingOut.value) {
    return;
  }

  try {
    loggingOut.value = true;

    /*
     * Support different auth store
     * logout implementations.
     */
    if (
      typeof auth.logout ===
      "function"
    ) {
      await auth.logout();
    } else {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );
    }

    await router.replace({
      name: "login",
    });
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    /*
     * Even when backend logout
     * fails, remove local auth
     * information.
     */
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    await router.replace({
      name: "login",
    });
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <header class="
      sticky
      top-0
      z-50
      border-b
      border-gray-200
      bg-white/95
      shadow-sm
      backdrop-blur
    ">
    <div class="
        mx-auto
        flex
        min-h-16
        max-w-7xl
        items-center
        justify-between
        gap-2
        px-3
        sm:px-4
        lg:px-6
      ">
      <!-- ========================== -->
      <!-- Left: Logo / Application -->
      <!-- ========================== -->

      <button type="button" class="
          flex
          min-w-0
          items-center
          gap-2
          rounded-lg
          text-left
          transition
          hover:opacity-80
          sm:gap-3
        " @click="goToDashboard">
        <div class="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-600
            text-white
            shadow-sm
          ">
          <i class="
              pi
              pi-chart-line
              text-lg
            "></i>
        </div>

        <div class="min-w-0">
          <h1 class="
              truncate
              text-sm
              font-extrabold
              tracking-tight
              text-gray-900
              sm:text-base
              lg:text-lg
            ">
            So Da Management
          </h1>

          <p class="
              hidden
              truncate
              text-xs
              text-gray-500
              sm:block
            ">
            {{
              t(
                "dashboard.subtitle"
              )
            }}
          </p>
        </div>
      </button>


      <!-- ========================== -->
      <!-- Right Actions -->
      <!-- ========================== -->

      <div class="
          flex
          shrink-0
          items-center
          gap-1
          sm:gap-2
        ">
        <!-- Language -->

        <div class="w-[66px] sm:w-[132px]">
          <LanguageSwitcher />
        </div>

        <!-- Dashboard -->

        <button type="button" class="
            flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-lg
            px-2
            text-sm
            font-medium
            transition
            sm:px-3
          " :class="isDashboardActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            " :title="t('nav.dashboard')
            " @click="goToDashboard">
          <i class="
              pi
              pi-home
              text-lg
            "></i>

          <span class="
              hidden
              lg:inline
            ">
            {{
              t(
                "nav.dashboard"
              )
            }}
          </span>
        </button>


        <!-- Profile -->

        <button type="button" class="
            flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-lg
            px-2
            text-sm
            font-medium
            transition
            sm:px-3
          " :class="isProfileActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            " :title="t('nav.profile')
            " @click="goToProfile">
          <i class="
              pi
              pi-user
              text-lg
            "></i>

          <span class="
              hidden
              lg:inline
            ">
            {{
              t(
                "nav.profile"
              )
            }}
          </span>
        </button>


        <!-- User Information -->

        <div class="
            hidden
            border-l
            border-gray-200
            pl-3
            xl:block
          ">
          <p class="
              max-w-[150px]
              truncate
              text-xs
              font-semibold
              text-gray-800
            ">
            {{ currentUserName }}
          </p>

          <p class="
              text-[11px]
              capitalize
              text-gray-500
            ">
            {{ currentUserRole }}
          </p>
        </div>


        <!-- Logout -->

        <Button type="button" severity="danger" text rounded :loading="loggingOut" :title="t('nav.logout')
          " class="
            !h-10
            !min-w-10
            !px-2
            sm:!px-3
          " @click="handleLogout">
          <template #default>
            <div class="
                flex
                items-center
                gap-2
              ">
              <i v-if="
                !loggingOut
              " class="
                  pi
                  pi-sign-out
                  text-lg
                "></i>

              <span class="
                  hidden
                  lg:inline
                ">
                {{
                  t(
                    "nav.logout"
                  )
                }}
              </span>
            </div>
          </template>
        </Button>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  -webkit-backdrop-filter:
    blur(10px);

  backdrop-filter:
    blur(10px);
}
</style>