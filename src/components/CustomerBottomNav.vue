<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const router = useRouter();

const { t } = useI18n({
  useScope: "local",
  inheritLocale: true,
  messages: {
    en: {
      nav: {
        report: "Report",
        invoice: "Invoice",
        home: "Home",
        profile: "Profile",
      },
    },
    km: {
      nav: {
        report: "របាយការណ៍",
        invoice: "វិក្កយបត្រ",
        home: "ទំព័រដើម",
        profile: "ប្រវត្តិរូប",
      },
    },
  },
});

const items = computed(() => [
  {
    name: "customer-report",
    label: t("nav.report"),
    icon: "pi pi-chart-bar",
  },
  {
    name: "customer-invoices",
    label: t("nav.invoice"),
    icon: "pi pi-file",
  },
  {
    name: "customer-home",
    label: t("nav.home"),
    icon: "pi pi-home",
  },
  {
    name: "customer-profile",
    label: t("nav.profile"),
    icon: "pi pi-user",
  },
]);

const isActive = (name) => route.name === name;

const open = async (name) => {
  if (route.name === name) {
    return;
  }

  await router.push({ name });
};
</script>

<template>
  <nav class="customer-bottom-nav" aria-label="Customer navigation">
    <div class="customer-bottom-nav-inner">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        :class="[
          'customer-nav-item',
          { 'customer-nav-item-active': isActive(item.name) },
        ]"
        @click="open(item.name)"
      >
        <span class="customer-nav-icon-wrap">
          <i :class="item.icon"></i>
        </span>

        <span class="customer-nav-label">
          {{ item.label }}
        </span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.customer-bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20000;
  padding: 0 10px calc(8px + env(safe-area-inset-bottom));
  pointer-events: none;
}

.customer-bottom-nav-inner {
  width: min(680px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 7px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 -4px 24px rgb(15 23 42 / 0.12);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.customer-nav-item {
  min-width: 0;
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.customer-nav-item:hover {
  background: #f8fafc;
}

.customer-nav-item:active {
  transform: scale(0.98);
}

.customer-nav-item-active {
  background: #ecfdf5;
  color: #059669;
}

.customer-nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
}

.customer-nav-label {
  max-width: 100%;
  padding: 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
}

@media (min-width: 640px) {
  .customer-bottom-nav {
    padding-bottom: 12px;
  }

  .customer-bottom-nav-inner {
    padding: 8px;
  }

  .customer-nav-item {
    min-height: 62px;
  }

  .customer-nav-label {
    font-size: 12px;
  }
}
</style>
