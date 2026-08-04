<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Message from 'primevue/message';

import api from '../services/api';

const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);

const errorMessage = ref('');
const successMessage = ref('');

const form = ref({
  name: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

/*
|--------------------------------------------------------------------------
| Load current profile
|--------------------------------------------------------------------------
*/

const loadProfile = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const response = await api.get(
      '/users/me'
    );

    const user =
      response.data?.data ||
      response.data?.user ||
      response.data ||
      {};

    form.value.name =
      user.name || '';

    form.value.email =
      user.email || '';
  } catch (error) {
    console.error(
      'Load profile error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      t('profile.errors.load');
  } finally {
    loading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Validate profile form
|--------------------------------------------------------------------------
*/

const validateForm = () => {
  if (!form.value.name.trim()) {
    return t(
      'profile.errors.nameRequired'
    );
  }

  if (!form.value.email.trim()) {
    return t(
      'profile.errors.emailRequired'
    );
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      form.value.email.trim()
    )
  ) {
    return t(
      'profile.errors.emailInvalid'
    );
  }

  const isChangingPassword =
    Boolean(
      form.value.currentPassword ||
      form.value.newPassword ||
      form.value.confirmPassword
    );

  if (isChangingPassword) {
    if (
      !form.value.currentPassword
    ) {
      return t(
        'profile.errors.currentPasswordRequired'
      );
    }

    if (!form.value.newPassword) {
      return t(
        'profile.errors.newPasswordRequired'
      );
    }

    if (
      form.value.newPassword.length <
      6
    ) {
      return t(
        'profile.errors.newPasswordMin'
      );
    }

    if (
      !form.value.confirmPassword
    ) {
      return t(
        'profile.errors.confirmPasswordRequired'
      );
    }

    if (
      form.value.newPassword !==
      form.value.confirmPassword
    ) {
      return t(
        'profile.errors.confirmPasswordMismatch'
      );
    }

    if (
      form.value.currentPassword ===
      form.value.newPassword
    ) {
      return t(
        'profile.errors.passwordMustBeDifferent'
      );
    }
  }

  return '';
};

/*
|--------------------------------------------------------------------------
| Update current profile
|--------------------------------------------------------------------------
*/

const updateProfile = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';

    const validationError =
      validateForm();

    if (validationError) {
      errorMessage.value =
        validationError;

      return;
    }

    saving.value = true;

    const payload = {
      name:
        form.value.name.trim(),

      email:
        form.value.email
          .trim()
          .toLowerCase()
    };

    if (
      form.value.currentPassword &&
      form.value.newPassword
    ) {
      payload.currentPassword =
        form.value.currentPassword;

      payload.newPassword =
        form.value.newPassword;
    }

    const response = await api.put(
      '/users/profile',
      payload
    );

    form.value.currentPassword = '';
    form.value.newPassword = '';
    form.value.confirmPassword = '';

    successMessage.value =
      response.data?.message ||
      t('profile.messages.updated');

    await loadProfile();
  } catch (error) {
    console.error(
      'Update profile error:',
      error
    );

    errorMessage.value =
      error.response?.data?.message ||
      t('profile.errors.update');
  } finally {
    saving.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div
    class="mx-auto w-full max-w-2xl p-2 sm:p-4 lg:p-6"
  >
    <Card>
      <template #title>
        <div
          class="flex items-center gap-3"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
          >
            <i class="pi pi-user"></i>
          </div>

          <span>
            {{ t('profile.title') }}
          </span>
        </div>
      </template>

      <template #subtitle>
        {{ t('profile.subtitle') }}
      </template>

      <template #content>
        <Message
          v-if="errorMessage"
          severity="error"
          class="mb-4"
          closable
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </Message>

        <Message
          v-if="successMessage"
          severity="success"
          class="mb-4"
          closable
          @close="successMessage = ''"
        >
          {{ successMessage }}
        </Message>

        <div
          v-if="loading"
          class="py-8 text-center text-gray-500"
        >
          <i
            class="pi pi-spin pi-spinner text-2xl text-primary"
          ></i>

          <p class="mt-2 text-sm">
            {{ t('profile.loading') }}
          </p>
        </div>

        <form
          v-else
          class="space-y-4"
          @submit.prevent="updateProfile"
        >
          <section
            class="space-y-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
          >
            <div>
              <label
                for="profile-name"
                class="mb-1 block font-medium text-gray-700"
              >
                {{ t('profile.fields.name') }}
              </label>

              <InputText
                id="profile-name"
                v-model="form.name"
                class="w-full"
                :placeholder="
                  t('profile.placeholders.name')
                "
                autocomplete="name"
              />
            </div>

            <div>
              <label
                for="profile-email"
                class="mb-1 block font-medium text-gray-700"
              >
                {{ t('profile.fields.email') }}
              </label>

              <InputText
                id="profile-email"
                v-model="form.email"
                type="email"
                class="w-full"
                :placeholder="
                  t('profile.placeholders.email')
                "
                autocomplete="email"
              />
            </div>
          </section>

          <section
            class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
          >
            <div class="mb-4">
              <div
                class="font-semibold text-gray-900"
              >
                {{
                  t(
                    'profile.changePassword.title'
                  )
                }}
              </div>

              <div
                class="mt-1 text-sm text-gray-500"
              >
                {{
                  t(
                    'profile.changePassword.description'
                  )
                }}
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label
                  for="current-password"
                  class="mb-1 block font-medium text-gray-700"
                >
                  {{
                    t(
                      'profile.fields.currentPassword'
                    )
                  }}
                </label>

                <Password
                  id="current-password"
                  v-model="
                    form.currentPassword
                  "
                  class="w-full"
                  input-class="w-full"
                  :placeholder="
                    t(
                      'profile.placeholders.currentPassword'
                    )
                  "
                  toggleMask
                  :feedback="false"
                  autocomplete="current-password"
                />
              </div>

              <div>
                <label
                  for="new-password"
                  class="mb-1 block font-medium text-gray-700"
                >
                  {{
                    t(
                      'profile.fields.newPassword'
                    )
                  }}
                </label>

                <Password
                  id="new-password"
                  v-model="
                    form.newPassword
                  "
                  class="w-full"
                  input-class="w-full"
                  :placeholder="
                    t(
                      'profile.placeholders.newPassword'
                    )
                  "
                  toggleMask
                  autocomplete="new-password"
                />
              </div>

              <div>
                <label
                  for="confirm-password"
                  class="mb-1 block font-medium text-gray-700"
                >
                  {{
                    t(
                      'profile.fields.confirmPassword'
                    )
                  }}
                </label>

                <Password
                  id="confirm-password"
                  v-model="
                    form.confirmPassword
                  "
                  class="w-full"
                  input-class="w-full"
                  :placeholder="
                    t(
                      'profile.placeholders.confirmPassword'
                    )
                  "
                  toggleMask
                  :feedback="false"
                  autocomplete="new-password"
                />
              </div>
            </div>
          </section>

          <div
            class="flex justify-end"
          >
            <Button
              type="submit"
              :label="t('profile.save')"
              icon="pi pi-save"
              :loading="saving"
              :disabled="loading"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 1rem;
}

:deep(.p-inputtext),
:deep(.p-password),
:deep(.p-password-input) {
  width: 100%;
  min-height: 44px;
}

:deep(.p-button) {
  min-height: 42px;
}

@media (min-width: 640px) {
  :deep(.p-card-body) {
    padding: 1.5rem;
  }
}
</style>