import { create } from "zustand";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";

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
export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId?: string | null;
  issueId: string;
  checklistItemId?: string | null;
  uploader?: { id: string; name: string; avatar?: string | null };
  createdAt: string;
}
export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  issueId: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
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
  checklistItems?: ChecklistItem[];
  attachments?: Attachment[];
  _count?: { comments?: number; attachments?: number };
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

  // Checklist actions
  addChecklistItem: (issueId: string, title: string) => Promise<{ success: boolean; item?: ChecklistItem; message?: string }>;
  updateChecklistItem: (itemId: string, data: { title?: string; isCompleted?: boolean; order?: number }) => Promise<{ success: boolean; item?: ChecklistItem; message?: string }>;
  deleteChecklistItem: (itemId: string) => Promise<{ success: boolean; message?: string }>;

  // Attachment actions
  uploadAttachment: (issueId: string, file: File, checklistItemId?: string) => Promise<{ success: boolean; attachment?: Attachment; message?: string }>;
  deleteAttachment: (attachmentId: string) => Promise<{ success: boolean; message?: string }>;

  // Real-time Socket.io handlers
  handleRealtimeIssueCreated: (issue: Issue) => void;
  handleRealtimeIssueUpdated: (issue: Issue) => void;
  handleRealtimeIssueDeleted: (issueId: string) => void;
  handleRealtimeIssueReordered: (updates: { id: string; status?: IssueStatus; order?: number }[]) => void;
  handleRealtimeCommentCreated: (issueId: string, comment: Comment) => void;
  handleRealtimeChecklistCreated: (issueId: string, item: ChecklistItem) => void;
  handleRealtimeChecklistUpdated: (issueId: string, item: ChecklistItem) => void;
  handleRealtimeChecklistDeleted: (issueId: string, itemId: string) => void;
  handleRealtimeAttachmentCreated: (issueId: string, attachment: Attachment) => void;
  handleRealtimeAttachmentDeleted: (issueId: string, attachmentId: string) => void;
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
      const socket = getSocket();
      await api.patch(`/projects/${projectId}/issues/reorder`, {
        updates,
        clientSocketId: socket.connected ? socket.id : undefined,
      });
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

  addChecklistItem: async (issueId, title) => {
    try {
      const res = await api.post(`/issues/${issueId}/checklist`, { title });
      const item = res.data.item;
      set((state) => {
        const updateChecklist = (iss: Issue) => ({
          ...iss,
          checklistItems: [...(iss.checklistItems || []), item],
        });
        return {
          issues: state.issues.map((i) => (i.id === issueId ? updateChecklist(i) : i)),
          currentIssue: state.currentIssue?.id === issueId ? updateChecklist(state.currentIssue) : state.currentIssue,
        };
      });
      return { success: true, item };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Thêm việc con thất bại." };
    }
  },

  updateChecklistItem: async (itemId, data) => {
    try {
      const res = await api.put(`/checklist/${itemId}`, data);
      const updated = res.data.item;
      set((state) => {
        const updateChecklist = (iss: Issue) => ({
          ...iss,
          checklistItems: iss.checklistItems?.map((c) => (c.id === itemId ? updated : c)),
        });
        return {
          issues: state.issues.map((i) => updateChecklist(i)),
          currentIssue: state.currentIssue ? updateChecklist(state.currentIssue) : null,
        };
      });
      return { success: true, item: updated };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Cập nhật việc con thất bại." };
    }
  },

  deleteChecklistItem: async (itemId) => {
    try {
      await api.delete(`/checklist/${itemId}`);
      set((state) => {
        const updateChecklist = (iss: Issue) => ({
          ...iss,
          checklistItems: iss.checklistItems?.filter((c) => c.id !== itemId),
        });
        return {
          issues: state.issues.map((i) => updateChecklist(i)),
          currentIssue: state.currentIssue ? updateChecklist(state.currentIssue) : null,
        };
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Xoá việc con thất bại." };
    }
  },

  uploadAttachment: async (issueId, file, checklistItemId) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (checklistItemId) {
        formData.append("checklistItemId", checklistItemId);
      }
      const res = await api.post(`/issues/${issueId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const attachment = res.data.attachment;
      set((state) => {
        const updateAttachments = (iss: Issue) => {
          const newAttachments = [attachment, ...(iss.attachments || [])];
          const newChecklist = iss.checklistItems?.map((item) => {
            if (item.id === checklistItemId) {
              return {
                ...item,
                attachments: [attachment, ...(item.attachments || [])],
              };
            }
            return item;
          });
          return {
            ...iss,
            attachments: newAttachments,
            checklistItems: newChecklist,
            _count: {
              ...iss._count,
              attachments: (iss._count?.attachments || 0) + 1,
            },
          };
        };
        return {
          issues: state.issues.map((i) => (i.id === issueId ? updateAttachments(i) : i)),
          currentIssue: state.currentIssue?.id === issueId ? updateAttachments(state.currentIssue) : state.currentIssue,
        };
      });
      return { success: true, attachment };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Tải lên tệp thất bại." };
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      await api.delete(`/attachments/${attachmentId}`);
      set((state) => {
        const updateAttachments = (iss: Issue) => ({
          ...iss,
          attachments: iss.attachments?.filter((a) => a.id !== attachmentId),
          checklistItems: iss.checklistItems?.map((item) => ({
            ...item,
            attachments: item.attachments?.filter((a) => a.id !== attachmentId),
          })),
          _count: {
            ...iss._count,
            attachments: Math.max(0, (iss._count?.attachments || 1) - 1),
          },
        });
        return {
          issues: state.issues.map((i) => updateAttachments(i)),
          currentIssue: state.currentIssue ? updateAttachments(state.currentIssue) : null,
        };
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Xoá tệp thất bại." };
    }
  },

  handleRealtimeIssueCreated: (newIssue: Issue) => {
    set((state) => {
      if (state.issues.some((i) => i.id === newIssue.id)) return state;
      return { issues: [newIssue, ...state.issues] };
    });
  },

  handleRealtimeIssueUpdated: (updatedIssue: Issue) => {
    set((state) => ({
      issues: state.issues.map((i) => (i.id === updatedIssue.id ? { ...i, ...updatedIssue } : i)),
      currentIssue:
        state.currentIssue && state.currentIssue.id === updatedIssue.id
          ? { ...state.currentIssue, ...updatedIssue }
          : state.currentIssue,
    }));
  },

  handleRealtimeIssueDeleted: (issueId: string) => {
    set((state) => ({
      issues: state.issues.filter((i) => i.id !== issueId),
      currentIssue: state.currentIssue?.id === issueId ? null : state.currentIssue,
    }));
  },

  handleRealtimeIssueReordered: (updates: { id: string; status?: IssueStatus; order?: number }[]) => {
    set((state) => {
      const updateMap = new Map(updates.map((u) => [u.id, u]));
      const newIssues = state.issues.map((issue) => {
        const up = updateMap.get(issue.id);
        if (up) {
          return {
            ...issue,
            ...(up.status !== undefined ? { status: up.status } : {}),
            ...(up.order !== undefined ? { order: up.order } : {}),
          };
        }
        return issue;
      });
      return { issues: newIssues };
    });
  },

  handleRealtimeCommentCreated: (issueId: string, comment: Comment) => {
    set((state) => {
      if (state.currentIssue && state.currentIssue.id === issueId) {
        const exists = state.currentIssue.comments?.some((c) => c.id === comment.id);
        if (!exists) {
          return {
            currentIssue: {
              ...state.currentIssue,
              comments: [...(state.currentIssue.comments || []), comment],
              _count: {
                comments: (state.currentIssue._count?.comments || 0) + 1,
              },
            },
          };
        }
      }
      return state;
    });
  },

  handleRealtimeChecklistCreated: (issueId, item) => {
    set((state) => {
      const updateChecklist = (iss: Issue) => {
        if (iss.checklistItems?.some((c) => c.id === item.id)) return iss;
        return { ...iss, checklistItems: [...(iss.checklistItems || []), item] };
      };
      return {
        issues: state.issues.map((i) => (i.id === issueId ? updateChecklist(i) : i)),
        currentIssue: state.currentIssue?.id === issueId ? updateChecklist(state.currentIssue) : state.currentIssue,
      };
    });
  },

  handleRealtimeChecklistUpdated: (issueId, item) => {
    set((state) => {
      const updateChecklist = (iss: Issue) => ({
        ...iss,
        checklistItems: iss.checklistItems?.map((c) => (c.id === item.id ? { ...c, ...item } : c)),
      });
      return {
        issues: state.issues.map((i) => (i.id === issueId ? updateChecklist(i) : i)),
        currentIssue: state.currentIssue?.id === issueId ? updateChecklist(state.currentIssue) : state.currentIssue,
      };
    });
  },

  handleRealtimeChecklistDeleted: (issueId, itemId) => {
    set((state) => {
      const updateChecklist = (iss: Issue) => ({
        ...iss,
        checklistItems: iss.checklistItems?.filter((c) => c.id !== itemId),
      });
      return {
        issues: state.issues.map((i) => (i.id === issueId ? updateChecklist(i) : i)),
        currentIssue: state.currentIssue?.id === issueId ? updateChecklist(state.currentIssue) : state.currentIssue,
      };
    });
  },

  handleRealtimeAttachmentCreated: (issueId, attachment) => {
    set((state) => {
      const updateAttachments = (iss: Issue) => {
        if (iss.attachments?.some((a) => a.id === attachment.id)) return iss;
        const newAttachments = [attachment, ...(iss.attachments || [])];
        const newChecklist = iss.checklistItems?.map((item) => {
          if (item.id === attachment.checklistItemId) {
            return {
              ...item,
              attachments: [attachment, ...(item.attachments || [])],
            };
          }
          return item;
        });
        return {
          ...iss,
          attachments: newAttachments,
          checklistItems: newChecklist,
          _count: {
            ...iss._count,
            attachments: (iss._count?.attachments || 0) + 1,
          },
        };
      };
      return {
        issues: state.issues.map((i) => (i.id === issueId ? updateAttachments(i) : i)),
        currentIssue: state.currentIssue?.id === issueId ? updateAttachments(state.currentIssue) : state.currentIssue,
      };
    });
  },

  handleRealtimeAttachmentDeleted: (issueId, attachmentId) => {
    set((state) => {
      const updateAttachments = (iss: Issue) => ({
        ...iss,
        attachments: iss.attachments?.filter((a) => a.id !== attachmentId),
        checklistItems: iss.checklistItems?.map((item) => ({
          ...item,
          attachments: item.attachments?.filter((a) => a.id !== attachmentId),
        })),
        _count: {
          ...iss._count,
          attachments: Math.max(0, (iss._count?.attachments || 1) - 1),
        },
      });
      return {
        issues: state.issues.map((i) => (i.id === issueId ? updateAttachments(i) : i)),
        currentIssue: state.currentIssue?.id === issueId ? updateAttachments(state.currentIssue) : state.currentIssue,
      };
    });
  },
}));
