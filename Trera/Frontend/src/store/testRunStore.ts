import { create } from "zustand";
import { api } from "../lib/api";
import type { TestCase } from "./testRepositoryStore";
import type { ExecutionStatus } from "./testPlanStore";
export type { ExecutionStatus };

export type TestRunStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface TestEnvironment {
  id: string;
  name: string;
  category?: string | null;
  projectId: string;
  createdAt: string;
}

export interface TestRunStepAttachment {
  id: string;
  url: string;
  filename: string;
  stepResultId: string;
  createdAt: string;
}

export interface TestRunStepResult {
  id: string;
  stepId: string;
  stepOrder: number;
  status: ExecutionStatus;
  actualResult?: string | null;
  comment?: string | null;
  runResultId: string;
  attachments?: TestRunStepAttachment[];
}

export interface TestRunDefect {
  runResultId: string;
  issueId: string;
  issue?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
  };
}

export interface TestRunResult {
  id: string;
  status: ExecutionStatus;
  actualResult?: string | null;
  elapsedSeconds: number;
  testRunId: string;
  testCaseId: string;
  executedById?: string | null;
  executedBy?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  testCase: TestCase;
  stepResults: TestRunStepResult[];
  defects: TestRunDefect[];
  executedAt?: string | null;
}

export interface RunMetrics {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  untested: number;
  completed: number;
  passPercentage: number;
  failPercentage: number;
  blockedPercentage: number;
  completionPercentage: number;
}

export interface TestRun {
  id: string;
  name: string;
  description?: string | null;
  status: TestRunStatus;
  projectId: string;
  planId?: string | null;
  plan?: {
    id: string;
    name: string;
    sprint?: { id: string; name: string; status: string } | null;
  } | null;
  environmentId?: string | null;
  environment?: TestEnvironment | null;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  results?: TestRunResult[];
  metrics?: RunMetrics;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TestRunState {
  testRuns: TestRun[];
  currentTestRun: TestRun | null;
  environments: TestEnvironment[];
  isLoading: boolean;

  // Actions
  fetchEnvironments: (projectId: string) => Promise<void>;
  createEnvironment: (projectId: string, data: { name: string; category?: string }) => Promise<TestEnvironment | null>;
  deleteEnvironment: (projectId: string, envId: string) => Promise<void>;

  fetchTestRuns: (projectId: string, filters?: { planId?: string; status?: string }) => Promise<void>;
  fetchTestRunById: (projectId: string, runId: string) => Promise<TestRun | null>;
  createTestRun: (projectId: string, data: {
    name: string;
    description?: string;
    planId?: string;
    environmentId?: string;
    assignedToId?: string;
    testCaseIds?: string[];
  }) => Promise<TestRun | null>;
  updateTestRun: (projectId: string, runId: string, data: {
    name?: string;
    description?: string;
    status?: TestRunStatus;
    environmentId?: string;
    assignedToId?: string;
  }) => Promise<TestRun | null>;
  deleteTestRun: (projectId: string, runId: string) => Promise<void>;

  executeTestCase: (projectId: string, runId: string, caseId: string, data: {
    status?: ExecutionStatus;
    actualResult?: string;
    elapsedSeconds?: number;
    stepResults?: {
      stepId: string;
      stepOrder: number;
      status: ExecutionStatus;
      actualResult?: string;
      comment?: string;
    }[];
  }) => Promise<TestRunResult | null>;

  logDefectFromRun: (projectId: string, runId: string, caseId: string, data: {
    title?: string;
    description?: string;
    priority?: string;
    sprintId?: string;
  }) => Promise<any>;

  uploadStepAttachment: (projectId: string, runId: string, caseId: string, stepId: string, file: File) => Promise<TestRunStepAttachment | null>;

  setCurrentTestRun: (run: TestRun | null) => void;
}

export const useTestRunStore = create<TestRunState>((set, get) => ({
  testRuns: [],
  currentTestRun: null,
  environments: [],
  isLoading: false,

  setCurrentTestRun: (run) => set({ currentTestRun: run }),

  fetchEnvironments: async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-environments`);
      set({ environments: res.data.environments || [] });
    } catch (err) {
      console.error("Lỗi tải danh sách môi trường:", err);
    }
  },

  createEnvironment: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-environments`, data);
      const newEnv = res.data.environment;
      set((state) => ({ environments: [...state.environments, newEnv] }));
      return newEnv;
    } catch (err) {
      console.error("Lỗi tạo môi trường:", err);
      throw err;
    }
  },

  deleteEnvironment: async (projectId, envId) => {
    try {
      await api.delete(`/projects/${projectId}/test-environments/${envId}`);
      set((state) => ({
        environments: state.environments.filter((e) => e.id !== envId),
      }));
    } catch (err) {
      console.error("Lỗi xóa môi trường:", err);
      throw err;
    }
  },

  fetchTestRuns: async (projectId, filters) => {
    try {
      set({ isLoading: true });
      const params = new URLSearchParams();
      if (filters?.planId) params.append("planId", filters.planId);
      if (filters?.status && filters.status !== "ALL") params.append("status", filters.status);

      const res = await api.get(`/projects/${projectId}/test-runs?${params.toString()}`);
      set({ testRuns: res.data.testRuns || [], isLoading: false });
    } catch (err) {
      console.error("Lỗi tải danh sách Test Runs:", err);
      set({ isLoading: false });
    }
  },

  fetchTestRunById: async (projectId, runId) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-runs/${runId}`);
      const fullRun = {
        ...res.data.testRun,
        metrics: res.data.metrics,
      };
      set({ currentTestRun: fullRun });
      return fullRun;
    } catch (err) {
      console.error("Lỗi tải chi tiết Test Run:", err);
      return null;
    }
  },

  createTestRun: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-runs`, data);
      const newRun = res.data.testRun;
      set((state) => ({ testRuns: [newRun, ...state.testRuns] }));
      return newRun;
    } catch (err) {
      console.error("Lỗi tạo Test Run:", err);
      throw err;
    }
  },

  updateTestRun: async (projectId, runId, data) => {
    try {
      const res = await api.put(`/projects/${projectId}/test-runs/${runId}`, data);
      const updated = res.data.testRun;
      set((state) => ({
        testRuns: state.testRuns.map((r) => (r.id === runId ? updated : r)),
        currentTestRun: state.currentTestRun?.id === runId ? updated : state.currentTestRun,
      }));
      return updated;
    } catch (err) {
      console.error("Lỗi cập nhật Test Run:", err);
      throw err;
    }
  },

  deleteTestRun: async (projectId, runId) => {
    try {
      await api.delete(`/projects/${projectId}/test-runs/${runId}`);
      set((state) => ({
        testRuns: state.testRuns.filter((r) => r.id !== runId),
        currentTestRun: state.currentTestRun?.id === runId ? null : state.currentTestRun,
      }));
    } catch (err) {
      console.error("Lỗi xóa Test Run:", err);
      throw err;
    }
  },

  executeTestCase: async (projectId, runId, caseId, data) => {
    try {
      const res = await api.post(
        `/projects/${projectId}/test-runs/${runId}/results/${caseId}`,
        data
      );
      const updatedResult = res.data.result;

      // Cập nhật currentTestRun trong state
      set((state) => {
        if (!state.currentTestRun || state.currentTestRun.id !== runId) return state;
        const currentResults = state.currentTestRun.results || [];
        const newResults = currentResults.map((r) =>
          r.testCaseId === caseId ? { ...r, ...updatedResult } : r
        );

        // Tính lại live metrics
        const total = newResults.length;
        let passed = 0, failed = 0, blocked = 0, skipped = 0, untested = 0;
        for (const r of newResults) {
          if (r.status === "PASSED") passed++;
          else if (r.status === "FAILED") failed++;
          else if (r.status === "BLOCKED") blocked++;
          else if (r.status === "SKIPPED") skipped++;
          else untested++;
        }
        const completed = passed + failed + blocked + skipped;
        const passPercentage = total > 0 ? Math.round((passed / total) * 100) : 0;
        const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const updatedRun = {
          ...state.currentTestRun,
          results: newResults,
          metrics: {
            total,
            passed,
            failed,
            blocked,
            skipped,
            untested,
            completed,
            passPercentage,
            failPercentage: total > 0 ? Math.round((failed / total) * 100) : 0,
            blockedPercentage: total > 0 ? Math.round((blocked / total) * 100) : 0,
            completionPercentage,
          },
        };

        return {
          currentTestRun: updatedRun,
          testRuns: state.testRuns.map((r) => (r.id === runId ? updatedRun : r)),
        };
      });

      return updatedResult;
    } catch (err) {
      console.error("Lỗi ghi nhận kết quả test case:", err);
      throw err;
    }
  },

  logDefectFromRun: async (projectId, runId, caseId, data) => {
    try {
      const res = await api.post(
        `/projects/${projectId}/test-runs/${runId}/results/${caseId}/defect`,
        data
      );
      const { bug, defectLink } = res.data;

      // Cập nhật defects của testCase trong currentTestRun
      set((state) => {
        if (!state.currentTestRun || state.currentTestRun.id !== runId) return state;
        const currentResults = state.currentTestRun.results || [];
        const newResults = currentResults.map((r) => {
          if (r.testCaseId === caseId) {
            const currentDefects = r.defects || [];
            return {
              ...r,
              defects: [
                ...currentDefects,
                {
                  ...defectLink,
                  issue: bug,
                },
              ],
            };
          }
          return r;
        });

        return {
          currentTestRun: {
            ...state.currentTestRun,
            results: newResults,
          },
        };
      });

      return res.data;
    } catch (err) {
      console.error("Lỗi tạo Bug từ Test Run:", err);
      throw err;
    }
  },

  uploadStepAttachment: async (projectId, runId, caseId, stepId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `/projects/${projectId}/test-runs/${runId}/results/${caseId}/steps/${stepId}/attachment`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data.attachment;
    } catch (err) {
      console.error("Lỗi tải ảnh đính kèm bước:", err);
      throw err;
    }
  },
}));
