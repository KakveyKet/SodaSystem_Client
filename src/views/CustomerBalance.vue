<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Message from "primevue/message";

import api from "../services/api";
import { useAuthStore } from "../stores/auth";
import CustomerBottomNav from "../components/CustomerBottomNav.vue";

const router = useRouter();
const auth = useAuthStore();

const { t } = useI18n({
  useScope: "local",
  inheritLocale: true,
  messages: {
    en: {
      home: {
        title: "Home",
        welcome: "Welcome",
        balance: "Current Balance",
        refresh: "Refresh",
        hint: "Your balance includes deposits and invoice results.",
        error: "Could not load your balance",
      },
    },
    km: {
      home: {
        title: "ទំព័រដើម",
        welcome: "សូមស្វាគមន៍",
        balance: "សមតុល្យបច្ចុប្បន្ន",
        refresh: "ផ្ទុកឡើងវិញ",
        hint: "សមតុល្យរបស់អ្នករួមបញ្ចូលប្រាក់ដាក់ និងលទ្ធផលវិក្កយបត្រ។",
        error: "មិនអាចផ្ទុកសមតុល្យរបស់អ្នកបានទេ",
      },
    },
  },
});

const customer = ref(auth.customer || null);
const loading = ref(false);
const errorMessage = ref("");

const username = computed(() =>
  customer.value?.username ||
  auth.user?.username ||
  auth.user?.name ||
  "-",
);

const balance = computed(() => Number(customer.value?.balance || 0));

const formattedBalance = computed(() =>
  balance.value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }),
);

const balanceClass = computed(() =>
  balance.value < 0 ? "text-rose-100" : "text-white",
);

const saveCustomerLocally = (value) => {
  customer.value = value;
  auth.customer = value;
  localStorage.setItem("customer", JSON.stringify(value));
};

const fetchCustomerProfile = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await api.get("/customers/me");
    const value = response.data?.data || response.data?.customer || null;

    if (!value) {
      throw new Error(t("home.error"));
    }

    saveCustomerLocally(value);
  } catch (error) {
    console.error("Fetch customer home error:", error);

    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      t("home.error");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (auth.user?.role !== "customer") {
    await router.replace({ name: "dashboard" });
    return;
  }

  await fetchCustomerProfile();
});
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pt-6">
    <div class="mx-auto w-full max-w-3xl space-y-4">
      <div class="flex items-center justify-between gap-3 px-1">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">
            {{ t("home.title") }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ t("home.welcome") }}, {{ username }}
          </p>
        </div>

        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          severity="secondary"
          :aria-label="t('home.refresh')"
          :loading="loading"
          @click="fetchCustomerProfile"
        />
      </div>

      <Message
        v-if="errorMessage"
        severity="error"
        closable
        @close="errorMessage = ''"
      >
        {{ errorMessage }}
      </Message>

      <!-- Only the balance card remains on Home. -->
      <Card class="overflow-hidden">
        <template #content>
          <div
            class="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-6 text-white shadow-xl sm:p-8"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-emerald-100">
                  {{ t("home.balance") }}
                </p>

                <div v-if="loading" class="mt-5">
                  <i class="pi pi-spin pi-spinner text-3xl"></i>
                </div>

                <div
                  v-else
                  :class="[
                    'mt-3 break-all text-4xl font-black tracking-tight sm:text-5xl',
                    balanceClass,
                  ]"
                >
                  {{ formattedBalance }}
                </div>
              </div>

              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
              >
                <i class="pi pi-wallet text-2xl"></i>
              </div>
            </div>

            <p class="mt-8 border-t border-white/20 pt-4 text-sm text-emerald-100">
              {{ t("home.hint") }}
            </p>
          </div>
        </template>
      </Card>
    </div>

    <CustomerBottomNav />
  </main>
</template>

<style scoped>
:deep(.p-card-body),
:deep(.p-card-content) {
  padding: 0;
}
</style>
