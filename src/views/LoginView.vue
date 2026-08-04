<script setup>
import {
  computed,
  reactive,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Password from "primevue/password";

import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const submitting = ref(false);
const errorMessage = ref("");

const form = reactive({
  identifier: "",
  password: "",
});

const isFormValid = computed(() =>
  Boolean(form.identifier.trim() && form.password),
);

const isLoading = computed(() =>
  Boolean(submitting.value || auth.loading),
);

const displayedError = computed(() =>
  errorMessage.value || auth.error || "",
);

const redirectAfterLogin = async (result) => {
  const loggedInUser = result?.user || auth.user || null;

  if (loggedInUser?.role === "customer") {
    await router.replace({ name: "customer-balance" });
    return;
  }

  const requestedRedirect = route.query.redirect;
  const blocked = [
    "/login",
    "/register",
    "/admin-register",
    "/customer-balance",
  ];

  const safeRedirect =
    typeof requestedRedirect === "string" &&
    requestedRedirect.startsWith("/") &&
    !requestedRedirect.startsWith("//") &&
    !blocked.includes(requestedRedirect);

  if (safeRedirect) {
    await router.replace(requestedRedirect);
    return;
  }

  await router.replace({ name: "dashboard" });
};

const submit = async () => {
  if (isLoading.value) {
    return;
  }

  try {
    errorMessage.value = "";
    auth.error = "";

    const identifier = form.identifier.trim();
    const password = String(form.password || "");

    if (!identifier) {
      errorMessage.value = "Username or email is required";
      return;
    }

    if (!password) {
      errorMessage.value = "Password is required";
      return;
    }

    submitting.value = true;

    const result = await auth.login({
      identifier,
      password,
    });

    await redirectAfterLogin(result);
  } catch (error) {
    console.error("Login error:", error);

    errorMessage.value =
      error.response?.data?.message ||
      auth.error ||
      error.message ||
      "Login failed";
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div
    class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-3 py-6"
  >
    <Card class="w-full max-w-md shadow-lg">
      <template #title>
        <div class="text-center">
          <div
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <i class="pi pi-user text-2xl"></i>
          </div>

          <h1 class="text-2xl font-bold text-slate-900">
            {{ t("login.title") }}
          </h1>

          <p class="mt-2 text-sm font-normal text-slate-500">
            Log in with your username or email
          </p>
        </div>
      </template>

      <template #content>
        <form class="space-y-4" @submit.prevent="submit">
          <Message
            v-if="displayedError"
            severity="error"
            closable
            @close="
              errorMessage = '';
              auth.error = '';
            "
          >
            {{ displayedError }}
          </Message>

          <div>
            <label
              for="login-identifier"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              {{ t("login.fields.identifier") }}
            </label>

            <InputText
              id="login-identifier"
              v-model="form.identifier"
              type="text"
              class="w-full"
              :placeholder="t('login.placeholders.identifier')"
              autocomplete="username"
              :disabled="isLoading"
              required
              autofocus
            />
          </div>

          <div>
            <label
              for="login-password"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              {{ t("login.fields.password") }}
            </label>

            <Password
              id="login-password"
              v-model="form.password"
              class="w-full"
              input-class="w-full"
              :placeholder="t('login.placeholders.password')"
              autocomplete="current-password"
              :disabled="isLoading"
              toggleMask
              :feedback="false"
              required
            />
          </div>

          <Button
            type="submit"
            :label="t('login.loginButton')"
            icon="pi pi-sign-in"
            class="w-full"
            :loading="isLoading"
            :disabled="!isFormValid || isLoading"
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
