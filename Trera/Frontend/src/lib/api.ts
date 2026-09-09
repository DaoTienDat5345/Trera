import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động gắn JWT token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("trera_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý tự động khi token hết hạn (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Bỏ qua nếu đang gọi login hoặc register
      const requestUrl = error.config?.url || "";
      if (!requestUrl.includes("/auth/login") && !requestUrl.includes("/auth/register")) {
        localStorage.removeItem("trera_token");
        localStorage.removeItem("trera_user");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
