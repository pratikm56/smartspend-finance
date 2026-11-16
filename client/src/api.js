import axios from 'axios';

// Create configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartspend_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401/403 session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If unauthorized and has token, session may have expired
      if (localStorage.getItem('smartspend_token') && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/verify-email')) {
        localStorage.removeItem('smartspend_token');
        localStorage.removeItem('smartspend_user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
