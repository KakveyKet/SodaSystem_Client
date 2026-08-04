import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json'
  },

  timeout: 30000
});

/*
|--------------------------------------------------------------------------
| Attach JWT token to every request
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token');

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    } else if (config.headers) {
      delete config.headers.Authorization;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| Handle authentication errors
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url || '';

    const isLoginRequest =
      requestUrl.includes(
        '/auth/login'
      );

    if (
      status === 401 &&
      !isLoginRequest
    ) {
      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );

      delete api.defaults.headers
        .common.Authorization;
    }

    return Promise.reject(error);
  }
);

export default api;