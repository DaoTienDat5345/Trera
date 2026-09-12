import { create } from "zustand";
import { api } from "../lib/api";

export type IssueStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";

export interface IssueAssignee {
  user: { id: string; name: string; email: string };
}
export interface IssueLabel {
  label: string;
}
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string };
}
export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  order: number;
  dueDate: string | null;
  completedAt: string | null;
  sprintId: string | null;
  projectId: string;
  reporterId: string;
  reporter?: { id: string; name: string; email: string };
  assignees?: IssueAssignee[];
  labels?: IssueLabel[];
  comments?: Comment[];
  _count?: { comments: number };
  createdAt: string;
  updatedAt: string;
}
export interface IssueFilters {
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  sprintId?: string;
  backlog?: boolean;
  search?: string;
}

interface IssueState {
  issues: Issue[];
  currentIssue: Issue | null;
  isLoading: boolean;
  error: string | null;
  fetchIssues: (projectId: string, filters?: IssueFilters) => Promise<void>;
  fetchIssueById: (issueId: string) => Promise<Issue | null>;
  createIssue: (projectId: string, data: Partial<Issue> & { title: string; assigneeIds?: string[]; labels?: string[] }) => Promise<{ success: boolean; issue?: Issue; message?: string }>;
  updateIssue: (issueId: string, data: Partial<Issue> & { assigneeIds?: string[]; labels?: string[] }) => Promise<{ success: boolean; message?: string }>;
  deleteIssue: (issueId: string) => Promise<{ success: boolean; message?: string }>;
  reorderIssues: (projectId: string, updates: { id: string; order: number; status: IssueStatus }[]) => Promise<{ success: boolean; message?: string }>;
  setCurrentIssue: (issue: Issue | null) => void;
  addComment: (issueId: string, content: string) => Promise<{ success: boolean; message?: string }>;
  updateComment: (commentId: string, content: string) => Promise<{ success: boolean; message?: string }>;
  deleteComment: (commentId: string) => Promise<{ success: boolean; message?: string }>;
}

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: [],
  currentIssue: null,
  isLoading: false,
  error: null,

  fetchIssues: async (projectId, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.type) params.type = filters.type;
      if (filters.sprintId) params.sprintId = filters.sprintId;
      if (filters.backlog) params.backlog = "true";
      if (filters.search) params.search = filters.search;
      const res = await api.get(`/projects/${projectId}/issues`, { params });
      set({ issues: res.data.issues || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Không thể tải danh sách công việc.", isLoading: false });
    }
  },

  fetchIssueById: async (issueId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/issues/${issueId}`);
      const issue = res.data.issue;
      set({ currentIssue: issue, isLoading: false });
      return issue;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  createIssue: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/issues`, data);
      const newIssue = res.data.issue;
      set((state) => ({ issues: [...state.issues, newIssue] }));
      return { success: true, issue: newIssue, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Tạo công việc thất bại." };
    }
  },

  updateIssue: async (issueId, data) => {
    try {
      const res = await api.put(`/issues/${issueId}`, data);
      const updated = res.data.issue;
      set((state) => ({
        issues: state.issues.map((i) => (i.id === issueId ? { ...i, ...updated } : i)),
        currentIssue: state.currentIssue?.id === issueId ? { ...state.currentIssue, ...updated } : state.currentIssue,
      }));
      return { success: true, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Cập nhật công việc thất bại." };
    }
  },

  deleteIssue: async (issueId) => {
    try {
      await api.delete(`/issues/${issueId}`);
      set((state) => ({
        issues: state.issues.filter((i) => i.id !== issueId),
        currentIssue: state.currentIssue?.id === issueId ? null : state.currentIssue,
      }));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Xoá công việc thất bại." };
    }
  },

  reorderIssues: async (projectId, updates) => {
    const updatedMap = new Map(updates.map((u) => [u.id, u]));
    set((state) => ({
      issues: state.issues.map((i) => {
        const upd = updatedMap.get(i.id);
        return upd ? { ...i, order: upd.order, status: upd.status } : i;
      }),
    }));
    try {
      await api.patch(`/projects/${projectId}/issues/reorder`, { updates });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Cập nhật vị trí thất bại." };
    }
  },

  setCurrentIssue: (issue) => set({ currentIssue: issue }),

  addComment: async (issueId, content) => {
    try {
      const res = await api.post(`/issues/${issueId}/comments`, { content });
      const newComment = res.data.comment;
      set((state) => {
        if (state.currentIssue?.id === issueId) {
          return { currentIssue: { ...state.currentIssue, comments: [...(state.currentIssue.comments || []), newComment] } };
        }
        return {};
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Gửi bình luận thất bại." };
    }
  },

  updateComment: async (commentId, content) => {
    try {
      const res = await api.put(`/comments/${commentId}`, { content });
      const updated = res.data.comment;
      set((state) => {
        if (state.currentIssue) {
          return { currentIssue: { ...state.currentIssue, comments: state.currentIssue.comments?.map((c) => (c.id === commentId ? updated : c)) } };
        }
        return {};
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Chỉnh sửa bình luận thất bại." };
    }
  },

  deleteComment: async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      set((state) => {
        if (state.currentIssue) {
          return { currentIssue: { ...state.currentIssue, comments: state.currentIssue.comments?.filter((c) => c.id !== commentId) } };
        }
        return {};
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Xoá bình luận thất bại." };
    }
  },
}));
