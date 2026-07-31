<script setup>
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import NavBar from './components/NavBar.vue';
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <div class="min-h-screen text-slate-900">
    <NavBar />
    <main class="mx-auto max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
