<script setup>
import {
  computed,
} from "vue";

import {
  useRoute,
} from "vue-router";

import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";

import NavBar from "./components/NavBar.vue";

const route = useRoute();

const showNavBar = computed(() => {
  return (
    route.meta.hideNavBar !== true
  );
});
</script>

<template>
  <Toast />

  <ConfirmDialog />

  <div class="min-h-screen text-slate-900">
    <NavBar v-if="showNavBar" />

    <main
      :class="
        showNavBar
          ? 'mx-auto max-w-6xl px-4 py-8'
          : 'min-h-screen'
      "
    >
      <RouterView />
    </main>
  </div>
</template>