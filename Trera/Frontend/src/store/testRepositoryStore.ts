import { create } from "zustand";
import { api } from "../lib/api";

export type TestCaseType = "MANUAL" | "BDD";
export type TestPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TestStep {
  id?: string;
  order: number;
  action: string;
  testData?: string | null;
  expectedResult: string;
}

export interface TestSharedStep {
  id: string;
  title: string;
  action: string;
  testData?: string | null;
  expectedResult: string;
  _count?: { testCases: number };
  createdAt?: string;
}

export interface TestFolder {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  parentId?: string | null;
  projectId: string;
  _count?: { testCases: number };
  subFolders?: TestFolder[];
}

export interface TestCase {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: TestCaseType;
  priority: TestPriority;
  preconditions?: string | null;
  gherkinContent?: string | null;
  order: number;
  folderId?: string | null;
  folder?: { id: string; name: string };
  authorId: string;
  author?: { id: string; name: string; avatar?: string | null; email?: string };
  steps?: TestStep[];
  sharedStepLinks?: { sharedStep: TestSharedStep }[];
  _count?: { steps: number };
  createdAt: string;
  updatedAt: string;
}

interface TestRepositoryState {
  folders: TestFolder[];
  testCases: TestCase[];
  sharedSteps: TestSharedStep[];
  selectedFolderId: string | "all" | "root";
  selectedType: string; // 'ALL' | 'MANUAL' | 'BDD'
  selectedPriority: string; // 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  searchQuery: string;
  isLoading: boolean;
  activeTestCase: TestCase | null;

  // Actions
  setSelectedFolderId: (folderId: string | "all" | "root") => void;
  setSelectedType: (type: string) => void;
  setSelectedPriority: (priority: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveTestCase: (testCase: TestCase | null) => void;

  fetchFolders: (projectId: string) => Promise<void>;
  createFolder: (projectId: string, data: { name: string; description?: string; parentId?: string | null }) => Promise<TestFolder | null>;
  updateFolder: (projectId: string, folderId: string, data: { name?: string; description?: string; parentId?: string | null; order?: number }) => Promise<void>;
  deleteFolder: (projectId: string, folderId: string) => Promise<void>;

  fetchTestCases: (projectId: string) => Promise<void>;
  fetchTestCaseById: (projectId: string, testCaseId: string) => Promise<TestCase | null>;
  createTestCase: (projectId: string, data: any) => Promise<TestCase | null>;
  updateTestCase: (projectId: string, testCaseId: string, data: any) => Promise<TestCase | null>;
  deleteTestCase: (projectId: string, testCaseId: string) => Promise<boolean>;

  fetchSharedSteps: (projectId: string) => Promise<void>;
  createSharedStep: (projectId: string, data: { title: string; action: string; testData?: string; expectedResult: string }) => Promise<TestSharedStep | null>;
  deleteSharedStep: (projectId: string, stepId: string) => Promise<void>;

  importTestCases: (projectId: string, data: { format: string; content: string; folderId?: string | null }) => Promise<{ success: boolean; count?: number; message?: string }>;
  exportTestCases: (projectId: string, format: "json" | "csv", folderId?: string) => Promise<any>;
}

export const useTestRepositoryStore = create<TestRepositoryState>((set, get) => ({
  folders: [],
  testCases: [],
  sharedSteps: [],
  selectedFolderId: "all",
  selectedType: "ALL",
  selectedPriority: "ALL",
  searchQuery: "",
  isLoading: false,
  activeTestCase: null,

  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedPriority: (priority) => set({ selectedPriority: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTestCase: (testCase) => set({ activeTestCase: testCase }),

  fetchFolders: async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-folders`);
      set({ folders: res.data.folders || [] });
    } catch (err) {
      console.error("Lỗi tải thư mục test:", err);
    }
  },

  createFolder: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-folders`, data);
      const newFolder = res.data.folder;
      set((state) => ({ folders: [...state.folders, newFolder] }));
      return newFolder;
    } catch (err) {
      console.error("Lỗi tạo thư mục test:", err);
      throw err;
    }
  },

  updateFolder: async (projectId, folderId, data) => {
    try {
      const res = await api.put(`/projects/${projectId}/test-folders/${folderId}`, data);
      const updated = res.data.folder;
      set((state) => ({
        folders: state.folders.map((f) => (f.id === folderId ? updated : f)),
      }));
    } catch (err) {
      console.error("Lỗi cập nhật thư mục test:", err);
      throw err;
    }
  },

  deleteFolder: async (projectId, folderId) => {
    try {
      await api.delete(`/projects/${projectId}/test-folders/${folderId}`);
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== folderId),
        selectedFolderId: state.selectedFolderId === folderId ? "all" : state.selectedFolderId,
      }));
      get().fetchTestCases(projectId);
    } catch (err) {
      console.error("Lỗi xoá thư mục test:", err);
      throw err;
    }
  },

  fetchTestCases: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const { selectedFolderId, selectedType, selectedPriority, searchQuery } = get();
      const params: any = {};
      if (selectedFolderId !== "all") params.folderId = selectedFolderId;
      if (selectedType !== "ALL") params.type = selectedType;
      if (selectedPriority !== "ALL") params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get(`/projects/${projectId}/test-cases`, { params });
      set({ testCases: res.data.testCases || [], isLoading: false });
    } catch (err) {
      console.error("Lỗi tải danh sách test cases:", err);
      set({ isLoading: false });
    }
  },

  fetchTestCaseById: async (projectId, testCaseId) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-cases/${testCaseId}`);
      const testCase = res.data.testCase;
      set({ activeTestCase: testCase });
      return testCase;
    } catch (err) {
      console.error("Lỗi tải chi tiết test case:", err);
      return null;
    }
  },

  createTestCase: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-cases`, data);
      const newCase = res.data.testCase;
      set((state) => ({
        testCases: [newCase, ...state.testCases],
      }));
      get().fetchFolders(projectId);
      return newCase;
    } catch (err) {
      console.error("Lỗi tạo test case:", err);
      throw err;
    }
  },

  updateTestCase: async (projectId, testCaseId, data) => {
    try {
      const res = await api.put(`/projects/${projectId}/test-cases/${testCaseId}`, data);
      const updated = res.data.testCase;
      set((state) => ({
        testCases: state.testCases.map((tc) => (tc.id === testCaseId ? updated : tc)),
        activeTestCase: state.activeTestCase?.id === testCaseId ? updated : state.activeTestCase,
      }));
      get().fetchFolders(projectId);
      return updated;
    } catch (err) {
      console.error("Lỗi cập nhật test case:", err);
      throw err;
    }
  },

  deleteTestCase: async (projectId, testCaseId) => {
    try {
      await api.delete(`/projects/${projectId}/test-cases/${testCaseId}`);
      set((state) => ({
        testCases: state.testCases.filter((tc) => tc.id !== testCaseId),
        activeTestCase: state.activeTestCase?.id === testCaseId ? null : state.activeTestCase,
      }));
      get().fetchFolders(projectId);
      return true;
    } catch (err) {
      console.error("Lỗi xoá test case:", err);
      throw err;
    }
  },

  fetchSharedSteps: async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}/test-shared-steps`);
      set({ sharedSteps: res.data.sharedSteps || [] });
    } catch (err) {
      console.error("Lỗi tải bước dùng chung:", err);
    }
  },

  createSharedStep: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-shared-steps`, data);
      const newStep = res.data.sharedStep;
      set((state) => ({ sharedSteps: [newStep, ...state.sharedSteps] }));
      return newStep;
    } catch (err) {
      console.error("Lỗi tạo bước dùng chung:", err);
      throw err;
    }
  },

  deleteSharedStep: async (projectId, stepId) => {
    try {
      await api.delete(`/projects/${projectId}/test-shared-steps/${stepId}`);
      set((state) => ({
        sharedSteps: state.sharedSteps.filter((s) => s.id !== stepId),
      }));
    } catch (err) {
      console.error("Lỗi xoá bước dùng chung:", err);
      throw err;
    }
  },

  importTestCases: async (projectId, data) => {
    try {
      const res = await api.post(`/projects/${projectId}/test-cases/import`, data);
      await get().fetchTestCases(projectId);
      await get().fetchFolders(projectId);
      return { success: true, count: res.data.count, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Nhập test cases thất bại" };
    }
  },

  exportTestCases: async (projectId, format, folderId) => {
    try {
      const params: any = { format };
      if (folderId && folderId !== "all") params.folderId = folderId;

      if (format === "csv") {
        const res = await api.get(`/projects/${projectId}/test-cases/export`, {
          params,
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `test_cases_${projectId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      }

      const res = await api.get(`/projects/${projectId}/test-cases/export`, { params });
      const blob = new Blob([JSON.stringify(res.data.testCases, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `test_cases_${projectId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (err) {
      console.error("Lỗi xuất file test cases:", err);
      throw err;
    }
  },
}));