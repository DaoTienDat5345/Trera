import { create } from "zustand";
import { api } from "../lib/api";
import type { TestCase } from "./testRepositoryStore";
import type { ExecutionStatus } from "./testPlanStore";

export type CoverageQualityStatus =
  | "PASSED"
  | "FAILED"
  | "BLOCKED"
  | "UNTESTED"
  | "NO_TESTS";

export interface TraceabilityDefect {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
}

export interface TraceabilityTestCase extends TestCase {
  latestStatus: ExecutionStatus;
  latestExecutedAt?: string | null;
  latestRunName?: string | null;
  defects: TraceabilityDefect[];
}

export interface TraceabilityItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  sprint?: { id: string; name: string; status: string } | null;
  assignees?: { id: string; name: string; avatar?: string | null }[];
  reporter?: { id: string; name: string; avatar?: string | null };
  coverageStatus: "COVERED" | "UNCOVERED";
  testCasesCount: number;
  testCases: TraceabilityTestCase[];
  defects: TraceabilityDefect[];
  qualityStatus: CoverageQualityStatus;
}

export interface TraceabilityMetrics {
  totalStories: number;
  coveredStories: number;
  uncoveredStories: number;
  coveragePercentage: number;
  passedStories: number;
  failedStories: number;
  blockedStories: number;
  untestedStories: number;
  noTestsStories: number;
}

export interface FlakyTestItem {
  id: string;
  key: string;
  title: string;
  priority: string;
  type: string;
  folder?: { id: string; name: string } | null;
  totalRuns: number;
  passCount: number;
  failCount: number;
  flips: number;
  flipRate: number;
  severity: "HIGH" | "MEDIUM";
  trajectory: {
    runName: string;
    status: ExecutionStatus;
    executedAt?: string | null;
  }[];
}

export interface QADashboardData {
  summary: {
    totalCases: number;
    totalRuns: number;
    activeRuns: number;
    completedRuns: number;
    totalExecutions: number;
    passedExecutions: number;
    failedExecutions: number;
    blockedExecutions: number;
    untestedExecutions: number;
    passRate: number;
    failRate: number;
    totalDefects: number;
    openDefects: number;
    resolvedDefects: number;
    defectResolutionRate: number;
  };
  priorityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  folderBreakdown: { id: string; name: string; count: number }[];
}

interface TraceabilityState {
  matrix: TraceabilityItem[];
  metrics: TraceabilityMetrics | null;
  qaData: QADashboardData | null;
  flakyTests: FlakyTestItem[];
  isLoading: boolean;

  fetchTraceabilityMatrix: (
    projectId: string,
    filters?: { sprintId?: string; search?: string }
  ) => Promise<void>;
  linkTestCases: (
    projectId: string,
    issueId: string,
    testCaseIds: string[]
  ) => Promise<void>;
  unlinkTestCase: (
    projectId: string,
    issueId: string,
    testCaseId: string
  ) => Promise<void>;
  fetchQAMetrics: (projectId: string) => Promise<void>;
  fetchFlakyTests: (projectId: string) => Promise<void>;
}

export const useTraceabilityStore = create<TraceabilityState>((set, get) => ({
  matrix: [],
  metrics: null,
  qaData: null,
  flakyTests: [],
  isLoading: false,

  fetchTraceabilityMatrix: async (projectId, filters) => {
    try {
      set({ isLoading: true });
      const params = new URLSearchParams();
      if (filters?.sprintId && filters.sprintId !== "all") {
        params.append("sprintId", filters.sprintId);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }

      const res = await api.get(
        `/projects/${projectId}/traceability?${params.toString()}`
      );
      set({
        matrix: res.data.matrix || [],
        metrics: res.data.metrics || null,
        isLoading: false,
      });
    } catch (err) {
      console.error("Lỗi tải ma trận truy vết:", err);
      set({ isLoading: false });
    }
  },

  linkTestCases: async (projectId, issueId, testCaseIds) => {
    try {
      await api.post(`/projects/${projectId}/traceability/link`, {
        issueId,
        testCaseIds,
      });
      // Refresh matrix
      await get().fetchTraceabilityMatrix(projectId);
    } catch (err) {
      console.error("Lỗi liên kết ca test:", err);
      throw err;
    }
  },

  unlinkTestCase: async (projectId, issueId, testCaseId) => {
    try {
      await api.delete(`/projects/${projectId}/traceability/link`, {
        data: { issueId, testCaseId },
      });
      // Refresh matrix
      await get().fetchTraceabilityMatrix(projectId);
    } catch (err) {
      console.error("Lỗi hủy liên kết ca test:", err);
      throw err;
    }
  },

  fetchQAMetrics: async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/qa-metrics`);
      set({ qaData: res.data });
    } catch (err) {
      console.error("Lỗi tải số liệu QA Dashboard:", err);
    }
  },

  fetchFlakyTests: async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/qa-metrics/flaky-tests`);
      set({ flakyTests: res.data.flakyTests || [] });
    } catch (err) {
      console.error("Lỗi tải danh sách Flaky Tests:", err);
    }
  },
}));
