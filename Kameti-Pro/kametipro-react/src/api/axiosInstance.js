import axios from 'axios';

/**
 * Central Axios instance.
 * Base URL is driven entirely by the VITE_API_BASE_URL environment variable.
 *   - Local dev  → .env              → http://localhost:5000/api
 *   - Production → .env.production   → https://haider-fa-23-092-sec-b-awt.vercel.app/api
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
