import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: ''
  }),

  getters: {
    isAuthenticated: (state) => {
      return Boolean(state.token);
    },

    isAdmin: (state) => {
      return state.user?.role === 'admin';
    }
  },

  actions: {
    async login(credentials) {
      try {
        this.loading = true;
        this.error = '';

        const response = await api.post('/auth/login', {
          email: credentials.email,
          password: credentials.password
        });

        const token = response.data.token;
        const user = response.data.user;

        if (!token) {
          throw new Error('Token not found in login response');
        }

        this.token = token;
        this.user = user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
      } catch (error) {
        console.error('Login error:', error);

        this.error =
          error.response?.data?.message ||
          error.message ||
          'Login failed';

        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.user = null;
        this.token = null;
        this.error = '';

        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },

    loadAuthFromStorage() {
      this.token = localStorage.getItem('token');
      this.user = JSON.parse(localStorage.getItem('user')) || null;
    },

    clearError() {
      this.error = '';
    }
  }
});