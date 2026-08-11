<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import Button from "primevue/button";
import Card from "primevue/card";
import Message from "primevue/message";
import Tag from "primevue/tag";

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
      profile: {
        title: "Profile",
        subtitle: "Your customer account details",
        username: "Username",
        email: "Email",
        branch: "Branch",
        phone: "Phone",
        address: "Address",
        description: "Description",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
        refresh: "Refresh",
        logout: "Logout",
        error: "Could not load your profile",
      },
    },
    km: {
      profile: {
        title: "ប្រវត្តិរូប",
        subtitle: "ព័ត៌មានគណនីអតិថិជនរបស់អ្នក",
        username: "ឈ្មោះអ្នកប្រើប្រាស់",
        email: "អ៊ីមែល",
        branch: "សាខា",
        phone: "ទូរស័ព្ទ",
        address: "អាសយដ្ឋាន",
        description: "បរិយាយ",
        status: "ស្ថានភាព",
        active: "សកម្ម",
        inactive: "អសកម្ម",
        refresh: "ផ្ទុកឡើងវិញ",
        logout: "ចាកចេញ",
        error: "មិនអាចផ្ទុកប្រវត្តិរូបរបស់អ្នកបានទេ",
      },
    },
  },
});

const customer = ref(auth.customer || null);
const loading = ref(false);
const errorMessage = ref("");

const user = computed(() => auth.user || null);

const username = computed(() =>
  customer.value?.username || user.value?.username || user.value?.name || "-",
);

const email = computed(() =>
  customer.value?.email || user.value?.email || "-",
);

const accountActive = computed(() =>
  Boolean(customer.value?.status !== false && user.value?.status !== false),
);

const rows = computed(() => [
  { key: "username", label: t("profile.username"), value: username.value },
  { key: "email", label: t("profile.email"), value: email.value },
  { key: "branch", label: t("profile.branch"), value: customer.value?.branchId || "-" },
  { key: "phone", label: t("profile.phone"), value: customer.value?.phoneNumber || "-" },
  { key: "address", label: t("profile.address"), value: customer.value?.address || "-" },
  { key: "description", label: t("profile.description"), value: customer.value?.description || "-" },
]);

const saveCustomerLocally = (value) => {
  customer.value = value;
  auth.customer = value;
  localStorage.setItem("customer", JSON.stringify(value));
};

const fetchProfile = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await api.get("/customers/me");
    const value = response.data?.data || response.data?.customer || null;

    if (!value) {
      throw new Error(t("profile.error"));
    }

    saveCustomerLocally(value);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || error.message || t("profile.error");
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  auth.logout();
  await router.replace({ name: "login" });
};

onMounted(fetchProfile);
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pt-6">
    <div class="mx-auto w-full max-w-3xl space-y-4">
      <div class="flex items-center justify-between gap-3 px-1">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">
            {{ t("profile.title") }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ t("profile.subtitle") }}
          </p>
        </div>

        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          severity="secondary"
          :aria-label="t('profile.refresh')"
          :loading="loading"
          @click="fetchProfile"
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

      <!-- One consolidated Profile card, instead of two Home information cards. -->
      <Card>
        <template #content>
          <div class="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <i class="pi pi-user text-2xl"></i>
            </div>

            <div class="min-w-0 flex-1">
              <h2 class="truncate text-xl font-black text-slate-900">
                {{ username }}
              </h2>
              <p class="mt-1 truncate text-sm text-slate-500">
                {{ email }}
              </p>
            </div>

            <Tag
              :value="accountActive ? t('profile.active') : t('profile.inactive')"
              :severity="accountActive ? 'success' : 'danger'"
            />
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="item in rows"
              :key="item.key"
              class="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[170px_minmax(0,1fr)]"
            >
              <span class="text-sm font-medium text-slate-500">
                {{ item.label }}
              </span>
              <span class="break-words text-right font-semibold text-slate-800">
                {{ item.value }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <Button
        :label="t('profile.logout')"
        icon="pi pi-sign-out"
        severity="danger"
        outlined
        class="w-full"
        @click="logout"
      />
    </div>

    <CustomerBottomNav />
  </main>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 1rem;
}

:deep(.p-card-content) {
  padding: 0;
}
</style>
