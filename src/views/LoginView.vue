<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const form = reactive({
  email: '',
  password: ''
});

const submit = async () => {
  try {
    await auth.login(form);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Logged in successfully', life: 2500 });
    router.push({ name: 'dashboard' });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Login failed', detail: auth.error, life: 3000 });
  }
};
</script>

<template>
  <div class="mx-auto max-w-md">
    <Card>
      <template #title>Login</template>
      <template #subtitle>Access your account</template>
      <template #content>
        <form class="space-y-4" @submit.prevent="submit">
          <Message v-if="auth.error" severity="error">{{ auth.error }}</Message>

          <div>
            <label class="mb-1 block text-sm font-medium">Email</label>
            <InputText v-model="form.email" type="email" class="w-full" placeholder="you@example.com" required />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">Password</label>
            <Password v-model="form.password" class="w-full" input-class="w-full" toggle-mask :feedback="false" required />
          </div>

          <Button type="submit" label="Login" icon="pi pi-sign-in" class="w-full" :loading="auth.loading" />

          <p class="text-center text-sm text-slate-600">
            No account?
            <RouterLink to="/register" class="font-medium text-primary">Register here</RouterLink>
          </p>
        </form>
      </template>
    </Card>
  </div>
</template>
