<script setup>
import { ref } from 'vue';
import {
  RouterLink,
  useRoute,
  useRouter
} from 'vue-router';

import Button from 'primevue/button';

import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const loggingOut = ref(false);

const isActiveRoute = (routeName) => {
  return route.name === routeName;
};

const handleLogout = async () => {
  if (loggingOut.value) {
    return;
  }

  try {
    loggingOut.value = true;

    await auth.logout();

    await router.replace({
      name: 'login'
    });
  } catch (error) {
    console.error('Logout error:', error);

    await router.replace({
      name: 'login'
    });
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur"
  >
    <nav
      class="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8"
    >
      <!-- Application name -->
      <RouterLink
        :to="{ name: 'dashboard' }"
        class="min-w-0"
        aria-label="Go to dashboard"
      >
        <div
          class="truncate text-base font-extrabold tracking-tight text-blue-700 transition hover:text-blue-800 sm:text-xl"
        >
          So Da Management
        </div>

        <div
          class="hidden text-xs font-medium text-gray-500 sm:block"
        >
          Management System
        </div>
      </RouterLink>

      <!-- Authenticated menu -->
      <div
        v-if="auth.isAuthenticated"
        class="flex shrink-0 items-center gap-2"
      >
        <RouterLink
          :to="{ name: 'dashboard' }"
          :class="[
            'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition active:scale-95 sm:px-4',
            isActiveRoute('dashboard')
              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
              : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100'
          ]"
          aria-label="Dashboard"
          title="Dashboard"
        >
          <i class="pi pi-home text-base"></i>

          <span class="hidden sm:inline">
            Dashboard
          </span>
        </RouterLink>

        <RouterLink
          :to="{ name: 'profile' }"
          :class="[
            'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition active:scale-95 sm:px-4',
            isActiveRoute('profile')
              ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
              : 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-100'
          ]"
          aria-label="Profile"
          title="Profile"
        >
          <i class="pi pi-user text-base"></i>

          <span class="hidden sm:inline">
            Profile
          </span>
        </RouterLink>

        <Button
          label="Logout"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          class="navbar-logout-button"
          :loading="loggingOut"
          :disabled="loggingOut"
          aria-label="Logout"
          title="Logout"
          @click="handleLogout"
        />
      </div>

      <!-- Guest menu -->
      <div
        v-else
        class="flex shrink-0 items-center"
      >
        <RouterLink
          :to="{ name: 'login' }"
          :class="[
            'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition active:scale-95',
            isActiveRoute('login')
              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
              : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100'
          ]"
          aria-label="Login"
        >
          <i class="pi pi-sign-in"></i>

          <span>
            Login
          </span>
        </RouterLink>
      </div>
    </nav>
  </header>
</template>

<style scoped>
:deep(.navbar-logout-button) {
  min-width: 44px;
  min-height: 44px;
  border-radius: 0.75rem;
  font-weight: 600;
}

@media (max-width: 639px) {
  :deep(.navbar-logout-button .p-button-label) {
    display: none;
  }

  :deep(.navbar-logout-button) {
    width: 44px;
    padding-left: 0;
    padding-right: 0;
  }

  :deep(.navbar-logout-button .p-button-icon) {
    margin: 0;
  }
}
</style>