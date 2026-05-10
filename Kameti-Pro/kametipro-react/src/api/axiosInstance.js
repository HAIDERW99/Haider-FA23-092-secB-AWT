import axios from 'axios';

/**
 * Central Axios instance.
 * Base URL points at the local Express backend.
 * Set VITE_API_BASE_URL in .env to override (e.g. for production).
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT when available ───────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — keep the original AxiosError intact ───────────────
// IMPORTANT: Do NOT convert to a plain Error here.
// Components need error.response?.data?.message to show server messages.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log in dev for easy debugging
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url:     error.config?.url,
        status:  error.response?.status,
        data:    error.response?.data,
        message: error.message,
      });
    }
    // Re-throw the original AxiosError — callers can read error.response.data
    return Promise.reject(error);
  }
);

export default axiosInstance;
