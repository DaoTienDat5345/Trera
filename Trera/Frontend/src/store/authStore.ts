import { create } from "zustand";
import { api } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateName: (name: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  setAuthData: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const savedUser = localStorage.getItem("trera_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem("trera_token") || null,
  isAuthenticated: !!localStorage.getItem("trera_token"),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token, message } = res.data;

      localStorage.setItem("trera_token", token);
      localStorage.setItem("trera_user", JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true, message };
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      return { success: false, message };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { user, token, message } = res.data;

      localStorage.setItem("trera_token", token);
      localStorage.setItem("trera_user", JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true, message };
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem("trera_token");
    localStorage.removeItem("trera_user");
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("trera_token");
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const res = await api.get("/auth/me");
      const user = res.data.user;
      localStorage.setItem("trera_user", JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  updateName: async (name) => {
    try {
      const res = await api.put("/auth/me", { name });
      const updatedUser = res.data.user;
      localStorage.setItem("trera_user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || "Cập nhật tên thất bại.";
      return { success: false, message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await api.put("/auth/me/password", { currentPassword, newPassword });
      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || "Đổi mật khẩu thất bại.";
      return { success: false, message };
    }
  },

  setAuthData: (user, token) => {
    localStorage.setItem("trera_token", token);
    localStorage.setItem("trera_user", JSON.stringify(user));
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));
