import { defineStore } from "pinia";

import api from "../services/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const CUSTOMER_KEY = "customer";

const readJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const setAuthorizationHeader = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const useAuthStore = defineStore("auth", {
  state: () => {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const user = readJson(USER_KEY);
    const customer = readJson(CUSTOMER_KEY);

    setAuthorizationHeader(token);

    return {
      token,
      user,
      customer,
      loading: false,
      error: "",
    };
  },

  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    role: (state) => state.user?.role || null,
    isAdmin: (state) => state.user?.role === "admin",
    isCustomer: (state) => state.user?.role === "customer",
  },

  actions: {
    persistSession(token, user, customer = null) {
      this.token = token;
      this.user = user;
      this.customer = customer;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      if (customer) {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(CUSTOMER_KEY);
      }

      setAuthorizationHeader(token);
    },

    clearSession() {
      this.token = "";
      this.user = null;
      this.customer = null;
      this.error = "";

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(CUSTOMER_KEY);

      setAuthorizationHeader("");
    },

    async login(credentials, optionalPassword = "") {
      this.loading = true;
      this.error = "";

      try {
        const values =
          typeof credentials === "string"
            ? {
                identifier: credentials,
                password: optionalPassword,
              }
            : credentials || {};

        const identifier = String(
          values.identifier || values.username || values.email || "",
        )
          .trim()
          .toLowerCase();

        const password = String(values.password || "");

        if (!identifier) {
          throw new Error("Username or email is required");
        }

        if (!password) {
          throw new Error("Password is required");
        }

        const response = await api.post("/auth/login", {
          identifier,
          password,
        });

        const token =
          response.data?.token || response.data?.data?.token || "";
        const user =
          response.data?.data?.user || response.data?.user || null;
        const customer =
          response.data?.data?.customer || response.data?.customer || null;

        if (!token || !user) {
          throw new Error("Invalid login response from the backend");
        }

        this.persistSession(token, user, customer);

        return {
          token,
          user,
          customer,
          response: response.data,
        };
      } catch (error) {
        this.error =
          error.response?.data?.message || error.message || "Login failed";

        console.error("Login error:", error.response?.data || error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCurrentUser() {
      if (!this.token) {
        return null;
      }

      this.loading = true;
      this.error = "";

      try {
        setAuthorizationHeader(this.token);

        const response = await api.get("/auth/me");
        const user =
          response.data?.data?.user || response.data?.user || null;
        const customer =
          response.data?.data?.customer || response.data?.customer || null;

        if (!user) {
          throw new Error("Invalid account response from the backend");
        }

        this.persistSession(this.token, user, customer);

        return { user, customer };
      } catch (error) {
        this.clearSession();
        this.error =
          error.response?.data?.message ||
          error.message ||
          "Could not load account";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.clearSession();
    },
  },
});

export default useAuthStore;
