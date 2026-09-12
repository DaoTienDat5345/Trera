import { create } from "zustand";
import { api } from "../lib/api";

export type SprintStatus = "PLANNING" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { issues: number };
  issueStats?: { todo: number; inProgress: number; done: number; total: number };
}

interface SprintState {
  sprints: Sprint[];
  isLoading: boolean;
  error: string | null;
  fetchSprints: (projectId: string) => Promise<void>;
  createSprint: (projectId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }) => Promise<{ success: boolean; sprint?: Sprint; message?: string }>;
  updateSprint: (projectId: string, sprintId: string, data: { name?: string; goal?: string; startDate?: string; endDate?: string }) => Promise<{ success: boolean; message?: string }>;
  startSprint: (projectId: string, sprintId: string) => Promise<{ success: boolean; message?: string }>;
  completeSprint: (projectId: string, sprintId: string) => Promise<{ success: boolean; message?: string }>;
  deleteSprint: (projectId: string, sprintId: string) => Promise<{ success: boolean; message?: string }>;
}

export const useSprintStore = create<SprintState>((set) => ({
  sprints: [],
  isLoading: false,
  error: null,

  fetchSprints: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/projects/${projectId}/sprints`);
      set({ sprints: res.data.sprints || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Không thể tải danh sách sprint.", isLoading: false });
    }
  },

  createSprint: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/sprints`, data);
      const newSprint = res.data.sprint;
      set((state) => ({ sprints: [...state.sprints, newSprint] }));
      return { success: true, sprint: newSprint, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Tạo sprint thất bại." };
    }
  },

  updateSprint: async (projectId, sprintId, data) => {
    try {
      const res = await api.put(`/projects/${projectId}/sprints/${sprintId}`, data);
      set((state) => ({ sprints: state.sprints.map((s) => (s.id === sprintId ? res.data.sprint : s)) }));
      return { success: true, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Cập nhật sprint thất bại." };
    }
  },

  startSprint: async (projectId, sprintId) => {
    try {
      const res = await api.patch(`/projects/${projectId}/sprints/${sprintId}/start`);
      set((state) => ({ sprints: state.sprints.map((s) => (s.id === sprintId ? res.data.sprint : s)) }));
      return { success: true, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Không thể bắt đầu sprint." };
    }
  },

  completeSprint: async (projectId, sprintId) => {
    try {
      const res = await api.patch(`/projects/${projectId}/sprints/${sprintId}/complete`);
      set((state) => ({ sprints: state.sprints.map((s) => (s.id === sprintId ? res.data.sprint : s)) }));
      return { success: true, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Không thể hoàn thành sprint." };
    }
  },

  deleteSprint: async (projectId, sprintId) => {
    try {
      await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
      set((state) => ({ sprints: state.sprints.filter((s) => s.id !== sprintId) }));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Xoá sprint thất bại." };
    }
  },
}));
