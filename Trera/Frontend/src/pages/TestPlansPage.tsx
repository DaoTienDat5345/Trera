import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import {
  LayoutGrid,
  List,
  Users,
  BarChart3,
  GitMerge,
  ArrowLeft,
  FlaskConical,
  Layers,
  ClipboardList,
  GitFork,
  Cpu,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Play,
  CheckSquare,
  Sparkles,
  ChevronRight,
  RefreshCw,
  FolderCheck,
  Monitor,
  Bug,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useProjectStore } from "../store/projectStore";
import { useTestPlanStore } from "../store/testPlanStore";
import type { TestPlan, TestSet, TestPlanStatus } from "../store/testPlanStore";
import { useTestRunStore } from "../store/testRunStore";
import type { TestRun, TestRunStatus } from "../store/testRunStore";

import TestPlanModal from "../components/testPlans/TestPlanModal";
import TestSetModal from "../components/testPlans/TestSetModal";
import TestPlanDetailView from "../components/testPlans/TestPlanDetailView";

import TestRunModal from "../components/testRuns/TestRunModal";
import ExecutionRunnerModal from "../components/testRuns/ExecutionRunnerModal";
import TestRunDetailView from "../components/testRuns/TestRunDetailView";

import { toast } from "sonner";

const PLAN_STATUS_MAP: Record<
  TestPlanStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "Đang kiểm thử",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500 animate-pulse",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  ARCHIVED: {
    label: "Lưu trữ",
    bg: "bg-purple-100",
    text: "text-purple-800",
    dot: "bg-purple-500",
  },
};

export default function TestPlansPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { getProjectById, currentProject } = useProjectStore();

  // Test Plans & Sets Store
  const {
    testPlans,
    testSets,
    fetchTestPlans,
    fetchTestSets,
    deleteTestPlan,
    deleteTestSet,
    fetchTestPlanById,
  } = useTestPlanStore();

  // Test Runs Store
  const {
    testRuns,
    fetchTestRuns,
    fetchTestRunById,
    deleteTestRun,
    environments,
    fetchEnvironments,
  } = useTestRunStore();

  const [activeTab, setActiveTab] = useState<"plans" | "runs" | "sets">("plans");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Detail for Plans & Sets
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TestPlan | null>(null);
  const [showSetModal, setShowSetModal] = useState(false);
  const [editingSet, setEditingSet] = useState<TestSet | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null);

  // Modals & Detail for Runs & Execution
  const [showRunModal, setShowRunModal] = useState(false);
  const [editingRun, setEditingRun] = useState<TestRun | null>(null);
  const [runDefaultPlanId, setRunDefaultPlanId] = useState<string | undefined>(undefined);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  // Runner Focus Modal
  const [showRunnerModal, setShowRunnerModal] = useState(false);
  const [runnerRunId, setRunnerRunId] = useState<string>("");
  const [runnerCaseId, setRunnerCaseId] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    await Promise.all([
      getProjectById(projectId),
      fetchTestPlans(projectId),
      fetchTestSets(projectId),
      fetchTestRuns(projectId),
      fetchEnvironments(projectId),
    ]);
    setIsLoading(false);
  }, [
    projectId,
    getProjectById,
    fetchTestPlans,
    fetchTestSets,
    fetchTestRuns,
    fetchEnvironments,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selectedPlan in sync if updated in store
  useEffect(() => {
    if (selectedPlan && projectId) {
      const updated = testPlans.find((p) => p.id === selectedPlan.id);
      if (updated) {
        setSelectedPlan(updated);
      }
    }
  }, [testPlans]);

  // Keep selectedRun in sync if updated in store
  useEffect(() => {
    if (selectedRun && projectId) {
      const updated = testRuns.find((r) => r.id === selectedRun.id);
      if (updated) {
        setSelectedRun(updated);
      }
    }
  }, [testRuns]);

  // Handlers for Plans
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan: TestPlan) => {
    setEditingPlan(plan);
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (plan: TestPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    if (!confirm(`Bạn có chắc muốn xóa kế hoạch "${plan.name}"?`)) return;

    try {
      await deleteTestPlan(projectId, plan.id);
      toast.success("Đã xóa kế hoạch kiểm thử thành công");
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(null);
      }
    } catch {
      toast.error("Không thể xóa kế hoạch kiểm thử");
    }
  };

  const handleViewPlanDetail = async (plan: TestPlan) => {
    if (!projectId) return;
    const fullPlan = await fetchTestPlanById(projectId, plan.id);
    setSelectedPlan(fullPlan || plan);
  };

  // Launch a Test Run from a Plan
  const handleRunPlan = (plan: TestPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRun(null);
    setRunDefaultPlanId(plan.id);
    setShowRunModal(true);
  };

  // Handlers for Runs
  const handleOpenCreateRun = () => {
    setEditingRun(null);
    setRunDefaultPlanId(undefined);
    setShowRunModal(true);
  };

  const handleOpenEditRun = (run: TestRun) => {
    setEditingRun(run);
    setShowRunModal(true);
  };

  const handleDeleteRun = async (run: TestRun, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    if (!confirm(`Bạn có chắc muốn xóa đợt thực thi "${run.name}"?`)) return;

    try {
      await deleteTestRun(projectId, run.id);
      toast.success("Đã xóa đợt thực thi thành công");
      if (selectedRun?.id === run.id) {
        setSelectedRun(null);
      }
    } catch {
      toast.error("Không thể xóa đợt thực thi");
    }
  };

  const handleViewRunDetail = async (run: TestRun) => {
    if (!projectId) return;
    const fullRun = await fetchTestRunById(projectId, run.id);
    setSelectedRun(fullRun || run);
  };

  const handleLaunchRunner = (runId: string, caseId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRunnerRunId(runId);
    setRunnerCaseId(caseId);
    setShowRunnerModal(true);
  };

  // Handlers for Sets
  const handleOpenCreateSet = () => {
    setEditingSet(null);
    setShowSetModal(true);
  };

  const handleOpenEditSet = (setObj: TestSet) => {
    setEditingSet(setObj);
    setShowSetModal(true);
  };

  const handleDeleteSet = async (setObj: TestSet) => {
    if (!projectId) return;
    if (!confirm(`Bạn có chắc muốn xóa nhóm "${setObj.name}"?`)) return;

    try {
      await deleteTestSet(projectId, setObj.id);
      toast.success("Đã xóa nhóm test thành công");
    } catch {
      toast.error("Không thể xóa nhóm test");
    }
  };

  // Filters
  const filteredPlans = testPlans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRuns = testRuns.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSets = testSets.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!projectId) return null;

  // View Detailed Plan
  if (selectedPlan) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
        <Navbar />
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
                <ArrowLeft size={11} /> Dự án
              </Link>
              <span>/</span>
              <Link to={`/projects/${projectId}`} className="hover:text-slate-600">
                {currentProject?.name}
              </Link>
              <span>/</span>
              <button
                onClick={() => setSelectedPlan(null)}
                className="hover:text-slate-600 hover:underline"
              >
                Kế hoạch Test
              </button>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{selectedPlan.name}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TestPlanDetailView
            projectId={projectId}
            plan={selectedPlan}
            onBack={() => setSelectedPlan(null)}
            onEditPlan={handleOpenEditPlan}
          />
        </div>

        <TestPlanModal
          projectId={projectId}
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          editPlan={editingPlan}
        />
      </div>
    );
  }

  // View Detailed Run
  if (selectedRun) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
        <Navbar />
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
                <ArrowLeft size={11} /> Dự án
              </Link>
              <span>/</span>
              <Link to={`/projects/${projectId}`} className="hover:text-slate-600">
                {currentProject?.name}
              </Link>
              <span>/</span>
              <button
                onClick={() => setSelectedRun(null)}
                className="hover:text-slate-600 hover:underline"
              >
                Đợt thực thi
              </button>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{selectedRun.name}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TestRunDetailView
            projectId={projectId}
            run={selectedRun}
            onBack={() => setSelectedRun(null)}
            onEditRun={handleOpenEditRun}
            onLaunchRunner={(caseId) => handleLaunchRunner(selectedRun.id, caseId)}
          />
        </div>

        <TestRunModal
          projectId={projectId}
          isOpen={showRunModal}
          onClose={() => setShowRunModal(false)}
          editRun={editingRun}
        />

        {showRunnerModal && (
          <ExecutionRunnerModal
            projectId={projectId}
            runId={runnerRunId || selectedRun.id}
            isOpen={showRunnerModal}
            onClose={() => {
              setShowRunnerModal(false);
              loadData();
            }}
            initialCaseId={runnerCaseId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      {/* Project Subheader Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-600">
              {currentProject?.name}
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Kế hoạch & Đợt Test</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-indigo-600" />
            <span>Kế hoạch & Đợt Test</span>
          </h1>

          <nav className="flex items-center gap-1 ml-4">
            <Link
              to={`/projects/${projectId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <LayoutGrid size={14} /> Bảng
            </Link>
            <Link
              to={`/projects/${projectId}/sprints`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <List size={14} /> Backlog
            </Link>
            <Link
              to={`/projects/${projectId}/repository`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <FlaskConical size={14} /> Kho Test Case
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
              <ClipboardList size={14} /> Kế hoạch & Chạy Test
            </button>
            <Link
              to={`/projects/${projectId}/traceability`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <GitFork size={14} /> Ma trận truy vết
            </Link>
            <Link
              to={`/projects/${projectId}/automation`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Cpu size={14} /> CI/CD & API
            </Link>
            <Link
              to={`/projects/${projectId}/members`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Users size={14} /> Thành viên
            </Link>
            <Link
              to={`/projects/${projectId}/reports`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <BarChart3 size={14} /> Báo cáo
            </Link>
            <Link
              to={`/projects/${projectId}/activity`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <GitMerge size={14} /> Lịch sử
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 3-Tab Selector & Action Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {/* Tab 1: Test Plans */}
            <button
              onClick={() => {
                setActiveTab("plans");
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                activeTab === "plans"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList size={15} />
              <span>Kế hoạch kiểm thử (Test Plans)</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold">
                {testPlans.length}
              </span>
            </button>

            {/* Tab 2: Test Runs */}
            <button
              onClick={() => {
                setActiveTab("runs");
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                activeTab === "runs"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Play size={14} className="text-indigo-600" />
              <span>Đợt thực thi (Test Runs)</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                {testRuns.length}
              </span>
            </button>

            {/* Tab 3: Test Sets */}
            <button
              onClick={() => {
                setActiveTab("sets");
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                activeTab === "sets"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers size={15} />
              <span>Nhóm Test tĩnh (Test Sets)</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold">
                {testSets.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={
                  activeTab === "plans"
                    ? "Tìm kiếm kế hoạch..."
                    : activeTab === "runs"
                    ? "Tìm kiếm đợt chạy test..."
                    : "Tìm kiếm nhóm test..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Status Filter for Plans / Runs */}
            {activeTab === "plans" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="IN_PROGRESS">Đang chạy</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            )}

            {activeTab === "runs" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_PROGRESS">Đang chạy</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            )}

            {/* Create Action Button */}
            {activeTab === "plans" && (
              <button
                onClick={handleOpenCreatePlan}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Tạo kế hoạch mới</span>
              </button>
            )}

            {activeTab === "runs" && (
              <button
                onClick={handleOpenCreateRun}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Play size={14} />
                <span>Tạo đợt chạy test</span>
              </button>
            )}

            {activeTab === "sets" && (
              <button
                onClick={handleOpenCreateSet}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Tạo nhóm Test mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Body Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "plans" ? (
            /* TAB 1: TEST PLANS */
            <div>
              {filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                    <ClipboardList size={28} />
                  </div>
                  <h3 className="text-[16px] font-semibold text-slate-800 mb-1">
                    {searchQuery || statusFilter !== "ALL"
                      ? "Không tìm thấy kế hoạch kiểm thử phù hợp"
                      : "Chưa có kế hoạch kiểm thử nào"}
                  </h3>
                  <p className="text-[13px] text-slate-500 max-w-md mb-4">
                    Kế hoạch kiểm thử (Test Plan) giúp bạn tổ chức các ca test theo từng Sprint hoặc bản phát hành Release để theo dõi tiến độ Pass/Fail.
                  </p>
                  <button
                    onClick={handleOpenCreatePlan}
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                    <span>Tạo kế hoạch kiểm thử đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredPlans.map((plan) => {
                    const statusCfg = PLAN_STATUS_MAP[plan.status];
                    const metrics = plan.metrics || {
                      total: plan.testCases?.length || 0,
                      passed: 0,
                      failed: 0,
                      blocked: 0,
                      skipped: 0,
                      untested: plan.testCases?.length || 0,
                      completed: 0,
                      passPercentage: 0,
                      failPercentage: 0,
                      blockedPercentage: 0,
                      completionPercentage: 0,
                    };

                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleViewPlanDetail(plan)}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                                />
                                {statusCfg.label}
                              </span>

                              {plan.sprint && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  <Layers size={11} className="text-indigo-500" />
                                  {plan.sprint.name}
                                </span>
                              )}

                              {plan.dueDate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                                  <Calendar size={11} className="text-slate-400" />
                                  {new Date(plan.dueDate).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleRunPlan(plan, e)}
                                className="px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1"
                                title="Khởi tạo Test Run từ kế hoạch này"
                              >
                                <Play size={11} /> Chạy test
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditPlan(plan);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeletePlan(plan, e)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                            {plan.name}
                          </h3>
                          {plan.description && (
                            <p className="text-[12px] text-slate-500 line-clamp-2 mb-3">
                              {plan.description}
                            </p>
                          )}
                        </div>

                        {/* Progress Bar & Metrics */}
                        <div className="pt-3 border-t border-slate-100 mt-2">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-medium text-slate-600">
                              {metrics.total} ca test tổng cộng
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-600">
                                {metrics.passPercentage}% Pass
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">
                                {metrics.completionPercentage}% Thực thi
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            {metrics.passed > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.passed / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-emerald-500"
                              />
                            )}
                            {metrics.failed > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.failed / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-red-500"
                              />
                            )}
                            {metrics.blocked > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.blocked / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-amber-500"
                              />
                            )}
                            {metrics.skipped > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.skipped / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-purple-500"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 size={12} /> {metrics.passed} Pass
                              </span>
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                <XCircle size={12} /> {metrics.failed} Fail
                              </span>
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                <AlertTriangle size={12} /> {metrics.blocked} Blocked
                              </span>
                            </div>

                            <span className="inline-flex items-center text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform text-[12px]">
                              Chi tiết <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "runs" ? (
            /* TAB 2: TEST RUNS (Execution & Focus Runner) */
            <div>
              {filteredRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                    <Play size={28} />
                  </div>
                  <h3 className="text-[16px] font-semibold text-slate-800 mb-1">
                    {searchQuery || statusFilter !== "ALL"
                      ? "Không tìm thấy đợt thực thi phù hợp"
                      : "Chưa có đợt thực thi kiểm thử nào"}
                  </h3>
                  <p className="text-[13px] text-slate-500 max-w-md mb-4">
                    Đợt thực thi (Test Run) cho phép bạn chạy kiểm thử tập trung theo từng bước, ghi nhận kết quả Pass/Fail, tính thời gian chạy và tự động tạo Bug 1-Click khi có lỗi.
                  </p>
                  <button
                    onClick={handleOpenCreateRun}
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Play size={15} />
                    <span>Tạo đợt chạy test đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredRuns.map((run) => {
                    const metrics = run.metrics || {
                      total: run.results?.length || 0,
                      passed: 0,
                      failed: 0,
                      blocked: 0,
                      skipped: 0,
                      untested: run.results?.length || 0,
                      completed: 0,
                      passPercentage: 0,
                      failPercentage: 0,
                      blockedPercentage: 0,
                      completionPercentage: 0,
                    };

                    return (
                      <div
                        key={run.id}
                        onClick={() => handleViewRunDetail(run)}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          {/* Run Header Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  run.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    run.status === "COMPLETED"
                                      ? "bg-emerald-500"
                                      : "bg-blue-500 animate-pulse"
                                  }`}
                                />
                                {run.status === "COMPLETED"
                                  ? "Hoàn thành"
                                  : "Đang chạy"}
                              </span>

                              {run.environment && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  <Monitor size={11} className="text-indigo-600" />
                                  {run.environment.name}
                                </span>
                              )}

                              {run.plan && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                                  <Layers size={11} className="text-indigo-500" />
                                  {run.plan.name}
                                </span>
                              )}
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleLaunchRunner(run.id, undefined, e)}
                                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center gap-1 shadow-xs"
                                title="Mở Execution Runner"
                              >
                                <Play size={11} /> Chạy Runner
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditRun(run);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteRun(run, e)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Run Title */}
                          <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                            {run.name}
                          </h3>
                          {run.description && (
                            <p className="text-[12px] text-slate-500 line-clamp-2 mb-3">
                              {run.description}
                            </p>
                          )}
                        </div>

                        {/* Progress Bar & Breakdown */}
                        <div className="pt-3 border-t border-slate-100 mt-2">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-medium text-slate-600">
                              {metrics.total} ca kiểm thử
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-600">
                                {metrics.passPercentage}% Pass
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">
                                {metrics.completionPercentage}% Thực thi
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            {metrics.passed > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.passed / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-emerald-500"
                              />
                            )}
                            {metrics.failed > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.failed / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-red-500"
                              />
                            )}
                            {metrics.blocked > 0 && (
                              <div
                                style={{
                                  width: `${(metrics.blocked / metrics.total) * 100}%`,
                                }}
                                className="h-full bg-amber-500"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 size={12} /> {metrics.passed} Pass
                              </span>
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                <XCircle size={12} /> {metrics.failed} Fail
                              </span>
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                <AlertTriangle size={12} /> {metrics.blocked} Blocked
                              </span>
                            </div>

                            <span className="inline-flex items-center text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform text-[12px]">
                              Xem chi tiết <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* TAB 3: TEST SETS */
            <div>
              {filteredSets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                    <Layers size={28} />
                  </div>
                  <h3 className="text-[16px] font-semibold text-slate-800 mb-1">
                    {searchQuery
                      ? "Không tìm thấy nhóm test phù hợp"
                      : "Chưa có nhóm test (Test Set) nào"}
                  </h3>
                  <p className="text-[13px] text-slate-500 max-w-md mb-4">
                    Nhóm test tĩnh (Test Sets) cho phép bạn gom các ca kiểm thử theo mục đích cụ thể (ví dụ: Smoke Test, Sanity, Regression Suite) để tái sử dụng nhanh khi tạo kế hoạch kiểm thử.
                  </p>
                  <button
                    onClick={handleOpenCreateSet}
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                    <span>Tạo nhóm Test đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSets.map((setObj) => {
                    const count =
                      setObj._count?.testCases ?? setObj.testCases?.length ?? 0;

                    return (
                      <div
                        key={setObj.id}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Layers size={18} />
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditSet(setObj)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Chỉnh sửa nhóm test"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSet(setObj)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa nhóm test"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-[15px] font-bold text-slate-800 mb-1">
                            {setObj.name}
                          </h3>
                          {setObj.description ? (
                            <p className="text-[12px] text-slate-500 line-clamp-2 mb-3">
                              {setObj.description}
                            </p>
                          ) : (
                            <p className="text-[12px] text-slate-400 italic mb-3">
                              Không có mô tả
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-slate-100 text-slate-700">
                            <FolderCheck size={13} className="text-indigo-600" />
                            {count} ca test
                          </span>

                          <button
                            onClick={() => handleOpenEditSet(setObj)}
                            className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                          >
                            Quản lý ca test →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test Plan Modal */}
      <TestPlanModal
        projectId={projectId}
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        editPlan={editingPlan}
      />

      {/* Test Set Modal */}
      <TestSetModal
        projectId={projectId}
        isOpen={showSetModal}
        onClose={() => setShowSetModal(false)}
        editSet={editingSet}
      />

      {/* Test Run Modal */}
      <TestRunModal
        projectId={projectId}
        isOpen={showRunModal}
        onClose={() => {
          setShowRunModal(false);
          loadData();
        }}
        editRun={editingRun}
        defaultPlanId={runDefaultPlanId}
      />

      {/* Execution Runner Modal */}
      {showRunnerModal && (
        <ExecutionRunnerModal
          projectId={projectId}
          runId={runnerRunId}
          isOpen={showRunnerModal}
          onClose={() => {
            setShowRunnerModal(false);
            loadData();
          }}
          initialCaseId={runnerCaseId}
        />
      )}
    </div>
  );
}
