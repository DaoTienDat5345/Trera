import { create } from "zustand";
import { api } from "../lib/api";
import type { TestCase } from "./testRepositoryStore";

export type TestPlanStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
export type ExecutionStatus = "UNTESTED" | "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED";

export interface PlanMetrics {
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

export interface TestSet {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  _count?: { testCases: number };
  testCases?: {
    testCaseId: string;
    order: number;
    testCase: TestCase;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestPlanCase {
  testPlanId: string;
  testCaseId: string;
  status: ExecutionStatus;
  note?: string | null;
  order: number;
  executedAt?: string | null;
  testCase: TestCase;
}

export interface TestPlan {
  id: string;
  name: string;
  description?: string | null;
  status: TestPlanStatus;
  dueDate?: string | null;
  projectId: string;
  sprintId?: string | null;
  sprint?: {
    id: string;
    name: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  metrics?: PlanMetrics;
  testCases?: TestPlanCase[];
  createdAt: string;
  updatedAt: string;
}

interface TestPlanState {
  testSets: TestSet[];
  currentTestSet: TestSet | null;
  testPlans: TestPlan[];
  currentTestPlan: TestPlan | null;
  isLoading: boolean;

  // Actions
  fetchTestSets: (projectId: string) => Promise<void>;
  fetchTestSetById: (projectId: string, setId: string) => Promise<TestSet | null>;
  createTestSet: (projectId: string, data: { name: string; description?: string; testCaseIds?: string[] }) => Promise<TestSet | null>;
  updateTestSet: (projectId: string, setId: string, data: { name?: string; description?: string; testCaseIds?: string[] }) => Promise<TestSet | null>;
  deleteTestSet: (projectId: string, setId: string) => Promise<void>;

  fetchTestPlans: (projectId: string, filters?: { status?: string; sprintId?: string }) => Promise<void>;
  fetchTestPlanById: (projectId: string, planId: string) => Promise<TestPlan | null>;
  createTestPlan: (projectId: string, data: {
    name: string;
    description?: string;
    status?: TestPlanStatus;
    dueDate?: string;
    sprintId?: string;
    testCaseIds?: string[];
    testSetIds?: string[];
  }) => Promise<TestPlan | null>;
  updateTestPlan: (projectId: string, planId: string, data: {
    name?: string;
    description?: string;
    status?: TestPlanStatus;
    dueDate?: string;
    sprintId?: string;
    testCaseIds?: string[];
  }) => Promise<TestPlan | null>;
  deleteTestPlan: (projectId: string, planId: string) => Promise<void>;

  updatePlanCaseStatus: (projectId: string, planId: string, caseId: string, data: { status: ExecutionStatus; note?: string }) => Promise<void>;
  addCasesToPlan: (projectId: string, planId: string, data: { testCaseIds?: string[]; testSetId?: string }) => Promise<number>;
  removeCaseFromPlan: (projectId: string, planId: string, caseId: string) => Promise<void>;
  setCurrentTestPlan: (plan: TestPlan | null) => void;
  setCurrentTestSet: (setObj: TestSet | null) => void;
}

export const useTestPlanStore = create<TestPlanState>((set, get) => ({
  testSets: [],
  currentTestSet: null,
  testPlans: [],
  currentTestPlan: null,
  isLoading: false,

  setCurrentTestPlan: (plan) => set({ currentTestPlan: plan }),
  setCurrentTestSet: (setObj) => set({ currentTestSet: setObj }),

  fetchTestSets: async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-sets`);
      set({ testSets: res.data.testSets || [] });
    } catch (err) {
      console.error("Lỗi tải Test Sets:", err);
    }
  },

  fetchTestSetById: async (projectId, setId) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-sets/${setId}`);
      const setObj = res.data.testSet;
      set({ currentTestSet: setObj });
      return setObj;
    } catch (err) {
      console.error("Lỗi tải chi tiết Test Set:", err);
      return null;
    }
  },

  createTestSet: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-sets`, data);
      const newSet = res.data.testSet;
      set((state) => ({ testSets: [newSet, ...state.testSets] }));
      return newSet;
    } catch (err) {
      console.error("Lỗi tạo Test Set:", err);
      throw err;
    }
  },

  updateTestSet: async (projectId, setId, data) => {
    try {
      const res = await api.put(`/projects/${projectId}/test-sets/${setId}`, data);
      const updated = res.data.testSet;
      set((state) => ({
        testSets: state.testSets.map((s) => (s.id === setId ? updated : s)),
        currentTestSet: state.currentTestSet?.id === setId ? updated : state.currentTestSet,
      }));
      return updated;
    } catch (err) {
      console.error("Lỗi cập nhật Test Set:", err);
      throw err;
    }
  },

  deleteTestSet: async (projectId, setId) => {
    try {
      await api.delete(`/projects/${projectId}/test-sets/${setId}`);
      set((state) => ({
        testSets: state.testSets.filter((s) => s.id !== setId),
        currentTestSet: state.currentTestSet?.id === setId ? null : state.currentTestSet,
      }));
    } catch (err) {
      console.error("Lỗi xoá Test Set:", err);
      throw err;
    }
  },

  fetchTestPlans: async (projectId, filters) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/projects/${projectId}/test-plans`, { params: filters });
      set({ testPlans: res.data.testPlans || [], isLoading: false });
    } catch (err) {
      console.error("Lỗi tải Test Plans:", err);
      set({ isLoading: false });
    }
  },

  fetchTestPlanById: async (projectId, planId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/projects/${projectId}/test-plans/${planId}`);
      const plan = res.data.testPlan;
      set({ currentTestPlan: plan, isLoading: false });
      return plan;
    } catch (err) {
      console.error("Lỗi tải chi tiết Test Plan:", err);
      set({ isLoading: false });
      return null;
    }
  },

  createTestPlan: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-plans`, data);
      const newPlan = res.data.testPlan;
      set((state) => ({ testPlans: [newPlan, ...state.testPlans] }));
      return newPlan;
    } catch (err) {
      console.error("Lỗi tạo Test Plan:", err);
      throw err;
    }
  },

  updateTestPlan: async (projectId, planId, data) => {
    try {
      const res = await api.put(`/projects/${projectId}/test-plans/${planId}`, data);
      const updated = res.data.testPlan;
      set((state) => ({
        testPlans: state.testPlans.map((p) => (p.id === planId ? updated : p)),
        currentTestPlan: state.currentTestPlan?.id === planId ? updated : state.currentTestPlan,
      }));
      return updated;
    } catch (err) {
      console.error("Lỗi cập nhật Test Plan:", err);
      throw err;
    }
  },

  deleteTestPlan: async (projectId, planId) => {
    try {
      await api.delete(`/projects/${projectId}/test-plans/${planId}`);
      set((state) => ({
        testPlans: state.testPlans.filter((p) => p.id !== planId),
        currentTestPlan: state.currentTestPlan?.id === planId ? null : state.currentTestPlan,
      }));
    } catch (err) {
      console.error("Lỗi xoá Test Plan:", err);
      throw err;
    }
  },

  updatePlanCaseStatus: async (projectId, planId, caseId, data) => {
    try {
      const res = await api.patch(`/projects/${projectId}/test-plans/${planId}/cases/${caseId}`, data);
      const { planCase, metrics } = res.data;

      set((state) => {
        if (state.currentTestPlan && state.currentTestPlan.id === planId) {
          const updatedCases = (state.currentTestPlan.testCases || []).map((c) =>
            c.testCaseId === caseId ? { ...c, status: planCase.status, note: planCase.note, executedAt: planCase.executedAt } : c
          );
          return {
            currentTestPlan: {
              ...state.currentTestPlan,
              testCases: updatedCases,
              metrics,
            },
            testPlans: state.testPlans.map((p) => (p.id === planId ? { ...p, metrics } : p)),
          };
        }
        return {
          testPlans: state.testPlans.map((p) => (p.id === planId ? { ...p, metrics } : p)),
        };
      });
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái test case:", err);
      throw err;
    }
  },

  addCasesToPlan: async (projectId, planId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-plans/${planId}/cases`, data);
      await get().fetchTestPlanById(projectId, planId);
      await get().fetchTestPlans(projectId);
      return res.data.addedCount || 0;
    } catch (err) {
      console.error("Lỗi thêm test cases vào Plan:", err);
      throw err;
    }
  },

  removeCaseFromPlan: async (projectId, planId, caseId) => {
    try {
      await api.delete(`/projects/${projectId}/test-plans/${planId}/cases/${caseId}`);
      set((state) => {
        if (state.currentTestPlan && state.currentTestPlan.id === planId) {
          const updatedCases = (state.currentTestPlan.testCases || []).filter((c) => c.testCaseId !== caseId);
          return {
            currentTestPlan: {
              ...state.currentTestPlan,
              testCases: updatedCases,
            },
          };
        }
        return state;
      });
      await get().fetchTestPlanById(projectId, planId);
      await get().fetchTestPlans(projectId);
    } catch (err) {
      console.error("Lỗi gỡ test case khỏi Plan:", err);
      throw err;
    }
  },
}));