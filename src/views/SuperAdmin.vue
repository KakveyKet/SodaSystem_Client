<script setup>
import {
  computed,
  reactive,
  ref,
} from "vue";

import {
  useRouter,
} from "vue-router";

import {
  useToast,
} from "primevue/usetoast";

import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Password from "primevue/password";

import api from "../services/api";

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const form = reactive({
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const isFormValid = computed(() => {
  return Boolean(
    form.name.trim() &&
      form.username.trim() &&
      form.email.trim() &&
      form.password &&
      form.confirmPassword &&
      !loading.value
  );
});

const validateForm = () => {
  const name =
    form.name.trim();

  const username =
    form.username
      .trim()
      .toLowerCase();

  const email =
    form.email
      .trim()
      .toLowerCase();

  if (!name) {
    return "Name is required";
  }

  if (!username) {
    return "Username is required";
  }

  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }

  if (username.length > 30) {
    return "Username cannot be longer than 30 characters";
  }

  if (
    !/^[a-z0-9._-]+$/.test(
      username
    )
  ) {
    return "Username can only contain letters, numbers, dots, underscores, and hyphens";
  }

  if (!email) {
    return "Email is required";
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return "Please provide a valid email address";
  }

  if (!form.password) {
    return "Password is required";
  }

  if (form.password.length < 6) {
    return "Password must be at least 6 characters";
  }

  if (
    form.password !==
    form.confirmPassword
  ) {
    return "Passwords do not match";
  }

  return "";
};

const resetForm = () => {
  form.name = "";
  form.username = "";
  form.email = "";
  form.password = "";
  form.confirmPassword = "";
};

const submit = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const validationError =
    validateForm();

  if (validationError) {
    errorMessage.value =
      validationError;

    return;
  }

  try {
    loading.value = true;

    const payload = {
      name:
        form.name.trim(),

      username:
        form.username
          .trim()
          .toLowerCase(),

      email:
        form.email
          .trim()
          .toLowerCase(),

      password:
        form.password,
    };

    const response =
      await api.post(
        "/auth/admin-register",
        payload
      );

    successMessage.value =
      response.data?.message ||
      "Administrator account created successfully";

    toast.add({
      severity: "success",
      summary:
        "Administrator created",
      detail:
        successMessage.value,
      life: 3000,
    });

    resetForm();
  } catch (error) {
    console.error(
      "Create administrator error:",
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      "Could not create the administrator account";

    toast.add({
      severity: "error",
      summary: "Creation failed",
      detail:
        errorMessage.value,
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = async () => {
  await router.push({
    name: "login",
  });
};
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-slate-100 px-3 py-8"
  >
    <Card
      class="w-full max-w-lg shadow-xl"
    >
      <template #title>
        <div class="text-center">
          <div
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700"
          >
            <i
              class="pi pi-shield text-2xl"
            ></i>
          </div>

          <h1
            class="text-2xl font-bold text-slate-900"
          >
            Create Administrator
          </h1>
        </div>
      </template>

      <template #subtitle>
        <div class="text-center">
          Create an administrator account
        </div>
      </template>

      <template #content>
        <form
          class="space-y-4"
          @submit.prevent="submit"
        >
          <Message
            v-if="errorMessage"
            severity="error"
            :closable="false"
          >
            {{ errorMessage }}
          </Message>

          <Message
            v-if="successMessage"
            severity="success"
            :closable="false"
          >
            {{ successMessage }}
          </Message>

          <div>
            <label
              for="admin-name"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Name
            </label>

            <InputText
              id="admin-name"
              v-model="form.name"
              class="w-full"
              placeholder="Enter full name"
              maxlength="100"
              autocomplete="name"
              required
              autofocus
            />
          </div>

          <div>
            <label
              for="admin-username"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Username
            </label>

            <InputText
              id="admin-username"
              v-model="form.username"
              class="w-full"
              placeholder="Enter username"
              maxlength="30"
              autocomplete="username"
              required
            />
          </div>

          <div>
            <label
              for="admin-email"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <InputText
              id="admin-email"
              v-model="form.email"
              type="email"
              class="w-full"
              placeholder="Enter email address"
              autocomplete="email"
              required
            />
          </div>

          <div>
            <label
              for="admin-password"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <Password
              id="admin-password"
              v-model="form.password"
              class="w-full"
              input-class="w-full"
              placeholder="Minimum 6 characters"
              toggle-mask
              autocomplete="new-password"
              required
            />
          </div>

          <div>
            <label
              for="admin-confirm-password"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>

            <Password
              id="admin-confirm-password"
              v-model="form.confirmPassword"
              class="w-full"
              input-class="w-full"
              placeholder="Enter password again"
              toggle-mask
              :feedback="false"
              autocomplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            label="Create Administrator"
            icon="pi pi-shield"
            severity="danger"
            class="w-full"
            :loading="loading"
            :disabled="!isFormValid"
          />

          <Button
            type="button"
            label="Back to Login"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            class="w-full"
            :disabled="loading"
            @click="goToLogin"
          />
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 1.25rem;
}

:deep(.p-inputtext),
:deep(.p-password),
:deep(.p-password-input),
:deep(.p-button) {
  min-height: 46px;
}

:deep(.p-password) {
  width: 100%;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 2rem;
  }
}
</style>