import { create } from "zustand";
import { toast } from "sonner";
import { api } from "../lib/api";

export type NotificationType =
  | "ISSUE_ASSIGNED"
  | "ISSUE_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "SPRINT_STARTED"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  userId: string;
  actorId: string | null;
  actor?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addRealtimeNotification: (notification: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  isLoading: false,

  fetchNotifications: async (unreadOnly = false) => {
    try {
      set({ isLoading: true });
      const res = await api.get("/notifications", {
        params: { unread: unreadOnly ? "true" : undefined, limit: 30 },
      });
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
        totalCount: res.data.totalCount || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => {
        const deleted = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          totalCount: Math.max(0, state.totalCount - 1),
          unreadCount: deleted && !deleted.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
    }
  },

  addRealtimeNotification: (notif: AppNotification) => {
    set((state) => {
      if (state.notifications.some((n) => n.id === notif.id)) return state;
      return {
        notifications: [notif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        totalCount: state.totalCount + 1,
      };
    });

    toast.info(notif.title, {
      description: notif.message,
      duration: 6000,
    });
  },
}));
