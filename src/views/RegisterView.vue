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
  name: '',
  email: '',
  password: ''
});

const submit = async () => {
  try {
    await auth.register(form);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Account created successfully', life: 2500 });
    router.push({ name: 'dashboard' });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Register failed', detail: auth.error, life: 3000 });
  }
};
</script>

<template>
  <div class="mx-auto max-w-md">
    <Card>
      <template #title>Create account</template>
      <template #subtitle>Register a new user</template>
      <template #content>
        <form class="space-y-4" @submit.prevent="submit">
          <Message v-if="auth.error" severity="error">{{ auth.error }}</Message>

          <div>
            <label class="mb-1 block text-sm font-medium">Name</label>
            <InputText v-model="form.name" class="w-full" placeholder="Your name" required />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">Email</label>
            <InputText v-model="form.email" type="email" class="w-full" placeholder="you@example.com" required />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">Password</label>
            <Password v-model="form.password" class="w-full" input-class="w-full" toggle-mask required />
          </div>

          <Button type="submit" label="Register" icon="pi pi-user-plus" class="w-full" :loading="auth.loading" />

          <p class="text-center text-sm text-slate-600">
            Already have an account?
            <RouterLink to="/login" class="font-medium text-primary">Login here</RouterLink>
          </p>
        </form>
      </template>
    </Card>
  </div>
</template>
