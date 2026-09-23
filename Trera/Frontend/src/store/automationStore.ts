import { create } from "zustand";
import { api } from "../lib/api";

export interface ApiTokenItem {
  id: string;
  name: string;
  prefix: string;
  role: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secret?: string | null;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AutomationSummaryData {
  totalRuns: number;
  totalTestsExecuted: number;
  overallPassRate: number;
  recentRuns: Array<{
    id: string;
    name: string;
    environmentName: string;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    createdAt: string;
  }>;
}

export interface UploadResult {
  message: string;
  testRun: any;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationSeconds: number;
    passRate: number;
  };
  resolvedCasesCount: number;
  createdDefectsCount: number;
}

interface AutomationState {
  tokens: ApiTokenItem[];
  webhooks: WebhookItem[];
  summary: AutomationSummaryData | null;
  isLoading: boolean;
  latestCreatedToken: string | null;
  latestUploadResult: UploadResult | null;

  fetchApiTokens: (projectId: string) => Promise<void>;
  createApiToken: (
    projectId: string,
    data: { name: string; role?: string; expiresInDays?: number }
  ) => Promise<{ token: string; tokenRecord: any }>;
  revokeApiToken: (projectId: string, tokenId: string) => Promise<void>;
  clearLatestCreatedToken: () => void;

  fetchWebhooks: (projectId: string) => Promise<void>;
  createWebhook: (
    projectId: string,
    data: { name: string; url: string; secret?: string; events?: string[] }
  ) => Promise<void>;
  updateWebhook: (
    projectId: string,
    webhookId: string,
    data: Partial<WebhookItem>
  ) => Promise<void>;
  deleteWebhook: (projectId: string, webhookId: string) => Promise<void>;
  testWebhook: (
    projectId: string,
    webhookId: string
  ) => Promise<{ ok: boolean; message: string; statusCode?: number }>;

  fetchAutomationSummary: (projectId: string) => Promise<void>;
  uploadJUnitXml: (
    projectId: string,
    formData: FormData
  ) => Promise<UploadResult>;
  uploadCucumberJson: (
    projectId: string,
    formData: FormData
  ) => Promise<UploadResult>;
  clearLatestUploadResult: () => void;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  tokens: [],
  webhooks: [],
  summary: null,
  isLoading: false,
  latestCreatedToken: null,
  latestUploadResult: null,

  fetchApiTokens: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/projects/${projectId}/tokens`);
      set({ tokens: res.data.tokens || [] });
    } catch (error) {
      console.error("Lỗi tải danh sách API Token:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createApiToken: async (projectId, data) => {
    set({ isLoading: true });
    try {
      const res = await api.post(`/projects/${projectId}/tokens`, data);
      const rawToken = res.data.token;
      set({ latestCreatedToken: rawToken });
      await get().fetchApiTokens(projectId);
      return res.data;
    } finally {
      set({ isLoading: false });
    }
  },

  revokeApiToken: async (projectId, tokenId) => {
    await api.delete(`/projects/${projectId}/tokens/${tokenId}`);
    set({
      tokens: get().tokens.filter((t) => t.id !== tokenId),
    });
  },

  clearLatestCreatedToken: () => set({ latestCreatedToken: null }),

  fetchWebhooks: async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}/webhooks`);
      set({ webhooks: res.data.webhooks || [] });
    } catch (error) {
      console.error("Lỗi tải webhooks:", error);
    }
  },

  createWebhook: async (projectId, data) => {
    await api.post(`/projects/${projectId}/webhooks`, data);
    await get().fetchWebhooks(projectId);
  },

  updateWebhook: async (projectId, webhookId, data) => {
    await api.put(`/projects/${projectId}/webhooks/${webhookId}`, data);
    await get().fetchWebhooks(projectId);
  },

  deleteWebhook: async (projectId, webhookId) => {
    await api.delete(`/projects/${projectId}/webhooks/${webhookId}`);
    set({
      webhooks: get().webhooks.filter((w) => w.id !== webhookId),
    });
  },

  testWebhook: async (projectId, webhookId) => {
    const res = await api.post(`/projects/${projectId}/webhooks/${webhookId}/test`);
    return res.data;
  },

  fetchAutomationSummary: async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}/automation/summary`);
      set({ summary: res.data });
    } catch (error) {
      console.error("Lỗi tải thống kê tự động hóa:", error);
    }
  },

  uploadJUnitXml: async (projectId, formData) => {
    set({ isLoading: true });
    try {
      const res = await api.post(`/projects/${projectId}/automation/junit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ latestUploadResult: res.data });
      await get().fetchAutomationSummary(projectId);
      return res.data;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadCucumberJson: async (projectId, formData) => {
    set({ isLoading: true });
    try {
      const res = await api.post(`/projects/${projectId}/automation/cucumber`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ latestUploadResult: res.data });
      await get().fetchAutomationSummary(projectId);
      return res.data;
    } finally {
      set({ isLoading: false });
    }
  },

  clearLatestUploadResult: () => set({ latestUploadResult: null }),
}));
