import { create } from "zustand";
import { api } from "../lib/api";

export interface ProjectMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  key: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  members?: ProjectMember[];
  _count?: {
    issues: number;
    sprints: number;
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<Project | null>;
  createProject: (data: { name: string; key: string; description?: string }) => Promise<{ success: boolean; project?: Project; message?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; message?: string }>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get("/projects");
      set({ projects: res.data.projects || [], isLoading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể tải danh sách dự án.";
      set({ error: msg, isLoading: false });
    }
  },

  getProjectById: async (id: string) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/projects/${id}`);
      const project = res.data.project;
      set({ currentProject: project, isLoading: false });
      return project;
    } catch (error: any) {
      set({ isLoading: false });
      return null;
    }
  },

  createProject: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/projects", data);
      const newProject = res.data.project;
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }));
      return { success: true, project: newProject, message: res.data.message };
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Tạo dự án thất bại.";
      return { success: false, message };
    }
  },

  deleteProject: async (id: string) => {
    try {
      const res = await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || "Xoá dự án thất bại.";
      return { success: false, message };
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
