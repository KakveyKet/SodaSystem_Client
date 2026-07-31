<script setup>
import { computed } from 'vue';
import {
  RouterLink,
  RouterView,
  useRoute
} from 'vue-router';

import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();

const dashboardCards = [
  {
    title: 'Invoice List',
    routeName: 'playtable',
    icon: 'pi pi-file',
    iconStyle: 'bg-blue-100 text-blue-600',
    hoverStyle:
      'hover:border-blue-300 hover:bg-blue-50'
  },
  {
    title: 'Customer List',
    routeName: 'customer',
    icon: 'pi pi-users',
    iconStyle:
      'bg-emerald-100 text-emerald-600',
    hoverStyle:
      'hover:border-emerald-300 hover:bg-emerald-50'
  },
  {
    title: 'Product List',
    routeName: 'create',
    icon: 'pi pi-box',
    iconStyle:
      'bg-orange-100 text-orange-600',
    hoverStyle:
      'hover:border-orange-300 hover:bg-orange-50'
  },
  {
    title: 'Category List',
    routeName: 'category',
    icon: 'pi pi-tags',
    iconStyle:
      'bg-purple-100 text-purple-600',
    hoverStyle:
      'hover:border-purple-300 hover:bg-purple-50'
  },
  {
    title: 'Rate List',
    routeName: 'rate',
    icon: 'pi pi-percentage',
    iconStyle:
      'bg-rose-100 text-rose-600',
    hoverStyle:
      'hover:border-rose-300 hover:bg-rose-50'
  },
  {
    title: 'User List',
    routeName: 'user',
    icon: 'pi pi-user-edit',
    iconStyle:
      'bg-cyan-100 text-cyan-700',
    hoverStyle:
      'hover:border-cyan-300 hover:bg-cyan-50',
    adminOnly: true
  }
];

const isDashboardHome = computed(() => {
  return route.name === 'dashboard';
});

const currentUserRole = computed(() => {
  return (
    auth.user?.role ||
    auth.currentUser?.role ||
    null
  );
});

const visibleDashboardCards = computed(() => {
  return dashboardCards.filter((card) => {
    if (!card.adminOnly) {
      return true;
    }

    return currentUserRole.value === 'admin';
  });
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main
      v-if="isDashboardHome"
      class="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8 lg:px-8"
    >
      <h1
        class="mb-5 text-2xl font-bold text-gray-900 sm:mb-7 sm:text-3xl"
      >
        Dashboard
      </h1>

      <div
        class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
      >
        <RouterLink
          v-for="card in visibleDashboardCards"
          :key="card.routeName"
          :to="{ name: card.routeName }"
          :class="[
            'flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition duration-200 active:scale-[0.97] sm:min-h-40 sm:p-6',
            card.hoverStyle
          ]"
        >
          <div
            :class="[
              'flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14',
              card.iconStyle
            ]"
          >
            <i
              :class="[
                card.icon,
                'text-xl sm:text-2xl'
              ]"
            ></i>
          </div>

          <h2
            class="text-sm font-bold text-gray-900 sm:text-lg"
          >
            {{ card.title }}
          </h2>
        </RouterLink>
      </div>
    </main>

    <RouterView v-else />
  </div>
</template>