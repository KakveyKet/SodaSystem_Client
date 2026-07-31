<script setup>
import { onMounted, ref } from 'vue';

import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Message from 'primevue/message';

import api from '../services/api';

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

const loadProfile = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const response = await api.get('/users/me');
    const user = response.data.data || response.data.user || response.data;

    form.value.name = user.name || '';
    form.value.email = user.email || '';
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error.response?.data?.message || 'Could not load profile';
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  if (!form.value.name.trim()) {
    return 'Name is required';
  }

  if (!form.value.email.trim()) {
    return 'Email is required';
  }

  if (
    form.value.currentPassword ||
    form.value.newPassword ||
    form.value.confirmPassword
  ) {
    if (!form.value.currentPassword) {
      return 'Current password is required';
    }

    if (!form.value.newPassword) {
      return 'New password is required';
    }

    if (form.value.newPassword.length < 6) {
      return 'New password must be at least 6 characters';
    }

    if (form.value.newPassword !== form.value.confirmPassword) {
      return 'Confirm password does not match';
    }
  }

  return '';
};

const updateProfile = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';

    const validationError = validateForm();

    if (validationError) {
      errorMessage.value = validationError;
      return;
    }

    saving.value = true;

    const payload = {
      name: form.value.name.trim(),
      email: form.value.email.trim()
    };

    if (form.value.currentPassword && form.value.newPassword) {
      payload.currentPassword = form.value.currentPassword;
      payload.newPassword = form.value.newPassword;
    }

    await api.put('/users/profile', payload);

    form.value.currentPassword = '';
    form.value.newPassword = '';
    form.value.confirmPassword = '';

    successMessage.value = 'Profile updated successfully';

    await loadProfile();
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error.response?.data?.message || 'Could not update profile';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <Card>
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-user"></i>
          <span>Profile</span>
        </div>
      </template>

      <template #content>
        <Message
          v-if="errorMessage"
          severity="error"
          class="mb-4"
        >
          {{ errorMessage }}
        </Message>

        <Message
          v-if="successMessage"
          severity="success"
          class="mb-4"
        >
          {{ successMessage }}
        </Message>

        <div
          v-if="loading"
          class="py-6 text-center text-gray-500"
        >
          Loading profile...
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div>
            <label class="mb-1 block font-medium">
              Name
            </label>

            <InputText
              v-model="form.name"
              class="w-full"
              placeholder="Name"
            />
          </div>

          <div>
            <label class="mb-1 block font-medium">
              Email
            </label>

            <InputText
              v-model="form.email"
              class="w-full"
              placeholder="Email"
            />
          </div>

          <div class="border-t pt-4">
            <div class="mb-3 font-semibold">
              Change Password
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1 block font-medium">
                  Current Password
                </label>

                <Password
                  v-model="form.currentPassword"
                  class="w-full"
                  input-class="w-full"
                  placeholder="Current password"
                  toggleMask
                  :feedback="false"
                />
              </div>

              <div>
                <label class="mb-1 block font-medium">
                  New Password
                </label>

                <Password
                  v-model="form.newPassword"
                  class="w-full"
                  input-class="w-full"
                  placeholder="New password"
                  toggleMask
                />
              </div>

              <div>
                <label class="mb-1 block font-medium">
                  Confirm Password
                </label>

                <Password
                  v-model="form.confirmPassword"
                  class="w-full"
                  input-class="w-full"
                  placeholder="Confirm password"
                  toggleMask
                  :feedback="false"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              label="Save"
              icon="pi pi-save"
              :loading="saving"
              @click="updateProfile"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>