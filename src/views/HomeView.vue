<script setup>
import Card from 'primevue/card';
import Button from 'primevue/button';
</script>

<template>
  <section class="grid gap-6 md:grid-cols-2 md:items-center">
    <div>
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Express + MongoDB + Vue</p>
      <h1 class="mb-4 text-4xl font-bold leading-tight md:text-5xl">
        Full-stack starter with JWT authentication
      </h1>
      <p class="mb-6 text-lg text-slate-600">
        Backend uses Express, Mongoose, JWT, password hashing, validation, and security middleware.
        Frontend uses Vue, Tailwind CSS, PrimeVue, Pinia, and Vue Router.
      </p>
      <div class="flex gap-3">
        <RouterLink to="/register">
          <Button label="Get Started" icon="pi pi-arrow-right" />
        </RouterLink>
        <RouterLink to="/login">
          <Button label="Login" icon="pi pi-sign-in" outlined />
        </RouterLink>
      </div>
    </div>

    <Card>
      <template #title>Included</template>
      <template #content>
        <ul class="space-y-3 text-slate-700">
          <li><i class="pi pi-check text-primary"></i> Express API structure</li>
          <li><i class="pi pi-check text-primary"></i> MongoDB connection with Mongoose</li>
          <li><i class="pi pi-check text-primary"></i> Register, login, logout, protected route</li>
          <li><i class="pi pi-check text-primary"></i> Vue UI with PrimeVue components</li>
          <li><i class="pi pi-check text-primary"></i> Tailwind utility styling</li>
        </ul>
      </template>
    </Card>
  </section>
</template>
